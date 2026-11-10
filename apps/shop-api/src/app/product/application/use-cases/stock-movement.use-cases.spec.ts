import { DomainValidationError } from '../../../shared/domain/errors/domain-validation.error';
import { WithdrawProductStockUseCase } from './withdraw-product-stock.use-case';
import type { ProductRepository } from '../../domain/product.repository';
import { RestockProductUseCase } from './restock-product.use-case';
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

const existingProduct = (): Product =>
  Product.reconstitute(PRODUCT_ID, 'Pommes Golden', 3.5, 5.5, 20, 5, PRODUCER_ID, CATEGORY_A);

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

describe('RestockProductUseCase', () => {
  let repository: ReturnType<typeof createProductRepositoryMock>;
  let useCase: RestockProductUseCase;

  beforeEach(() => {
    repository = createProductRepositoryMock();
    repository.findByIdOrFail.mockResolvedValue(existingProduct());
    useCase = new RestockProductUseCase(repository);
  });

  it('augmente le stock puis sauvegarde', async () => {
    const product = await useCase.execute(PRODUCT_ID, 10);

    expect(product.stock).toBe(30);
    expect(repository.save).toHaveBeenCalledWith(product);
  });

  it('ne sauvegarde rien pour une quantité invalide', async () => {
    await expect(useCase.execute(PRODUCT_ID, 0)).rejects.toBeInstanceOf(DomainValidationError);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it("propage l'erreur si le produit n'existe pas", async () => {
    repository.findByIdOrFail.mockRejectedValue(new NotFoundException());

    await expect(useCase.execute(PRODUCT_ID, 1)).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.save).not.toHaveBeenCalled();
  });
});

describe('WithdrawProductStockUseCase', () => {
  let repository: ReturnType<typeof createProductRepositoryMock>;
  let useCase: WithdrawProductStockUseCase;

  beforeEach(() => {
    repository = createProductRepositoryMock();
    repository.findByIdOrFail.mockResolvedValue(existingProduct());
    useCase = new WithdrawProductStockUseCase(repository);
  });

  it('diminue le stock jusqu\'au stock minimum puis sauvegarde', async () => {
    const product = await useCase.execute(PRODUCT_ID, 15);

    expect(product.stock).toBe(5);
    expect(repository.save).toHaveBeenCalledWith(product);
  });

  it('ne sauvegarde rien si le stock passerait sous le stock minimum', async () => {
    await expect(useCase.execute(PRODUCT_ID, 16)).rejects.toThrow(
      'Le stock (4) ne peut pas être inférieur au stock minimum (5)',
    );
    expect(repository.save).not.toHaveBeenCalled();
  });
});
