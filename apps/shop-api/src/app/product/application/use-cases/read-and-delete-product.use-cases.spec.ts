import type { ProductRepository } from '../../domain/product.repository';
import { DeleteProductUseCase } from './delete-product.use-case';
import { ListProductsUseCase } from './list-products.use-case';
import { GetProductUseCase } from './get-product.use-case';
import { Product } from '../../domain/product.entity';

jest.mock('uuid', () => ({
  v4: jest.fn(() => '12345678-1234-4123-8123-123456789abc'),
  validate: jest.fn((value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value),
  ),
}));

const PRODUCT_ID = 'e3bb189e-8bf9-4888-9912-ace4e6543002';
const PRODUCER_ID = 'a3bb189e-8bf9-4888-9912-ace4e6543002';
const CATEGORY_A = 'b3bb189e-8bf9-4888-9912-ace4e6543002';

const existingProduct = (): Product =>
  Product.reconstitute(PRODUCT_ID, 'Pommes Golden', 3.5, 5.5, 20, 5, PRODUCER_ID, CATEGORY_A, 'KG');

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

describe('use cases de lecture et suppression', () => {
  let repository: ReturnType<typeof createProductRepositoryMock>;

  beforeEach(() => {
    repository = createProductRepositoryMock();
  });

  it('ListProductsUseCase retourne tous les produits', async () => {
    const products = [existingProduct()];
    repository.findAll.mockResolvedValue(products);

    await expect(new ListProductsUseCase(repository).execute()).resolves.toBe(products);
  });

  it('GetProductUseCase charge le produit par id', async () => {
    const product = existingProduct();
    repository.findByIdOrFail.mockResolvedValue(product);

    await expect(new GetProductUseCase(repository).execute(PRODUCT_ID)).resolves.toBe(product);
    expect(repository.findByIdOrFail).toHaveBeenCalledWith(PRODUCT_ID);
  });

  it('DeleteProductUseCase supprime le produit par id', async () => {
    repository.delete.mockResolvedValue(undefined);

    await new DeleteProductUseCase(repository).execute(PRODUCT_ID);

    expect(repository.delete).toHaveBeenCalledWith(PRODUCT_ID);
  });
});
