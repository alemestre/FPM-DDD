import { DomainValidationErrorFilter } from '../../../shared/interface/http/domain-validation-error.filter';
import { type INestApplication, NotFoundException } from '@nestjs/common';
import { ProducerRepository } from '../../domain/producer.repository';
import { Producer } from '../../domain/producer.entity';
import { ProducerModule } from '../../producer.module';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { Test } from '@nestjs/testing';

jest.mock('uuid', () => ({
  v4: jest.fn(() => '12345678-1234-4123-8123-123456789abc'),
  validate: jest.fn((value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value),
  ),
}));

jest.mock('../../infrastructure/prisma-producer.repository', () => ({ PrismaProducerRepository: class {} }));

const NEW_ID = '12345678-1234-4123-8123-123456789abc';
const PRODUCER_ID = 'a3bb189e-8bf9-4888-9912-ace4e6543002';

class InMemoryProducerRepository extends ProducerRepository {
  readonly producers = new Map<string, Producer>();

  async save(producer: Producer): Promise<Producer> {
    this.producers.set(producer.id, producer);
    return producer;
  }

  async findById(id: string): Promise<Producer | null> {
    return this.producers.get(id) ?? null;
  }

  async findByIdOrFail(id: string): Promise<Producer> {
    const producer = this.producers.get(id);
    if (!producer) throw new NotFoundException();
    return producer;
  }

  async findAll(): Promise<Producer[]> {
    return [...this.producers.values()];
  }

  async update(): Promise<Producer> {
    throw new Error('not used by the producer use cases');
  }

  async delete(): Promise<void> {
    throw new Error('producers are never deleted');
  }
}

describe('ProducerController (HTTP)', () => {
  let app: INestApplication;
  let repository: InMemoryProducerRepository;
  let baseUrl: string;

  const request = async (method: string, path: string, body?: unknown) => {
    const response = await fetch(`${baseUrl}/producers${path}`, {
      method,
      headers: { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await response.text();
    return { status: response.status, body: text ? JSON.parse(text) : undefined };
  };

  const seedProducer = (isActive = true) =>
    repository.producers.set(
      PRODUCER_ID,
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
      ),
    );

  const expectedProducer = {
    id: PRODUCER_ID,
    name: 'Ferme du Moulin',
    email: 'contact@ferme-moulin.fr',
    phone: '+33612345678',
    vatNumber: 'FR40303265045',
    addressLine1: '1 chemin du Moulin',
    addressLine2: '',
    postalCode: '75001',
    city: 'Paris',
    isActive: true,
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ProducerModule],
      providers: [
        { provide: APP_PIPE, useClass: ZodValidationPipe },
        { provide: APP_FILTER, useClass: DomainValidationErrorFilter },
      ],
    })
      .overrideProvider(ProducerRepository)
      .useClass(InMemoryProducerRepository)
      .compile();

    app = moduleRef.createNestApplication();
    await app.listen(0);
    baseUrl = await app.getUrl();
    repository = moduleRef.get(ProducerRepository);
  });

  beforeEach(() => repository.producers.clear());

  afterAll(async () => {
    await app.close();
  });

  describe('POST /producers', () => {
    const payload = {
      name: 'Ferme du Moulin',
      email: 'contact@ferme-moulin.fr',
      phone: '06 12 34 56 78',
      vatNumber: 'FR40303265045',
      addressLine1: '1 chemin du Moulin',
      postalCode: '75001',
      city: 'Paris',
    };

    it('crée un producteur actif et renvoie sa représentation publique (201)', async () => {
      const { status, body } = await request('POST', '', payload);

      expect(status).toBe(201);
      expect(body).toEqual({ ...expectedProducer, id: NEW_ID });
    });

    it('renvoie 400 si le corps est invalide', async () => {
      expect((await request('POST', '', { ...payload, email: 'pas-un-email' })).status).toBe(400);
    });

    it('renvoie 400 si le numéro de TVA est invalide', async () => {
      const { status, body } = await request('POST', '', { ...payload, vatNumber: 'FR41303265045' });

      expect(status).toBe(400);
      expect(body.message).toContain('clé du numéro de TVA');
    });
  });

  describe('GET', () => {
    it('liste tous les producteurs, actifs ou non', async () => {
      seedProducer(false);

      const { status, body } = await request('GET', '');

      expect(status).toBe(200);
      expect(body).toEqual([{ ...expectedProducer, isActive: false }]);
    });

    it('renvoie un producteur par id', async () => {
      seedProducer();

      expect(await request('GET', `/${PRODUCER_ID}`)).toEqual({ status: 200, body: expectedProducer });
    });

    it("renvoie 404 si le producteur n'existe pas", async () => {
      expect((await request('GET', `/${PRODUCER_ID}`)).status).toBe(404);
    });

    it("renvoie 400 si l'id n'est pas un UUID", async () => {
      expect((await request('GET', '/abc')).status).toBe(400);
    });
  });

  describe('PATCH /producers/:id', () => {
    it('met à jour les champs fournis', async () => {
      seedProducer();

      const { status, body } = await request('PATCH', `/${PRODUCER_ID}`, { city: 'Lyon', postalCode: '69002' });

      expect(status).toBe(200);
      expect(body).toEqual({ ...expectedProducer, city: 'Lyon', postalCode: '69002' });
    });

    it('refuse de modifier isActive directement (400)', async () => {
      seedProducer();

      const { status } = await request('PATCH', `/${PRODUCER_ID}`, { isActive: false });

      expect(status).toBe(400);
      expect(repository.producers.get(PRODUCER_ID)?.isActive).toBe(true);
    });
  });

  describe('activation', () => {
    it('désactive puis réactive un producteur sans le supprimer', async () => {
      seedProducer();

      const deactivated = await request('POST', `/${PRODUCER_ID}/deactivate`);
      expect(deactivated).toEqual({ status: 200, body: { ...expectedProducer, isActive: false } });
      expect(repository.producers.has(PRODUCER_ID)).toBe(true);

      const activated = await request('POST', `/${PRODUCER_ID}/activate`);
      expect(activated).toEqual({ status: 200, body: expectedProducer });
    });

    it("renvoie 404 si le producteur à désactiver n'existe pas", async () => {
      expect((await request('POST', `/${PRODUCER_ID}/deactivate`)).status).toBe(404);
    });
  });

  it("n'expose pas de route DELETE (404)", async () => {
    seedProducer();

    expect((await request('DELETE', `/${PRODUCER_ID}`)).status).toBe(404);
    expect(repository.producers.has(PRODUCER_ID)).toBe(true);
  });
});
