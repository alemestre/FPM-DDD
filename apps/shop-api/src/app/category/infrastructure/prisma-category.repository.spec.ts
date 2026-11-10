import { CategoryInUseError } from '../domain/errors/category-in-use.error';
import { PrismaCategoryRepository } from './prisma-category.repository';
import { Prisma } from '../../../generated/prisma/client';
import type { PrismaService } from '../../../prisma/prisma.service';
import { Category } from '../domain/category.entity';
import { NotFoundException } from '@nestjs/common';

jest.mock('uuid', () => ({
  v4: jest.fn(() => '12345678-1234-4123-8123-123456789abc'),
  validate: jest.fn((value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value),
  ),
}));

jest.mock('../../../prisma/prisma.service', () => ({ PrismaService: class {} }));

const CATEGORY_ID = 'b3bb189e-8bf9-4888-9912-ace4e6543002';

const categoryRow = (overrides: Record<string, unknown> = {}) => ({
  uid: 1,
  id: CATEGORY_ID,
  name: 'Fruits',
  createdAt: new Date(),
  updatedAt: null,
  ...overrides,
});

const createPrismaMock = () => ({
  category: {
    upsert: jest.fn(),
    update: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    delete: jest.fn(),
  },
});

describe('PrismaCategoryRepository', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let repository: PrismaCategoryRepository;

  beforeEach(() => {
    prisma = createPrismaMock();
    repository = new PrismaCategoryRepository(prisma as unknown as PrismaService);
  });

  it("save renvoie la catégorie avec l'id persisté (pas un nouvel id)", async () => {
    prisma.category.upsert.mockResolvedValue(categoryRow());

    const saved = await repository.save(Category.reconstitute(CATEGORY_ID, 'Fruits'));

    expect(prisma.category.upsert).toHaveBeenCalledWith({
      where: { id: CATEGORY_ID },
      update: { name: 'Fruits', updatedAt: expect.any(Date) },
      create: { id: CATEGORY_ID, name: 'Fruits' },
    });
    expect(saved.id).toBe(CATEGORY_ID);
  });

  it('update ne transmet que le nom, sans étaler la source', async () => {
    prisma.category.update.mockResolvedValue(categoryRow({ name: 'Légumes' }));
    const patch = { name: 'Légumes', id: 'ignoré' } as unknown as Partial<Category>;

    const updated = await repository.update(CATEGORY_ID, patch);

    expect(prisma.category.update).toHaveBeenCalledWith({
      where: { id: CATEGORY_ID },
      data: { name: 'Légumes', updatedAt: expect.any(Date) },
    });
    expect(updated.name).toBe('Légumes');
  });

  it("findById renvoie null et findByIdOrFail lève NotFoundException si la catégorie n'existe pas", async () => {
    prisma.category.findUnique.mockResolvedValue(null);

    await expect(repository.findById(CATEGORY_ID)).resolves.toBeNull();
    await expect(repository.findByIdOrFail(CATEGORY_ID)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('findAll reconstitue toutes les catégories', async () => {
    prisma.category.findMany.mockResolvedValue([categoryRow()]);

    const categories = await repository.findAll();

    expect(categories.map((c: Category) => [c.id, c.name])).toEqual([[CATEGORY_ID, 'Fruits']]);
  });

  it('delete supprime la catégorie par id', async () => {
    prisma.category.delete.mockResolvedValue(categoryRow());

    await repository.delete(CATEGORY_ID);

    expect(prisma.category.delete).toHaveBeenCalledWith({ where: { id: CATEGORY_ID } });
  });

  it('delete lève CategoryInUseError si des produits utilisent la catégorie (P2003)', async () => {
    const cause = new Prisma.PrismaClientKnownRequestError('FK violation', { code: 'P2003', clientVersion: 'test' });
    prisma.category.delete.mockRejectedValue(cause);

    const error = await repository.delete(CATEGORY_ID).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(CategoryInUseError);
    expect((error as Error).cause).toBe(cause);
  });

  it('delete propage les autres erreurs Prisma telles quelles', async () => {
    const cause = new Prisma.PrismaClientKnownRequestError('Not found', { code: 'P2025', clientVersion: 'test' });
    prisma.category.delete.mockRejectedValue(cause);

    await expect(repository.delete(CATEGORY_ID)).rejects.toBe(cause);
  });
});
