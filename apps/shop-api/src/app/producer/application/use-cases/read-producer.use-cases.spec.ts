import type { ProducerRepository } from '../../domain/producer.repository';
import { ListProducersUseCase } from './list-producers.use-case';
import { GetProducerUseCase } from './get-producer.use-case';
import { Producer } from '../../domain/producer.entity';

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

describe('use cases de lecture des producteurs', () => {
  let repository: jest.Mocked<ProducerRepository>;

  beforeEach(() => {
    repository = createRepositoryMock();
  });

  it('ListProducersUseCase retourne tous les producteurs, actifs ou non', async () => {
    const producers = [existingProducer(true), existingProducer(false)];
    repository.findAll.mockResolvedValue(producers);

    await expect(new ListProducersUseCase(repository).execute()).resolves.toBe(producers);
  });

  it('GetProducerUseCase charge le producteur par id', async () => {
    const producer = existingProducer();
    repository.findByIdOrFail.mockResolvedValue(producer);

    await expect(new GetProducerUseCase(repository).execute(PRODUCER_ID)).resolves.toBe(producer);
    expect(repository.findByIdOrFail).toHaveBeenCalledWith(PRODUCER_ID);
  });
});
