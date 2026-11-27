import { DomainValidationErrorFilter } from '../../../shared/interface/http/domain-validation-error.filter';
import { JwtCookieAuthGuard } from '../../../auth/interface/http/guards/jwt-cookie-auth.guard';
import { JwtCookieStrategy } from '../../../auth/interface/http/strategies/jwt-cookie.strategy';
import { GetCurrentUserUseCase } from '../../../auth/application/use-cases/get-current-user.use-case';
import { AdminGuard } from '../../../auth/interface/http/guards/admin.guard';
import { ACCESS_TOKEN_COOKIE } from '../../../auth/interface/http/auth.constants';
import { CreateCategoryUseCase } from '../../application/use-cases/create-category.use-case';
import { ListCategoriesUseCase } from '../../application/use-cases/list-categories.use-case';
import { UpdateCategoryUseCase } from '../../application/use-cases/update-category.use-case';
import { GetCategoryUseCase } from '../../application/use-cases/get-category.use-case';
import { InMemoryCategoryRepository } from '../../testing/in-memory-category.repository';
import { CategoryRepository } from '../../domain/category.repository';
import { Category } from '../../domain/category.entity';
import { AdminCategoryController } from './admin-category.controller';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import type { INestApplication } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ZodValidationPipe } from 'nestjs-zod';
import { Test } from '@nestjs/testing';
import { UserRole } from '@fpm/tools';
import cookieParser from 'cookie-parser';

// @nestjs/config est publié en ESM, que ts-jest ne charge pas : seul le jeton ConfigService est utile ici.
jest.mock('@nestjs/config', () => ({ ConfigService: class ConfigService {} }));

jest.mock('uuid', () => ({
  v4: jest.fn(() => '12345678-1234-4123-8123-123456789abc'),
  validate: jest.fn((value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value),
  ),
}));

const NEW_ID = '12345678-1234-4123-8123-123456789abc';
const CATEGORY_ID = 'b3bb189e-8bf9-4888-9912-ace4e6543002';
const ADMIN_ID = '9b2d7c1e-4f3a-4e8b-a6d5-1c0f2e3d4b5a';
const CUSTOMER_ID = '3f0c9a52-8a6e-4c1b-9d57-2b1e7f4a6c10';

describe('AdminCategoryController (HTTP)', () => {
  let app: INestApplication;
  let repository: InMemoryCategoryRepository;
  let baseUrl: string;
  let adminCookie: string;
  let customerCookie: string;

  // AdminGuard relit le rôle via ce use case : on le simule plutôt que de monter le contexte auth.
  const getCurrentUser = {
    execute: jest.fn(async (userId: string) => ({
      id: userId,
      role: userId === ADMIN_ID ? UserRole.ADMIN : UserRole.CUSTOMER,
    })),
  };

  const requestAs = async (cookie: string | null, method: string, path: string, body?: unknown) => {
    const response = await fetch(`${baseUrl}/admin/categories${path}`, {
      method,
      headers: { 'content-type': 'application/json', ...(cookie && { cookie }) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await response.text();
    return { status: response.status, body: text ? JSON.parse(text) : undefined };
  };
  const request = (method: string, path: string, body?: unknown) => requestAs(adminCookie, method, path, body);

  const seedCategory = () => repository.categories.set(CATEGORY_ID, Category.reconstitute(CATEGORY_ID, 'Fruits', 'fruits'));

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: 'test-secret' })],
      controllers: [AdminCategoryController],
      providers: [
        JwtCookieAuthGuard,
        JwtCookieStrategy,
        AdminGuard,
        { provide: GetCurrentUserUseCase, useValue: getCurrentUser },
        { provide: ConfigService, useValue: { getOrThrow: () => 'test-secret' } },
        CreateCategoryUseCase,
        ListCategoriesUseCase,
        GetCategoryUseCase,
        UpdateCategoryUseCase,
        { provide: CategoryRepository, useClass: InMemoryCategoryRepository },
        { provide: APP_PIPE, useClass: ZodValidationPipe },
        { provide: APP_FILTER, useClass: DomainValidationErrorFilter },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    await app.listen(0);
    baseUrl = await app.getUrl();
    repository = moduleRef.get(CategoryRepository);

    const jwt = moduleRef.get(JwtService);
    adminCookie = `${ACCESS_TOKEN_COOKIE}=${await jwt.signAsync({ sub: ADMIN_ID })}`;
    customerCookie = `${ACCESS_TOKEN_COOKIE}=${await jwt.signAsync({ sub: CUSTOMER_ID })}`;
  });

  beforeEach(() => {
    repository.categories.clear();
    repository.usedByProducts.clear();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('accès', () => {
    // Toujours 3 colonnes : avec moins, Jest passerait `done` en dernier argument et attendrait son appel.
    const routes: [string, string, unknown][] = [
      ['GET', '', undefined],
      ['GET', `/${CATEGORY_ID}`, undefined],
      ['POST', '', { name: 'Légumes' }],
      ['PATCH', `/${CATEGORY_ID}`, { name: 'Légumes' }],
    ];

    it.each(routes)('%s %s renvoie 401 sans session', async (method, path, body) => {
      seedCategory();

      expect((await requestAs(null, method, path, body)).status).toBe(401);
      expect(repository.categories.get(CATEGORY_ID)?.name).toBe('Fruits');
    });

    it.each(routes)('%s %s renvoie 403 pour un client', async (method, path, body) => {
      seedCategory();

      expect((await requestAs(customerCookie, method, path, body)).status).toBe(403);
      expect(repository.categories.get(CATEGORY_ID)?.name).toBe('Fruits');
    });
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

    it("renvoie 400 si l'id n'est pas un UUID", async () => {
      expect((await request('GET', '/abc')).status).toBe(400);
    });
  });

  describe('POST /admin/categories', () => {
    it('crée la catégorie à partir du nom (201)', async () => {
      expect(await request('POST', '', { name: ' Fruits ' })).toEqual({
        status: 201,
        body: { id: NEW_ID, name: 'Fruits', slug: 'fruits' },
      });
    });

    it('renvoie 400 si le nom manque', async () => {
      expect((await request('POST', '', {})).status).toBe(400);
    });

    it('renvoie 409 si une catégorie au nom équivalent existe déjà', async () => {
      seedCategory();

      const { status, body } = await request('POST', '', { name: 'FRUITS' });

      expect(status).toBe(409);
      expect(body.message).toBe('Une catégorie avec un nom équivalent existe déjà');
      expect(repository.categories.size).toBe(1);
    });

    it('renvoie 400 si le nom est trop court', async () => {
      expect((await request('POST', '', { name: 'ab' })).status).toBe(400);
      expect(repository.categories.size).toBe(0);
    });
  });

  describe('PATCH /admin/categories/:id', () => {
    it('renomme la catégorie en gardant son id', async () => {
      seedCategory();

      expect(await request('PATCH', `/${CATEGORY_ID}`, { name: 'Légumes' })).toEqual({
        status: 200,
        body: { id: CATEGORY_ID, name: 'Légumes', slug: 'legumes' },
      });
    });

    it("renvoie 404 si la catégorie n'existe pas", async () => {
      expect((await request('PATCH', `/${CATEGORY_ID}`, { name: 'Légumes' })).status).toBe(404);
    });
  });

  it("n'expose pas de DELETE : une catégorie n'est jamais supprimée", async () => {
    seedCategory();

    expect((await request('DELETE', `/${CATEGORY_ID}`)).status).toBe(404);
    expect(repository.categories.has(CATEGORY_ID)).toBe(true);
  });
});
