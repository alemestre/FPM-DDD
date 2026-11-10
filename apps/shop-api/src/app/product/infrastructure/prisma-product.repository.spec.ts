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
  categoryId: CATEGORY_A,
  unit: 'KG',
  quantity: null,
  quantityUnit: null,
  ...overrides,
});

const prismaError = (code: string) =>
  new Prisma.PrismaClientKnownRequestError(`Prisma error ${code}`, { code, clientVersion: 'test' });

const existingProduct = () =>
  Product.reconstitute(PRODUCT_ID, 'Pommes Golden', 3.5, 5.5, 20, 5, PRODUCER_ID, CATEGORY_A, 'KG');

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
    it("upsert l'agrégat complet avec producteur et catégorie", async () => {
      const product = Product.reconstitute(PRODUCT_ID, 'Pommes Golden', 3.5, 5.5, 20, 5, PRODUCER_ID, CATEGORY_B, 'KG');
      prisma.product.upsert.mockResolvedValue(productRow({ categoryId: CATEGORY_B }));

      const saved = await repository.save(product);

      const scalars = {
        name: 'Pommes Golden',
        price: 3.5,
        vatRate: 5.5,
        stock: 20,
        minStock: 5,
        producerId: PRODUCER_ID,
        categoryId: CATEGORY_B,
        unit: 'KG',
        quantity: null,
        quantityUnit: null,
      };
      expect(prisma.product.upsert).toHaveBeenCalledWith({
        where: { id: PRODUCT_ID },
        create: { id: PRODUCT_ID, ...scalars },
        update: scalars,
      });
      expect(saved).toBeInstanceOf(Product);
      expect(saved.categoryId).toBe(CATEGORY_B);
    });

    it("traduit la violation de clé étrangère P2003 (producteur ou catégorie introuvable) en ProductReferenceNotFoundError", async () => {
      const cause = prismaError('P2003');
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
      prisma.product.update.mockResolvedValue(productRow({ price: decimal(4), categoryId: CATEGORY_B }));

      const updated = await repository.update(PRODUCT_ID, { price: 4, categoryId: CATEGORY_B });

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: PRODUCT_ID },
        data: { price: 4, categoryId: CATEGORY_B },
      });
      expect(updated.price).toBe(4);
      expect(updated.categoryId).toBe(CATEGORY_B);
    });

    it("enregistre la quantité de l'agrégat", async () => {
      const product = existingProduct();
      product.changeQuantity(250, 'g');
      prisma.product.upsert.mockResolvedValue(productRow({ quantity: decimal(250), quantityUnit: 'g' }));

      const saved = await repository.save(product);

      expect(prisma.product.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ update: expect.objectContaining({ quantity: 250, quantityUnit: 'g' }) }),
      );
      expect(saved.quantity).toBe(250);
      expect(saved.quantityUnit).toBe('g');
    });

    it("met à jour l'unité", async () => {
      prisma.product.update.mockResolvedValue(productRow({ unit: 'BOTTE' }));

      const updated = await repository.update(PRODUCT_ID, { unit: 'BOTTE' });

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: PRODUCT_ID },
        data: { unit: 'BOTTE' },
      });
      expect(updated.unit).toBe('BOTTE');
    });

    it('retire la quantité avec null', async () => {
      prisma.product.update.mockResolvedValue(productRow());

      await repository.update(PRODUCT_ID, { quantity: null, quantityUnit: null });

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: PRODUCT_ID },
        data: { quantity: null, quantityUnit: null },
      });
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

    it("traduit l'erreur Prisma P2003 en ProductReferenceNotFoundError", async () => {
      prisma.product.update.mockRejectedValue(prismaError('P2003'));

      await expect(
        repository.update(PRODUCT_ID, { producerId: PRODUCER_ID, categoryId: CATEGORY_B }),
      ).rejects.toBeInstanceOf(ProductReferenceNotFoundError);
    });

    it('propage les autres erreurs Prisma telles quelles', async () => {
      const cause = prismaError('P2025');
      prisma.product.update.mockRejectedValue(cause);

      await expect(repository.update(PRODUCT_ID, { price: 4 })).rejects.toBe(cause);
    });
  });

  describe('lecture', () => {
    it('reconstitue le produit en convertissant les Decimal en nombres', async () => {
      prisma.product.findUnique.mockResolvedValue(productRow());

      const product = await repository.findById(PRODUCT_ID);

      expect(prisma.product.findUnique).toHaveBeenCalledWith({ where: { id: PRODUCT_ID } });
      expect(product?.price).toBe(3.5);
      expect(product?.vatRate).toBe(5.5);
      expect(product?.stock).toBe(20);
      expect(product?.minStock).toBe(5);
      expect(product?.producerId).toBe(PRODUCER_ID);
      expect(product?.categoryId).toBe(CATEGORY_A);
      expect(product?.unit).toBe('KG');
      expect(product?.quantity).toBeNull();
      expect(product?.quantityUnit).toBeNull();
    });

    it.each(['pcs', 'g', 'ml', 'kg', 'l'])("reconstitue l'unité de quantité %s", async (quantityUnit) => {
      prisma.product.findUnique.mockResolvedValue(productRow({ quantity: decimal(1), quantityUnit }));

      const product = await repository.findById(PRODUCT_ID);

      expect(product?.quantityUnit).toBe(quantityUnit);
    });

    it.each(['CONDITIONNEMENT', 'BOUTEILLE'])("reconstitue un produit vendu en %s avec sa quantité", async (unit) => {
      prisma.product.findUnique.mockResolvedValue(productRow({ unit, quantity: decimal(0.75), quantityUnit: 'l' }));

      const product = await repository.findById(PRODUCT_ID);

      expect(product?.unit).toBe(unit);
      expect(product?.quantity).toBe(0.75);
      expect(product?.quantityUnit).toBe('l');
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

      expect(prisma.product.findMany).toHaveBeenCalledWith();
      expect(products.map((p: Product) => p.id)).toEqual([PRODUCT_ID, CATEGORY_B]);
    });

    describe('avec le producteur', () => {
      const PRODUCER = { id: PRODUCER_ID, name: 'Ferme des Lilas' };
      const WITH_PRODUCER = { producer: { select: { id: true, name: true } } };
      const rowWithProducer = (overrides: Record<string, unknown> = {}) => ({ ...productRow(overrides), producer: PRODUCER });

      it('findManyWithProducer liste tous les produits avec leur producteur', async () => {
        prisma.product.findMany.mockResolvedValue([rowWithProducer()]);

        const results = await repository.findManyWithProducer();

        expect(prisma.product.findMany).toHaveBeenCalledWith({ where: {}, include: WITH_PRODUCER });
        expect(results).toHaveLength(1);
        expect(results[0].product).toBeInstanceOf(Product);
        expect(results[0].product.price).toBe(3.5);
        expect(results[0].producer).toEqual(PRODUCER);
      });

      it('findManyWithProducer filtre sur la catégorie quand elle est fournie', async () => {
        prisma.product.findMany.mockResolvedValue([rowWithProducer()]);

        const results = await repository.findManyWithProducer(CATEGORY_A);

        expect(prisma.product.findMany).toHaveBeenCalledWith({ where: { categoryId: CATEGORY_A }, include: WITH_PRODUCER });
        expect(results[0].product.categoryId).toBe(CATEGORY_A);
      });

      it("findManyWithProducer retourne une liste vide si aucun produit n'est dans la catégorie", async () => {
        prisma.product.findMany.mockResolvedValue([]);

        await expect(repository.findManyWithProducer(CATEGORY_A)).resolves.toEqual([]);
      });

      it('findByIdWithProducerOrFail charge le produit et son producteur', async () => {
        prisma.product.findUnique.mockResolvedValue(rowWithProducer({ quantity: decimal(0.75), quantityUnit: 'l', unit: 'BOUTEILLE' }));

        const result = await repository.findByIdWithProducerOrFail(PRODUCT_ID);

        expect(prisma.product.findUnique).toHaveBeenCalledWith({ where: { id: PRODUCT_ID }, include: WITH_PRODUCER });
        expect(result.product.id).toBe(PRODUCT_ID);
        expect(result.product.quantity).toBe(0.75);
        expect(result.producer).toEqual(PRODUCER);
      });

      it("findByIdWithProducerOrFail lève NotFoundException si le produit n'existe pas", async () => {
        prisma.product.findUnique.mockResolvedValue(null);

        await expect(repository.findByIdWithProducerOrFail(PRODUCT_ID)).rejects.toBeInstanceOf(NotFoundException);
      });
    });
  });

  it('delete supprime le produit par id', async () => {
    prisma.product.delete.mockResolvedValue(productRow());

    await repository.delete(PRODUCT_ID);

    expect(prisma.product.delete).toHaveBeenCalledWith({ where: { id: PRODUCT_ID } });
  });
});
