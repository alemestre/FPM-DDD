import { ApiResponseInterceptor } from '../../../shared/interface/http/api-response.interceptor';
import { PasswordHasher } from '../../application/ports/password-hasher';
import type { UserCredentials } from '../../domain/user.credentials';
import { Global, type INestApplication, Module } from '@nestjs/common';
import { UserRepository } from '../../domain/user.repository';
import { APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { User } from '../../domain/user.entity';
import { AuthModule } from '../../auth.module';
import { ZodValidationPipe } from 'nestjs-zod';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import cookieParser from 'cookie-parser';

jest.mock('../../infrastructure/prisma-user.repository', () => ({ PrismaUserRepository: class {} }));
// @nestjs/config est publié en ESM, que ts-jest ne charge pas : seul le jeton ConfigService est utile ici.
jest.mock('@nestjs/config', () => ({ ConfigService: class ConfigService {} }));

const SECRET = 'test-secret';
const USER_ID = 'b1c2d3e4-5f60-4a7b-8c9d-0e1f2a3b4c5d';
const EMAIL = 'marie.durand@example.fr';
const PASSWORD = 'motdepasse';
const INVALID_CREDENTIALS = { statusCode: 401, error: 'Unauthorized', message: 'Email ou mot de passe incorrect' };

/** Remplace le ConfigModule global de l'application. */
@Global()
@Module({
  providers: [{ provide: ConfigService, useValue: { getOrThrow: () => SECRET } }],
  exports: [ConfigService],
})
class TestConfigModule {}

class InMemoryUserRepository extends UserRepository {
  readonly credentials = new Map<string, UserCredentials>();

  async findById(id: string): Promise<User | null> {
    return [...this.credentials.values()].find(({ user }) => user.id === id)?.user ?? null;
  }

  async findCredentialsByEmail(email: string): Promise<UserCredentials | null> {
    return this.credentials.get(email) ?? null;
  }
}

/** Hachage factice et rapide : argon2 est testé à part. */
class FakePasswordHasher extends PasswordHasher {
  async hash(password: string): Promise<string> {
    return `hash:${password}`;
  }

  async verify(password: string, hash: string | null): Promise<boolean> {
    return hash === `hash:${password}`;
  }
}

describe('AuthController (HTTP)', () => {
  let app: INestApplication;
  let repository: InMemoryUserRepository;
  let baseUrl: string;

  const sign = (payload: object, secret = SECRET) => new JwtService({ secret }).signAsync(payload);

  const parse = async (response: Response) => {
    const text = await response.text();
    return { status: response.status, body: text ? JSON.parse(text) : undefined };
  };

  const getMe = async (token?: string) =>
    parse(
      await fetch(`${baseUrl}/me`, {
        headers: token === undefined ? {} : { cookie: `access_token=${token}` },
      }),
    );

  const post = (path: string, body?: unknown) =>
    fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

  /** Valeur du cookie access_token posé par la réponse, ou undefined. */
  const accessTokenCookieOf = (response: Response) =>
    response.headers.getSetCookie().find((cookie) => cookie.startsWith('access_token='));

  const seedUser = (isActive = true) =>
    repository.credentials.set(EMAIL, {
      user: User.reconstitute(USER_ID, EMAIL, 'Marie', 'Durand', 'CUSTOMER', isActive),
      passwordHash: `hash:${PASSWORD}`,
    });

  const expectedProfile = {
    id: USER_ID,
    email: EMAIL,
    firstName: 'Marie',
    lastName: 'Durand',
    role: 'CUSTOMER',
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [TestConfigModule, AuthModule],
      providers: [
        { provide: APP_PIPE, useClass: ZodValidationPipe },
        { provide: APP_INTERCEPTOR, useClass: ApiResponseInterceptor },
      ],
    })
      .overrideProvider(UserRepository)
      .useClass(InMemoryUserRepository)
      .overrideProvider(PasswordHasher)
      .useClass(FakePasswordHasher)
      .compile();

    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    await app.listen(0);
    baseUrl = await app.getUrl();
    repository = app.get(UserRepository);
  });

  afterAll(() => app.close());

  beforeEach(() => repository.credentials.clear());

  describe('GET /me', () => {
    it("renvoie le profil de l'utilisateur connecté", async () => {
      seedUser();

      expect(await getMe(await sign({ sub: USER_ID }))).toEqual({
        status: 200,
        body: { success: true, data: expectedProfile },
      });
    });

    it('renvoie 401 sans cookie de session', async () => {
      seedUser();

      expect((await getMe()).status).toBe(401);
    });

    it('renvoie 401 avec un jeton signé par un autre secret', async () => {
      seedUser();

      expect((await getMe(await sign({ sub: USER_ID }, 'autre-secret'))).status).toBe(401);
    });

    it("renvoie 401 si l'utilisateur n'existe plus", async () => {
      const { status, body } = await getMe(await sign({ sub: USER_ID }));

      expect(status).toBe(401);
      expect(body).toEqual({ statusCode: 401, error: 'Unauthorized', message: 'Authentification requise' });
    });

    it('renvoie 401 si le compte est désactivé', async () => {
      seedUser(false);

      expect((await getMe(await sign({ sub: USER_ID }))).status).toBe(401);
    });
  });

  describe('POST /login', () => {
    it('pose le cookie de session et renvoie le profil', async () => {
      seedUser();

      const response = await post('/login', { email: EMAIL, password: PASSWORD });
      const cookie = accessTokenCookieOf(response);

      expect(await parse(response)).toEqual({ status: 200, body: { success: true, data: expectedProfile } });
      expect(cookie).toMatch(/HttpOnly/);
      expect(cookie).toMatch(/SameSite=Lax/);
      expect(cookie).toMatch(/Path=\//);
      expect(cookie).toMatch(/Max-Age=3600/);
    });

    it('donne un cookie qui ouvre GET /me', async () => {
      seedUser();

      const cookie = accessTokenCookieOf(await post('/login', { email: EMAIL, password: PASSWORD }));
      const token = cookie?.split(';')[0].slice('access_token='.length);

      expect(await getMe(token)).toEqual({ status: 200, body: { success: true, data: expectedProfile } });
    });

    it("accepte l'email sans tenir compte de la casse ni des espaces", async () => {
      seedUser();

      expect((await post('/login', { email: '  Marie.Durand@Example.FR ', password: PASSWORD })).status).toBe(200);
    });

    it.each([
      ['un mauvais mot de passe', () => seedUser(), { email: EMAIL, password: 'mauvais' }],
      ['un email inconnu', () => undefined, { email: 'inconnu@example.fr', password: PASSWORD }],
      ['un compte désactivé', () => seedUser(false), { email: EMAIL, password: PASSWORD }],
    ])('renvoie 401 sans cookie pour %s, avec le même message', async (_case, seed, credentials) => {
      seed();

      const response = await post('/login', credentials);

      expect(accessTokenCookieOf(response)).toBeUndefined();
      expect(await parse(response)).toEqual({ status: 401, body: INVALID_CREDENTIALS });
    });

    it.each([
      ['sans corps', undefined],
      ['avec un email invalide', { email: 'pas-un-email', password: PASSWORD }],
      ['sans mot de passe', { email: EMAIL, password: '' }],
    ])('renvoie 400 %s', async (_case, body) => {
      expect((await post('/login', body)).status).toBe(400);
    });
  });

  describe('POST /logout', () => {
    it('supprime le cookie de session avec les mêmes options, sans corps', async () => {
      const response = await post('/logout');
      const cookie = accessTokenCookieOf(response);

      expect(response.status).toBe(204);
      expect(await response.text()).toBe('');
      expect(cookie).toMatch(/^access_token=;/);
      expect(cookie).toMatch(/Expires=Thu, 01 Jan 1970/);
      expect(cookie).toMatch(/HttpOnly/);
      expect(cookie).toMatch(/SameSite=Lax/);
      expect(cookie).toMatch(/Path=\//);
    });
  });
});
