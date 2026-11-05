import { DomainValidationErrorFilter } from '../../../shared/interface/http/domain-validation-error.filter';
import { type INestApplication, NotFoundException } from '@nestjs/common';
import { CategoryRepository } from '../../domain/category.repository';
import { Category } from '../../domain/category.entity';
import { CategoryModule } from '../../category.module';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { Test } from '@nestjs/testing';

jest.mock('uuid', () => ({
  v4: jest.fn(() => '12345678-1234-4123-8123-123456789abc'),
  validate: jest.fn((value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value),
  ),
}));

jest.mock('../../infrastructure/prisma-category.repository', () => ({ PrismaCategoryRepository: class {} }));

const NEW_ID = '12345678-1234-4123-8123-123456789abc';
const CATEGORY_ID = 'b3bb189e-8bf9-4888-9912-ace4e6543002';

class InMemoryCategoryRepository extends CategoryRepository {
  readonly categories = new Map<string, Category>();

  async save(category: Category): Promise<Category> {
    this.categories.set(category.id, category);
    return category;
  }

  async findById(id: string): Promise<Category | null> {
    return this.categories.get(id) ?? null;
  }

  async findByIdOrFail(id: string): Promise<Category> {
    const category = this.categories.get(id);
    if (!category) throw new NotFoundException();
    return category;
  }

  async findAll(): Promise<Category[]> {
    return [...this.categories.values()];
  }

  async update(): Promise<Category> {
    throw new Error('not used by the category use cases');
  }

  async delete(id: string): Promise<void> {
    this.categories.delete(id);
  }
}

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

  const seedCategory = () => repository.categories.set(CATEGORY_ID, Category.reconstitute(CATEGORY_ID, 'Fruits'));

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [CategoryModule],
      providers: [
        { provide: APP_PIPE, useClass: ZodValidationPipe },
        { provide: APP_FILTER, useClass: DomainValidationErrorFilter },
      ],
    })
      .overrideProvider(CategoryRepository)
      .useClass(InMemoryCategoryRepository)
      .compile();

    app = moduleRef.createNestApplication();
    await app.listen(0);
    baseUrl = await app.getUrl();
    repository = moduleRef.get(CategoryRepository);
  });

  beforeEach(() => repository.categories.clear());

  afterAll(async () => {
    await app.close();
  });

  describe('POST /categories', () => {
    it('crée la catégorie à partir du label (201)', async () => {
      expect(await request('POST', '', { label: ' Fruits ' })).toEqual({
        status: 201,
        body: { id: NEW_ID, name: 'Fruits' },
      });
    });

    it('renvoie 400 si le label manque', async () => {
      expect((await request('POST', '', {})).status).toBe(400);
    });

    it('renvoie 400 si le nom est trop court', async () => {
      expect((await request('POST', '', { label: 'ab' })).status).toBe(400);
      expect(repository.categories.size).toBe(0);
    });
  });

  describe('GET', () => {
    it('liste les catégories', async () => {
      seedCategory();

      expect(await request('GET', '')).toEqual({ status: 200, body: [{ id: CATEGORY_ID, name: 'Fruits' }] });
    });

    it('renvoie une catégorie par id', async () => {
      seedCategory();

      expect(await request('GET', `/${CATEGORY_ID}`)).toEqual({
        status: 200,
        body: { id: CATEGORY_ID, name: 'Fruits' },
      });
    });

    it("renvoie 404 si la catégorie n'existe pas", async () => {
      expect((await request('GET', `/${CATEGORY_ID}`)).status).toBe(404);
    });

    it("renvoie 400 si l'id n'est pas un UUID", async () => {
      expect((await request('GET', '/abc')).status).toBe(400);
    });
  });

  it('PATCH /categories/:id renomme la catégorie en gardant son id', async () => {
    seedCategory();

    expect(await request('PATCH', `/${CATEGORY_ID}`, { label: 'Légumes' })).toEqual({
      status: 200,
      body: { id: CATEGORY_ID, name: 'Légumes' },
    });
  });

  describe('DELETE /categories/:id', () => {
    it('supprime la catégorie (204)', async () => {
      seedCategory();

      expect((await request('DELETE', `/${CATEGORY_ID}`)).status).toBe(204);
      expect(repository.categories.has(CATEGORY_ID)).toBe(false);
    });

    it("renvoie 404 si la catégorie n'existe pas", async () => {
      expect((await request('DELETE', `/${CATEGORY_ID}`)).status).toBe(404);
    });
  });
});
