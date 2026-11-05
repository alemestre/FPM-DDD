import { ProductReferenceNotFoundError } from '../domain/errors/product-reference-not-found.error';
import { PrismaProductRepository } from './prisma-product.repository';
import type { PrismaService } from '../../../prisma/prisma.service';
import { Prisma } from '../../../generated/prisma/client';
import { Product } from '../domain/product.entity';
import { NotFoundException } from '@nestjs/common';

jest.mock('uuid', () => ({
  v4: jest.fn(() => '12345678-1234-4123-8123-123456789abc'),
  validate: jest.fn((value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value),
  ),
}));

jest.mock('../../../prisma/prisma.service', () => ({ PrismaService: class {} }));

const PRODUCT_ID = 'e3bb189e-8bf9-4888-9912-ace4e6543002';
const PRODUCER_ID = 'a3bb189e-8bf9-4888-9912-ace4e6543002';
const CATEGORY_A = 'b3bb189e-8bf9-4888-9912-ace4e6543002';
const CATEGORY_B = 'c3bb189e-8bf9-4888-9912-ace4e6543002';

const decimal = (value: number) => ({ toNumber: () => value });

const productRow = (overrides: Record<string, unknown> = {}) => ({
  uid: 1,
  id: PRODUCT_ID,
  name: 'Pommes Golden',
  price: decimal(3.5),
  vatRate: decimal(5.5),
  stock: 20,
  minStock: 5,
  producerId: PRODUCER_ID,
  createdAt: new Date(),
  updatedAt: new Date(),
  categories: [{ id: CATEGORY_A }],
  ...overrides,
});

const INCLUDE = { categories: { select: { id: true } } };

const prismaError = (code: string) =>
  new Prisma.PrismaClientKnownRequestError(`Prisma error ${code}`, { code, clientVersion: 'test' });

const existingProduct = () =>
  Product.reconstitute(PRODUCT_ID, 'Pommes Golden', 3.5, 5.5, 20, 5, PRODUCER_ID, [CATEGORY_A]);

const createPrismaMock = () => ({
  product: {
    upsert: jest.fn(),
    update: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    delete: jest.fn(),
  },
});

describe('PrismaProductRepository', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let repository: PrismaProductRepository;

  beforeEach(() => {
    prisma = createPrismaMock();
    repository = new PrismaProductRepository(prisma as unknown as PrismaService);
  });

  describe('save', () => {
    it("upsert l'agrégat complet avec producteur et catégories", async () => {
      const product = Product.reconstitute(PRODUCT_ID, 'Pommes Golden', 3.5, 5.5, 20, 5, PRODUCER_ID, [
        CATEGORY_A,
        CATEGORY_B,
      ]);
      prisma.product.upsert.mockResolvedValue(
        productRow({ categories: [{ id: CATEGORY_A }, { id: CATEGORY_B }] }),
      );

      const saved = await repository.save(product);

      const scalars = {
        name: 'Pommes Golden',
        price: 3.5,
        vatRate: 5.5,
        stock: 20,
        minStock: 5,
        producerId: PRODUCER_ID,
      };
      expect(prisma.product.upsert).toHaveBeenCalledWith({
        where: { id: PRODUCT_ID },
        create: {
          id: PRODUCT_ID,
          ...scalars,
          categories: { connect: [{ id: CATEGORY_A }, { id: CATEGORY_B }] },
        },
        update: {
          ...scalars,
          categories: { set: [{ id: CATEGORY_A }, { id: CATEGORY_B }] },
        },
        include: INCLUDE,
      });
      expect(saved).toBeInstanceOf(Product);
      expect(saved.categoryIds).toEqual([CATEGORY_A, CATEGORY_B]);
    });

    it.each([
      ['P2003', 'le producteur'],
      ['P2025', 'une catégorie'],
    ])("traduit l'erreur Prisma %s (%s introuvable) en ProductReferenceNotFoundError", async (code) => {
      const cause = prismaError(code);
      prisma.product.upsert.mockRejectedValue(cause);

      const error = await repository.save(existingProduct()).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ProductReferenceNotFoundError);
      expect((error as Error).cause).toBe(cause);
    });

    it('propage les autres erreurs Prisma telles quelles', async () => {
      const cause = prismaError('P2002');
      prisma.product.upsert.mockRejectedValue(cause);

      await expect(repository.save(existingProduct())).rejects.toBe(cause);
    });
  });

  describe('update', () => {
    beforeEach(() => {
      prisma.product.findUnique.mockResolvedValue(productRow());
    });

    it('ne transmet que les champs fournis', async () => {
      prisma.product.update.mockResolvedValue(productRow({ price: decimal(4), categories: [] }));

      const updated = await repository.update(PRODUCT_ID, { price: 4, categoryIds: [] });

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: PRODUCT_ID },
        data: { price: 4, categories: { set: [] } },
        include: INCLUDE,
      });
      expect(updated.price).toBe(4);
      expect(updated.categoryIds).toEqual([]);
    });

    it('met à jour la clé étrangère du producteur', async () => {
      prisma.product.update.mockResolvedValue(productRow());

      await repository.update(PRODUCT_ID, { producerId: PRODUCER_ID });

      expect(prisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { producerId: PRODUCER_ID } }),
      );
    });

    it("lève NotFoundException sans écrire si le produit n'existe pas", async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(repository.update(PRODUCT_ID, { price: 4 })).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.product.update).not.toHaveBeenCalled();
    });

    it.each(['P2003', 'P2025'])(
      "traduit l'erreur Prisma %s en ProductReferenceNotFoundError",
      async (code) => {
        prisma.product.update.mockRejectedValue(prismaError(code));

        await expect(
          repository.update(PRODUCT_ID, { producerId: PRODUCER_ID, categoryIds: [CATEGORY_B] }),
        ).rejects.toBeInstanceOf(ProductReferenceNotFoundError);
      },
    );
  });

  describe('lecture', () => {
    it('reconstitue le produit en convertissant les Decimal en nombres', async () => {
      prisma.product.findUnique.mockResolvedValue(productRow());

      const product = await repository.findById(PRODUCT_ID);

      expect(prisma.product.findUnique).toHaveBeenCalledWith({ where: { id: PRODUCT_ID }, include: INCLUDE });
      expect(product?.price).toBe(3.5);
      expect(product?.vatRate).toBe(5.5);
      expect(product?.stock).toBe(20);
      expect(product?.minStock).toBe(5);
      expect(product?.producerId).toBe(PRODUCER_ID);
      expect(product?.categoryIds).toEqual([CATEGORY_A]);
    });

    it("retourne null si le produit n'existe pas", async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(repository.findById(PRODUCT_ID)).resolves.toBeNull();
    });

    it("findByIdOrFail lève NotFoundException si le produit n'existe pas", async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(repository.findByIdOrFail(PRODUCT_ID)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('findAll reconstitue tous les produits', async () => {
      prisma.product.findMany.mockResolvedValue([productRow(), productRow({ id: CATEGORY_B })]);

      const products = await repository.findAll();

      expect(prisma.product.findMany).toHaveBeenCalledWith({ include: INCLUDE });
      expect(products.map((p: Product) => p.id)).toEqual([PRODUCT_ID, CATEGORY_B]);
    });
  });

  it('delete supprime le produit par id', async () => {
    prisma.product.delete.mockResolvedValue(productRow());

    await repository.delete(PRODUCT_ID);

    expect(prisma.product.delete).toHaveBeenCalledWith({ where: { id: PRODUCT_ID } });
  });
});
