import { DomainValidationError } from '../../../shared/domain/errors/domain-validation.error';
import type { ProducerRepository } from '../../domain/producer.repository';
import { CreateProducerUseCase } from './create-producer.use-case';
import { Producer } from '../../domain/producer.entity';

jest.mock('uuid', () => ({
  v4: jest.fn(() => '12345678-1234-4123-8123-123456789abc'),
  validate: jest.fn((value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value),
  ),
}));

const createRepositoryMock = (): jest.Mocked<ProducerRepository> => ({
  save: jest.fn(async (producer: Producer) => producer),
  findById: jest.fn(),
  findByIdOrFail: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

describe('CreateProducerUseCase', () => {
  const input = {
    name: 'Ferme du Moulin',
    contactEmail: ' Contact@Ferme-Moulin.FR ',
    phoneNumber: '06 12 34 56 78',
    vatNumber: 'FR40303265045',
    addressLine1: '1 chemin du Moulin',
    postalCode: '75001',
    city: 'Paris',
  };

  let repository: jest.Mocked<ProducerRepository>;
  let useCase: CreateProducerUseCase;

  beforeEach(() => {
    repository = createRepositoryMock();
    useCase = new CreateProducerUseCase(repository);
  });

  it('crée un producteur actif avec des valeurs normalisées puis le sauvegarde', async () => {
    const producer = await useCase.execute(input);

    expect(repository.save).toHaveBeenCalledWith(producer);
    expect(producer.id).toBe('12345678-1234-4123-8123-123456789abc');
    expect(producer.contactEmail).toBe('contact@ferme-moulin.fr');
    expect(producer.phoneNumber).toBe('+33612345678');
    expect(producer.addressLine2).toBe('');
    expect(producer.isActive).toBe(true);
  });

  it('ne sauvegarde rien si une valeur est invalide', async () => {
    await expect(useCase.execute({ ...input, vatNumber: 'FR41303265045' })).rejects.toBeInstanceOf(
      DomainValidationError,
    );
    expect(repository.save).not.toHaveBeenCalled();
  });
});
