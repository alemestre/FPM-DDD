import { ProductReferenceNotFoundError } from '../../domain/errors/product-reference-not-found.error';
import { DomainValidationError } from '../../../shared/domain/errors/domain-validation.error';
import type { ProductRepository } from '../../domain/product.repository';
import { CreateProductUseCase } from './create-product.use-case';
import { Product } from '../../domain/product.entity';

jest.mock('uuid', () => ({
  v4: jest.fn(() => '12345678-1234-4123-8123-123456789abc'),
  validate: jest.fn((value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value),
  ),
}));

const PRODUCER_ID = 'a3bb189e-8bf9-4888-9912-ace4e6543002';
const CATEGORY_A = 'b3bb189e-8bf9-4888-9912-ace4e6543002';
const CATEGORY_B = 'c3bb189e-8bf9-4888-9912-ace4e6543002';

const createGenericRepositoryMock = <T>() => ({
  save: jest.fn(async (entity: T) => entity),
  findById: jest.fn(),
  findByIdOrFail: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

const createProductRepositoryMock = (): jest.Mocked<ProductRepository> =>
  createGenericRepositoryMock<Product>() as jest.Mocked<ProductRepository>;

describe('CreateProductUseCase', () => {
  let repository: ReturnType<typeof createProductRepositoryMock>;
  let useCase: CreateProductUseCase;

  const input = {
    name: 'Pommes Golden',
    price: 3.5,
    vatRate: 5.5,
    stock: 20,
    minStock: 5,
    producerId: PRODUCER_ID,
    categoryIds: [CATEGORY_A, CATEGORY_B],
  };

  beforeEach(() => {
    repository = createProductRepositoryMock();
    useCase = new CreateProductUseCase(repository);
  });

  it('crée le produit puis le sauvegarde', async () => {
    const product = await useCase.execute(input);

    expect(repository.save).toHaveBeenCalledWith(product);
    expect(product.id).toBe('12345678-1234-4123-8123-123456789abc');
    expect(product.producerId).toBe(PRODUCER_ID);
    expect(product.stock).toBe(20);
    expect(product.minStock).toBe(5);
    expect(product.categoryIds).toEqual([CATEGORY_A, CATEGORY_B]);
  });

  it('crée un produit sans catégorie', async () => {
    const product = await useCase.execute({ ...input, categoryIds: undefined });

    expect(product.categoryIds).toEqual([]);
  });

  it("propage l'erreur si le producteur ou une catégorie n'existe pas", async () => {
    repository.save.mockRejectedValue(new ProductReferenceNotFoundError());

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(ProductReferenceNotFoundError);
  });

  it('rejette un stock inférieur au stock minimum sans sauvegarder', async () => {
    await expect(useCase.execute({ ...input, stock: 4 })).rejects.toBeInstanceOf(DomainValidationError);
    expect(repository.save).not.toHaveBeenCalled();
  });
});
