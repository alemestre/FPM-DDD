import type { ProductRepository, ProductWithProducer } from '../../domain/product.repository';
import { DeleteProductUseCase } from './delete-product.use-case';
import { ListProductsUseCase } from './list-products.use-case';
import { GetProductUseCase } from './get-product.use-case';
import { GetProductsByCategoryIdUseCase } from './get-products-by-category-id.use-case';
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

const withProducer = (product: Product): ProductWithProducer => ({
  product,
  producer: { id: PRODUCER_ID, name: 'Ferme des Lilas' },
});

const createGenericRepositoryMock = <T>() => ({
  save: jest.fn(async (entity: T) => entity),
  findById: jest.fn(),
  findByIdOrFail: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

const createProductRepositoryMock = (): jest.Mocked<ProductRepository> =>
  ({ ...createGenericRepositoryMock<Product>(), findManyWithProducer: jest.fn(), findByIdWithProducerOrFail: jest.fn() }) as jest.Mocked<ProductRepository>;

describe('use cases de lecture et suppression', () => {
  let repository: ReturnType<typeof createProductRepositoryMock>;

  beforeEach(() => {
    repository = createProductRepositoryMock();
  });

  it('ListProductsUseCase retourne tous les produits avec leur producteur', async () => {
    const products = [withProducer(existingProduct())];
    repository.findManyWithProducer.mockResolvedValue(products);

    await expect(new ListProductsUseCase(repository).execute()).resolves.toBe(products);
    expect(repository.findManyWithProducer).toHaveBeenCalledWith();
  });

  it('GetProductsByCategoryIdUseCase retourne les produits de la catégorie avec leur producteur', async () => {
    const products = [withProducer(existingProduct())];
    repository.findManyWithProducer.mockResolvedValue(products);

    await expect(new GetProductsByCategoryIdUseCase(repository).execute(CATEGORY_A)).resolves.toBe(products);
    expect(repository.findManyWithProducer).toHaveBeenCalledWith(CATEGORY_A);
  });

  it('GetProductsByCategoryIdUseCase retourne une liste vide si la catégorie n\'a aucun produit', async () => {
    repository.findManyWithProducer.mockResolvedValue([]);

    await expect(new GetProductsByCategoryIdUseCase(repository).execute(CATEGORY_A)).resolves.toEqual([]);
  });

  it('GetProductUseCase charge le produit et son producteur par id', async () => {
    const product = withProducer(existingProduct());
    repository.findByIdWithProducerOrFail.mockResolvedValue(product);

    await expect(new GetProductUseCase(repository).execute(PRODUCT_ID)).resolves.toBe(product);
    expect(repository.findByIdWithProducerOrFail).toHaveBeenCalledWith(PRODUCT_ID);
  });

  it('DeleteProductUseCase supprime le produit par id', async () => {
    repository.delete.mockResolvedValue(undefined);

    await new DeleteProductUseCase(repository).execute(PRODUCT_ID);

    expect(repository.delete).toHaveBeenCalledWith(PRODUCT_ID);
  });
});
