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
    categoryId: CATEGORY_A,
    image: 'https://example.com/images/pommes.jpg',
    unit: 'BOTTE',
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
    expect(product.categoryId).toBe(CATEGORY_A);
    expect(product.unit).toBe('BOTTE');
    expect(product.image).toBe('https://example.com/images/pommes.jpg');
  });

  it("crée le produit en KG quand l'unité n'est pas fournie", async () => {
    const product = await useCase.execute({ ...input, unit: undefined });

    expect(product.unit).toBe('KG');
  });

  it('crée le produit avec son contenu', async () => {
    const product = await useCase.execute({
      ...input,
      unit: 'LOT',
      content: { itemCount: 4, itemSize: { amount: 125, unit: 'g' } },
    });

    expect(product.content?.itemCount).toBe(4);
    expect(product.content?.itemSize?.amount).toBe(125);
    expect(product.content?.itemSize?.unit).toBe('g');
  });

  it("crée le produit sans contenu quand il n'est pas fourni", async () => {
    const product = await useCase.execute(input);

    expect(product.content).toBeNull();
  });

  it('crée une bouteille avec son contenu', async () => {
    const product = await useCase.execute({
      ...input,
      unit: 'BOUTEILLE',
      content: { itemCount: 1, itemSize: { amount: 0.75, unit: 'l' } },
    });

    expect(repository.save).toHaveBeenCalledWith(product);
    expect(product.unit).toBe('BOUTEILLE');
    expect(product.content?.itemSize?.amount).toBe(0.75);
  });

  it('crée une douzaine avec ses 12 articles sans contenu fourni', async () => {
    const product = await useCase.execute({ ...input, unit: 'DOUZAINE' });

    expect(product.content?.itemCount).toBe(12);
  });

  it.each(['LOT', 'BOUTEILLE'])('rejette un produit vendu en %s sans contenu sans sauvegarder', async (unit) => {
    await expect(useCase.execute({ ...input, unit })).rejects.toBeInstanceOf(DomainValidationError);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('rejette un contenu sur un produit vendu au kilo sans sauvegarder', async () => {
    await expect(
      useCase.execute({ ...input, unit: 'KG', content: { itemCount: 1, itemSize: { amount: 500, unit: 'g' } } }),
    ).rejects.toBeInstanceOf(DomainValidationError);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('rejette une unité de mesure inconnue sans sauvegarder', async () => {
    await expect(
      useCase.execute({ ...input, unit: 'LOT', content: { itemCount: 1, itemSize: { amount: 1, unit: 'cl' } } }),
    ).rejects.toBeInstanceOf(DomainValidationError);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('rejette une unité inconnue sans sauvegarder', async () => {
    await expect(useCase.execute({ ...input, unit: 'GRAMME' })).rejects.toBeInstanceOf(
      DomainValidationError,
    );
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('rejette une image qui n\'est pas une URL sans sauvegarder', async () => {
    await expect(useCase.execute({ ...input, image: 'pommes.jpg' })).rejects.toBeInstanceOf(DomainValidationError);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('rejette un categoryId invalide sans sauvegarder', async () => {
    await expect(useCase.execute({ ...input, categoryId: 'pas-un-uuid' })).rejects.toBeInstanceOf(
      DomainValidationError,
    );
    expect(repository.save).not.toHaveBeenCalled();
  });

  it("propage l'erreur si le producteur ou la catégorie n'existe pas", async () => {
    repository.save.mockRejectedValue(new ProductReferenceNotFoundError());

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(ProductReferenceNotFoundError);
  });

  it('rejette un stock inférieur au stock minimum sans sauvegarder', async () => {
    await expect(useCase.execute({ ...input, stock: 4 })).rejects.toBeInstanceOf(DomainValidationError);
    expect(repository.save).not.toHaveBeenCalled();
  });
});
