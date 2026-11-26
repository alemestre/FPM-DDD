import { DomainValidationErrorFilter } from '../../../shared/interface/http/domain-validation-error.filter';
import type { INestApplication } from '@nestjs/common';
import { CategoryRepository } from '../../domain/category.repository';
import { Category } from '../../domain/category.entity';
import { InMemoryCategoryRepository } from '../../testing/in-memory-category.repository';
import { ListCategoriesUseCase } from '../../application/use-cases/list-categories.use-case';
import { GetCategoryUseCase } from '../../application/use-cases/get-category.use-case';
import { GetCategoryBySlugUseCase } from '../../application/use-cases/get-category-by-slug.use-case';
import { CategoryController } from './category.controller';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { Test } from '@nestjs/testing';

jest.mock('uuid', () => ({
  validate: jest.fn((value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value),
  ),
}));

const CATEGORY_ID = 'b3bb189e-8bf9-4888-9912-ace4e6543002';

describe('CategoryController (HTTP)', () => {
  let app: INestApplication;
  let repository: InMemoryCategoryRepository;
  let baseUrl: string;

  const request = async (method: string, path: string, body?: unknown) => {
    const response = await fetch(`${baseUrl}/categories${path}`, {
      method,
      headers: { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await response.text();
    return { status: response.status, body: text ? JSON.parse(text) : undefined };
  };

  const seedCategory = () => repository.categories.set(CATEGORY_ID, Category.reconstitute(CATEGORY_ID, 'Fruits', 'fruits'));

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [CategoryController],
      providers: [
        ListCategoriesUseCase,
        GetCategoryUseCase,
        GetCategoryBySlugUseCase,
        { provide: CategoryRepository, useClass: InMemoryCategoryRepository },
        { provide: APP_PIPE, useClass: ZodValidationPipe },
        { provide: APP_FILTER, useClass: DomainValidationErrorFilter },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.listen(0);
    baseUrl = await app.getUrl();
    repository = moduleRef.get(CategoryRepository);
  });

  beforeEach(() => repository.categories.clear());

  afterAll(async () => {
    await app.close();
  });

  describe('GET', () => {
    it('liste les catégories', async () => {
      seedCategory();

      expect(await request('GET', '')).toEqual({ status: 200, body: [{ id: CATEGORY_ID, name: 'Fruits', slug: 'fruits' }] });
    });

    it('renvoie une catégorie par id', async () => {
      seedCategory();

      expect(await request('GET', `/${CATEGORY_ID}`)).toEqual({
        status: 200,
        body: { id: CATEGORY_ID, name: 'Fruits', slug: 'fruits' },
      });
    });

    it("renvoie 404 si la catégorie n'existe pas", async () => {
      expect((await request('GET', `/${CATEGORY_ID}`)).status).toBe(404);
    });

    it('renvoie une catégorie par slug', async () => {
      seedCategory();

      expect(await request('GET', '/slug/fruits')).toEqual({
        status: 200,
        body: { id: CATEGORY_ID, name: 'Fruits', slug: 'fruits' },
      });
    });

    it("renvoie 404 si aucune catégorie n'a ce slug", async () => {
      seedCategory();

      expect((await request('GET', '/slug/legumes')).status).toBe(404);
    });

    it("renvoie 400 si le slug n'est pas au bon format", async () => {
      expect((await request('GET', '/slug/Fruits')).status).toBe(400);
    });

    it("renvoie 400 si l'id n'est pas un UUID", async () => {
      expect((await request('GET', '/abc')).status).toBe(400);
    });
  });

  it.each([
    ['POST', ''],
    ['PATCH', `/${CATEGORY_ID}`],
    ['DELETE', `/${CATEGORY_ID}`],
  ])("n'expose plus %s en public : les modifications passent par /admin/categories", async (method, path) => {
    seedCategory();

    expect((await request(method, path, { name: 'Légumes' })).status).toBe(404);
    expect(repository.categories.get(CATEGORY_ID)?.name).toBe('Fruits');
  });
});
