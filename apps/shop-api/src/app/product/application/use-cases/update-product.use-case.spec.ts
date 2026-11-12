import { ProductReferenceNotFoundError } from '../../domain/errors/product-reference-not-found.error';
import { DomainValidationError } from '../../../shared/domain/errors/domain-validation.error';
import type { ProductRepository } from '../../domain/product.repository';
import { UpdateProductUseCase } from './update-product.use-case';
import { Product } from '../../domain/product.entity';
import type { ProductContentProps } from '../../domain/value-objects/product-content.value-object';
import { NotFoundException } from '@nestjs/common';

const IMAGE = 'https://example.com/images/produit.jpg';

jest.mock('uuid', () => ({
  v4: jest.fn(() => '12345678-1234-4123-8123-123456789abc'),
  validate: jest.fn((value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value),
  ),
}));

const PRODUCT_ID = 'e3bb189e-8bf9-4888-9912-ace4e6543002';
const PRODUCER_ID = 'a3bb189e-8bf9-4888-9912-ace4e6543002';
const CATEGORY_A = 'b3bb189e-8bf9-4888-9912-ace4e6543002';
const CATEGORY_B = 'c3bb189e-8bf9-4888-9912-ace4e6543002';

const existingProduct = (): Product =>
  Product.reconstitute(PRODUCT_ID, 'Pommes Golden', 3.5, 5.5, 20, 5, PRODUCER_ID, CATEGORY_A, IMAGE, 'KG');

const piece = (content: ProductContentProps | null = null): Product =>
  Product.reconstitute(PRODUCT_ID, 'Melon', 3, 5.5, 20, 5, PRODUCER_ID, CATEGORY_A, IMAGE, 'PIECE', content);

const lot = (): Product =>
  Product.reconstitute(PRODUCT_ID, 'Yaourts', 3, 5.5, 20, 5, PRODUCER_ID, CATEGORY_A, IMAGE, 'LOT', {
    itemCount: 4,
    itemSize: { amount: 125, unit: 'g' },
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

const OTHER_PRODUCER_ID = 'd3bb189e-8bf9-4888-9912-ace4e6543002';

describe('UpdateProductUseCase', () => {
  let repository: ReturnType<typeof createProductRepositoryMock>;
  let useCase: UpdateProductUseCase;

  beforeEach(() => {
    repository = createProductRepositoryMock();
    repository.findByIdOrFail.mockResolvedValue(existingProduct());
    useCase = new UpdateProductUseCase(repository);
  });

  it("applique les modifications via l'entité puis sauvegarde l'agrégat", async () => {
    const updated = await useCase.execute(PRODUCT_ID, { name: 'Pommes Gala', price: 4, minStock: 10 });

    expect(repository.findByIdOrFail).toHaveBeenCalledWith(PRODUCT_ID);
    expect(repository.save).toHaveBeenCalledWith(updated);
    expect(repository.update).not.toHaveBeenCalled();
    expect(updated.name).toBe('Pommes Gala');
    expect(updated.price).toBe(4);
    expect(updated.minStock).toBe(10);
    expect(updated.vatRate).toBe(5.5);
    expect(updated.producerId).toBe(PRODUCER_ID);
    expect(updated.categoryId).toBe(CATEGORY_A);
    expect(updated.unit).toBe('KG');
  });

  it("change l'unité puis sauvegarde", async () => {
    const updated = await useCase.execute(PRODUCT_ID, { unit: 'PIECE' });

    expect(repository.save).toHaveBeenCalledWith(updated);
    expect(updated.unit).toBe('PIECE');
  });

  it('définit puis retire le contenu', async () => {
    repository.findByIdOrFail.mockResolvedValue(piece());
    const withContent = await useCase.execute(PRODUCT_ID, { content: { itemCount: 1, itemSize: { amount: 800, unit: 'g' } } });
    expect(withContent.content?.itemSize?.amount).toBe(800);

    repository.findByIdOrFail.mockResolvedValue(withContent);
    const withoutContent = await useCase.execute(PRODUCT_ID, { content: null });

    expect(withoutContent.content).toBeNull();
    expect(repository.save).toHaveBeenLastCalledWith(withoutContent);
  });

  it("change l'unité en gardant le contenu quand il n'est pas fourni", async () => {
    repository.findByIdOrFail.mockResolvedValue(piece({ itemCount: 1, itemSize: { amount: 1, unit: 'l' } }));

    const updated = await useCase.execute(PRODUCT_ID, { unit: 'BOUTEILLE' });

    expect(updated.unit).toBe('BOUTEILLE');
    expect(updated.content?.itemSize?.amount).toBe(1);
    expect(updated.content?.itemSize?.unit).toBe('l');
  });

  it("ne touche pas au contenu quand il n'est pas fourni", async () => {
    repository.findByIdOrFail.mockResolvedValue(piece({ itemCount: 1, itemSize: { amount: 500, unit: 'g' } }));

    const updated = await useCase.execute(PRODUCT_ID, { price: 4 });

    expect(updated.content?.itemSize?.amount).toBe(500);
    expect(updated.content?.itemSize?.unit).toBe('g');
  });

  it('passe un produit en BOUTEILLE avec son contenu dans la même mise à jour', async () => {
    const updated = await useCase.execute(PRODUCT_ID, {
      unit: 'BOUTEILLE',
      content: { itemCount: 1, itemSize: { amount: 75, unit: 'ml' } },
    });

    expect(repository.save).toHaveBeenCalledWith(updated);
    expect(updated.unit).toBe('BOUTEILLE');
    expect(updated.content?.itemSize?.amount).toBe(75);
  });

  it("change le contenu d'un lot sans repréciser son unité", async () => {
    repository.findByIdOrFail.mockResolvedValue(lot());

    const updated = await useCase.execute(PRODUCT_ID, { content: { itemCount: 6, itemSize: { amount: 125, unit: 'g' } } });

    expect(updated.unit).toBe('LOT');
    expect(updated.content?.itemCount).toBe(6);
  });

  it('ne sauvegarde rien si le produit passe en BOUTEILLE sans contenu', async () => {
    await expect(useCase.execute(PRODUCT_ID, { unit: 'BOUTEILLE' })).rejects.toBeInstanceOf(
      DomainValidationError,
    );
    expect(repository.save).not.toHaveBeenCalled();
  });

  it("ne sauvegarde rien si l'on retire le contenu d'un lot", async () => {
    repository.findByIdOrFail.mockResolvedValue(lot());

    await expect(useCase.execute(PRODUCT_ID, { content: null })).rejects.toBeInstanceOf(DomainValidationError);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('ne sauvegarde rien si un contenu est donné à un produit vendu au kilo', async () => {
    await expect(
      useCase.execute(PRODUCT_ID, { content: { itemCount: 1, itemSize: { amount: 500, unit: 'g' } } }),
    ).rejects.toBeInstanceOf(DomainValidationError);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it("ne sauvegarde rien si l'unité de mesure est inconnue", async () => {
    repository.findByIdOrFail.mockResolvedValue(lot());

    await expect(
      useCase.execute(PRODUCT_ID, { content: { itemCount: 1, itemSize: { amount: 1, unit: 'cl' } } }),
    ).rejects.toBeInstanceOf(DomainValidationError);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('ne sauvegarde rien si la nouvelle unité est inconnue', async () => {
    await expect(useCase.execute(PRODUCT_ID, { unit: 'GRAMME' })).rejects.toBeInstanceOf(
      DomainValidationError,
    );
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('change le producteur et la catégorie puis sauvegarde', async () => {
    const updated = await useCase.execute(PRODUCT_ID, {
      producerId: OTHER_PRODUCER_ID,
      categoryId: CATEGORY_B,
    });

    expect(repository.save).toHaveBeenCalledWith(updated);
    expect(updated.producerId).toBe(OTHER_PRODUCER_ID);
    expect(updated.categoryId).toBe(CATEGORY_B);
  });

  it("change l'image puis sauvegarde", async () => {
    const updated = await useCase.execute(PRODUCT_ID, { image: 'https://example.com/images/gala.jpg' });

    expect(repository.save).toHaveBeenCalledWith(updated);
    expect(updated.image).toBe('https://example.com/images/gala.jpg');
  });

  it("ne sauvegarde rien si la nouvelle image n'est pas une URL", async () => {
    await expect(useCase.execute(PRODUCT_ID, { image: 'gala.jpg' })).rejects.toBeInstanceOf(DomainValidationError);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it("propage l'erreur si le nouveau producteur ou la nouvelle catégorie n'existe pas", async () => {
    repository.save.mockRejectedValue(new ProductReferenceNotFoundError());

    await expect(useCase.execute(PRODUCT_ID, { categoryId: CATEGORY_B })).rejects.toBeInstanceOf(
      ProductReferenceNotFoundError,
    );
  });

  it('ne sauvegarde rien si le stock minimum dépasse le stock', async () => {
    await expect(useCase.execute(PRODUCT_ID, { minStock: 21 })).rejects.toBeInstanceOf(DomainValidationError);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it("propage l'erreur si le produit n'existe pas", async () => {
    repository.findByIdOrFail.mockRejectedValue(new NotFoundException());

    await expect(useCase.execute(PRODUCT_ID, { price: 4 })).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.save).not.toHaveBeenCalled();
  });
});
