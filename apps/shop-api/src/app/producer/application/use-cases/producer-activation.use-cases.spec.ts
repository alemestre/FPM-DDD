import type { ProducerRepository } from '../../domain/producer.repository';
import { DeactivateProducerUseCase } from './deactivate-producer.use-case';
import { ActivateProducerUseCase } from './activate-producer.use-case';
import { Producer } from '../../domain/producer.entity';
import { NotFoundException } from '@nestjs/common';

jest.mock('uuid', () => ({
  v4: jest.fn(() => '12345678-1234-4123-8123-123456789abc'),
  validate: jest.fn((value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value),
  ),
}));

const PRODUCER_ID = 'a3bb189e-8bf9-4888-9912-ace4e6543002';

const existingProducer = (isActive = true): Producer =>
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

const createRepositoryMock = (): jest.Mocked<ProducerRepository> => ({
  save: jest.fn(async (producer: Producer) => producer),
  findById: jest.fn(),
  findByIdOrFail: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

describe('activation des producteurs', () => {
  let repository: jest.Mocked<ProducerRepository>;

  beforeEach(() => {
    repository = createRepositoryMock();
  });

  it('DeactivateProducerUseCase désactive puis sauvegarde le producteur', async () => {
    repository.findByIdOrFail.mockResolvedValue(existingProducer(true));

    const producer = await new DeactivateProducerUseCase(repository).execute(PRODUCER_ID);

    expect(repository.findByIdOrFail).toHaveBeenCalledWith(PRODUCER_ID);
    expect(repository.save).toHaveBeenCalledWith(producer);
    expect(repository.delete).not.toHaveBeenCalled();
    expect(producer.isActive).toBe(false);
  });

  it('ActivateProducerUseCase réactive puis sauvegarde le producteur', async () => {
    repository.findByIdOrFail.mockResolvedValue(existingProducer(false));

    const producer = await new ActivateProducerUseCase(repository).execute(PRODUCER_ID);

    expect(repository.save).toHaveBeenCalledWith(producer);
    expect(producer.isActive).toBe(true);
  });

  it.each([
    ['DeactivateProducerUseCase', DeactivateProducerUseCase],
    ['ActivateProducerUseCase', ActivateProducerUseCase],
  ])("%s propage l'erreur si le producteur n'existe pas", async (_label, UseCase) => {
    repository.findByIdOrFail.mockRejectedValue(new NotFoundException());

    await expect(new UseCase(repository).execute(PRODUCER_ID)).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.save).not.toHaveBeenCalled();
  });
});
