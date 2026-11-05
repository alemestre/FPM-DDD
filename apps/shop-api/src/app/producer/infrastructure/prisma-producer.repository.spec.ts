import { PrismaProducerRepository } from './prisma-producer.repository';
import type { PrismaService } from '../../../prisma/prisma.service';
import { Producer } from '../domain/producer.entity';
import { NotFoundException } from '@nestjs/common';

jest.mock('uuid', () => ({
  v4: jest.fn(() => '12345678-1234-4123-8123-123456789abc'),
  validate: jest.fn((value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value),
  ),
}));

jest.mock('../../../prisma/prisma.service', () => ({ PrismaService: class {} }));

const PRODUCER_ID = 'a3bb189e-8bf9-4888-9912-ace4e6543002';

const producerRow = (overrides: Record<string, unknown> = {}) => ({
  uid: 1,
  id: PRODUCER_ID,
  name: 'Ferme du Moulin',
  contactEmail: 'contact@ferme-moulin.fr',
  phoneNumber: '+33612345678',
  tvaNumber: 'FR40303265045',
  addressLine1: '1 chemin du Moulin',
  addressLine2: '',
  postalCode: '75001',
  city: 'Paris',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const existingProducer = (isActive: boolean) =>
  Producer.reconstitute(
    PRODUCER_ID,
    'Ferme du Moulin',
    'contact@ferme-moulin.fr',
    '+33612345678',
    'FR40303265045',
    '1 chemin du Moulin',
    '75001',
    'Paris',
    '',
    isActive,
  );

const createPrismaMock = () => ({
  producer: {
    upsert: jest.fn(),
    update: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    delete: jest.fn(),
  },
});

describe('PrismaProducerRepository', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let repository: PrismaProducerRepository;

  beforeEach(() => {
    prisma = createPrismaMock();
    repository = new PrismaProducerRepository(prisma as unknown as PrismaService);
  });

  it('save upsert tous les champs, vatNumber vers tvaNumber et isActive compris', async () => {
    prisma.producer.upsert.mockResolvedValue(producerRow({ isActive: false }));

    const saved = await repository.save(existingProducer(false));

    const data = {
      name: 'Ferme du Moulin',
      contactEmail: 'contact@ferme-moulin.fr',
      phoneNumber: '+33612345678',
      tvaNumber: 'FR40303265045',
      addressLine1: '1 chemin du Moulin',
      addressLine2: '',
      postalCode: '75001',
      city: 'Paris',
      isActive: false,
    };
    expect(prisma.producer.upsert).toHaveBeenCalledWith({
      where: { id: PRODUCER_ID },
      update: data,
      create: { id: PRODUCER_ID, ...data },
    });
    expect(saved).toBeInstanceOf(Producer);
    expect(saved.id).toBe(PRODUCER_ID);
    expect(saved.isActive).toBe(false);
  });

  it('update ne transmet que les champs fournis', async () => {
    prisma.producer.update.mockResolvedValue(producerRow({ city: 'Lyon', isActive: false }));

    await repository.update(PRODUCER_ID, { city: 'Lyon', isActive: false });

    expect(prisma.producer.update).toHaveBeenCalledWith({
      where: { id: PRODUCER_ID },
      data: { city: 'Lyon', isActive: false },
    });
  });

  it('reconstitue le producteur à partir de la ligne, tvaNumber et isActive compris', async () => {
    prisma.producer.findUnique.mockResolvedValue(producerRow({ isActive: false }));

    const producer = await repository.findById(PRODUCER_ID);

    expect(producer?.vatNumber).toBe('FR40303265045');
    expect(producer?.isActive).toBe(false);
  });

  it("findById renvoie null et findByIdOrFail lève NotFoundException si le producteur n'existe pas", async () => {
    prisma.producer.findUnique.mockResolvedValue(null);

    await expect(repository.findById(PRODUCER_ID)).resolves.toBeNull();
    await expect(repository.findByIdOrFail(PRODUCER_ID)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('findAll reconstitue tous les producteurs', async () => {
    prisma.producer.findMany.mockResolvedValue([producerRow(), producerRow({ isActive: false })]);

    const producers = await repository.findAll();

    expect(producers.map((p: Producer) => p.isActive)).toEqual([true, false]);
  });
});
