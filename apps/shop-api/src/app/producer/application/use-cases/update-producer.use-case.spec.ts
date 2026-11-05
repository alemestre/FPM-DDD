import { ProducerRepository } from '../../domain/producer.repository';
import { UpdateProducerUseCase } from './update-producer.use-case';
import { Producer } from '../../domain/producer.entity';
import { NotFoundException } from '@nestjs/common';

jest.mock("uuid", () => ({
    v4: jest.fn(() => "12345678-1234-4123-8123-123456789abc")
}));

const PRODUCER_ID = 'a3bb189e-8bf9-3888-9912-ace4e6543002';

const existingProducer = (): Producer =>
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
    true,
  );

const createRepositoryMock = (): jest.Mocked<ProducerRepository> => ({
  save: jest.fn(async (producer: Producer) => producer),
  findById: jest.fn(),
  findByIdOrFail: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

describe('UpdateProducerUseCase', () => {
  let repository: jest.Mocked<ProducerRepository>;
  let useCase: UpdateProducerUseCase;

  beforeEach(() => {
    repository = createRepositoryMock();
    useCase = new UpdateProducerUseCase(repository);
  });

  it("applique les modifications via l'entité puis sauvegarde l'agrégat", async () => {
    repository.findByIdOrFail.mockResolvedValue(existingProducer());

    const updated = await useCase.execute(PRODUCER_ID, {
      contactEmail: ' Nouveau@Ferme-Moulin.FR ',
      phoneNumber: '01 45 67 89 10',
      vatNumber: 'fr02000000029',
      postalCode: '69 002',
      city: 'Lyon',
    });

    expect(repository.findByIdOrFail).toHaveBeenCalledWith(PRODUCER_ID);
    expect(repository.save).toHaveBeenCalledWith(updated);
    expect(repository.update).not.toHaveBeenCalled();
    expect(updated.contactEmail).toBe('nouveau@ferme-moulin.fr');
    expect(updated.phoneNumber).toBe('+33145678910');
    expect(updated.vatNumber).toBe('FR02000000029');
    expect(updated.postalCode).toBe('69002');
    expect(updated.city).toBe('Lyon');
    expect(updated.name).toBe('Ferme du Moulin');
    expect(updated.addressLine1).toBe('1 chemin du Moulin');
  });

  it('ne sauvegarde rien si une valeur est invalide', async () => {
    repository.findByIdOrFail.mockResolvedValue(existingProducer());

    await expect(
      useCase.execute(PRODUCER_ID, { vatNumber: 'FR41303265045' }),
    ).rejects.toThrow('clé du numéro de TVA');
    expect(repository.save).not.toHaveBeenCalled();
  });

  it("propage l'erreur si le producteur n'existe pas", async () => {
    repository.findByIdOrFail.mockRejectedValue(new NotFoundException());

    await expect(useCase.execute(PRODUCER_ID, { city: 'Lyon' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(repository.save).not.toHaveBeenCalled();
  });
});
