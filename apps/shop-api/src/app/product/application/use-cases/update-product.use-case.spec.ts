import { ProductReferenceNotFoundError } from '../../domain/errors/product-reference-not-found.error';
import { DomainValidationError } from '../../../shared/domain/errors/domain-validation.error';
import type { ProductRepository } from '../../domain/product.repository';
import { UpdateProductUseCase } from './update-product.use-case';
import { Product } from '../../domain/product.entity';
import { NotFoundException } from '@nestjs/common';

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

  it('définit puis retire la quantité', async () => {
    const withQuantity = await useCase.execute(PRODUCT_ID, { quantity: 1.5, quantityUnit: 'kg' });
    expect(withQuantity.quantity).toBe(1.5);
    expect(withQuantity.quantityUnit).toBe('kg');

    repository.findByIdOrFail.mockResolvedValue(withQuantity);
    const withoutQuantity = await useCase.execute(PRODUCT_ID, { quantity: null, quantityUnit: null });

    expect(withoutQuantity.quantity).toBeNull();
    expect(withoutQuantity.quantityUnit).toBeNull();
    expect(repository.save).toHaveBeenLastCalledWith(withoutQuantity);
  });

  it("change seulement l'unité de quantité en gardant la quantité", async () => {
    const product = existingProduct();
    product.changeQuantity(500, 'g');
    repository.findByIdOrFail.mockResolvedValue(product);

    const updated = await useCase.execute(PRODUCT_ID, { quantityUnit: 'ml' });

    expect(updated.quantity).toBe(500);
    expect(updated.quantityUnit).toBe('ml');
  });

  it("ne touche pas à la quantité quand elle n'est pas fournie", async () => {
    const product = existingProduct();
    product.changeQuantity(500, 'g');
    repository.findByIdOrFail.mockResolvedValue(product);

    const updated = await useCase.execute(PRODUCT_ID, { price: 4 });

    expect(updated.quantity).toBe(500);
    expect(updated.quantityUnit).toBe('g');
  });

  it('passe un produit en BOUTEILLE avec sa quantité dans la même mise à jour', async () => {
    const updated = await useCase.execute(PRODUCT_ID, { unit: 'BOUTEILLE', quantity: 75, quantityUnit: 'ml' });

    expect(repository.save).toHaveBeenCalledWith(updated);
    expect(updated.unit).toBe('BOUTEILLE');
    expect(updated.quantity).toBe(75);
  });

  it('ne sauvegarde rien si le produit passe en BOUTEILLE sans quantité', async () => {
    await expect(useCase.execute(PRODUCT_ID, { unit: 'BOUTEILLE' })).rejects.toBeInstanceOf(
      DomainValidationError,
    );
    expect(repository.save).not.toHaveBeenCalled();
  });

  it("ne sauvegarde rien si l'on retire la quantité d'un conditionnement", async () => {
    repository.findByIdOrFail.mockResolvedValue(
      Product.reconstitute(PRODUCT_ID, 'Œufs', 3, 5.5, 20, 5, PRODUCER_ID, CATEGORY_A, 'CONDITIONNEMENT', 6, 'pcs'),
    );

    await expect(useCase.execute(PRODUCT_ID, { quantity: null, quantityUnit: null })).rejects.toBeInstanceOf(
      DomainValidationError,
    );
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('ne sauvegarde rien si seule la quantité est fournie sur un produit sans quantité', async () => {
    await expect(useCase.execute(PRODUCT_ID, { quantity: 2 })).rejects.toBeInstanceOf(DomainValidationError);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('ne sauvegarde rien si la nouvelle unité de quantité est inconnue', async () => {
    await expect(useCase.execute(PRODUCT_ID, { quantity: 1, quantityUnit: 'cl' })).rejects.toBeInstanceOf(
      DomainValidationError,
    );
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
