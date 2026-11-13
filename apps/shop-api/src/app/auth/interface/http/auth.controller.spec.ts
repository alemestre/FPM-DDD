import { ApiResponseInterceptor } from '../../../shared/interface/http/api-response.interceptor';
import { DomainValidationErrorFilter } from '../../../shared/interface/http/domain-validation-error.filter';
import { PasswordHasher } from '../../application/ports/password-hasher';
import { VerificationEmailSender } from '../../application/ports/verification-email-sender';
import type { CustomerRegistration } from '../../domain/customer-registration';
import { EmailAlreadyUsedError } from '../../domain/errors/email-already-used.error';
import type { UserCredentials } from '../../domain/user.credentials';
import { Global, type INestApplication, Module } from '@nestjs/common';
import { UserRepository } from '../../domain/user.repository';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
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
// Pas de MailModule réel (il lirait MAIL_FROM) : l'envoi est remplacé par FakeVerificationEmailSender.
jest.mock('@nestjs/mail', () => {
  class MailModule {}
  return {
    MailModule: Object.assign(MailModule, { forRootAsync: () => ({ module: MailModule }) }),
    Mailer: class Mailer {},
    MailError: class MailError extends Error {},
    html: (strings: TemplateStringsArray) => strings.join(''),
  };
});

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

  readonly registrations: CustomerRegistration[] = [];

  async register(registration: CustomerRegistration): Promise<void> {
    if (this.credentials.has(registration.user.email)) {
      throw new EmailAlreadyUsedError();
    }
    this.registrations.push(registration);
    this.credentials.set(registration.user.email, {
      user: registration.user,
      passwordHash: registration.passwordHash,
    });
  }

  async save(): Promise<void> {
    // The aggregate in the map is the same instance, already up to date.
  }
}

/** Garde les jetons envoyés au lieu d'envoyer des emails. */
class FakeVerificationEmailSender extends VerificationEmailSender {
  readonly sent: { email: string; token: string }[] = [];

  async send(user: User, token: string): Promise<void> {
    this.sent.push({ email: user.email, token });
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
  let emailSender: FakeVerificationEmailSender;
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
      user: User.reconstitute(USER_ID, EMAIL, 'Marie', 'Durand', 'CUSTOMER', isActive, true),
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
        // Registered globally by AppModule.
        { provide: APP_FILTER, useClass: DomainValidationErrorFilter },
      ],
    })
      .overrideProvider(UserRepository)
      .useClass(InMemoryUserRepository)
      .overrideProvider(PasswordHasher)
      .useClass(FakePasswordHasher)
      .overrideProvider(VerificationEmailSender)
      .useClass(FakeVerificationEmailSender)
      .compile();

    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    await app.listen(0);
    baseUrl = await app.getUrl();
    repository = app.get(UserRepository);
    emailSender = app.get(VerificationEmailSender);
  });

  afterAll(() => app.close());

  beforeEach(() => {
    repository.credentials.clear();
    repository.registrations.length = 0;
    emailSender.sent.length = 0;
  });

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

  describe('inscription et vérification de l\'email', () => {
    const registration = {
      email: 'Paul.Martin@Example.FR',
      password: 'MotDePasse1!',
      firstName: 'Paul',
      lastName: 'Martin',
      phone: '06 12 34 56 78',
    };
    const NEW_EMAIL = 'paul.martin@example.fr';

    const login = () => post('/login', { email: NEW_EMAIL, password: registration.password });

    it('crée un compte non vérifié sans ouvrir de session, et envoie un lien de vérification', async () => {
      const response = await post('/register', registration);
      const { status, body } = await parse(response);

      expect(status).toBe(201);
      expect(body).toEqual({
        success: true,
        data: { id: expect.any(String), email: NEW_EMAIL, firstName: 'Paul', lastName: 'Martin', role: 'CUSTOMER' },
      });
      expect(accessTokenCookieOf(response)).toBeUndefined();
      expect(emailSender.sent).toEqual([{ email: NEW_EMAIL, token: expect.any(String) }]);
      expect(repository.registrations[0].address).toBeUndefined();
    });

    it('refuse la connexion (403) tant que l\'email n\'est pas vérifié, puis l\'accepte', async () => {
      await post('/register', registration);

      const refused = await login();
      expect(accessTokenCookieOf(refused)).toBeUndefined();
      expect(await parse(refused)).toEqual({
        status: 403,
        body: {
          statusCode: 403,
          error: 'Forbidden',
          message: 'Vous devez confirmer votre adresse email avant de vous connecter',
        },
      });

      const verified = await post('/verify-email', { token: emailSender.sent[0].token });
      expect(verified.status).toBe(204);
      expect(await verified.text()).toBe('');

      expect((await login()).status).toBe(200);
    });

    it('enregistre une adresse complète', async () => {
      const response = await post('/register', {
        ...registration,
        addressLine1: '1 rue des Lilas',
        postalCode: '75001',
        city: 'Paris',
      });

      expect(response.status).toBe(201);
      expect(repository.registrations[0].address).toMatchObject({ line1: '1 rue des Lilas', line2: '', city: 'Paris' });
    });

    it('renvoie 409 si un compte existe déjà avec cet email', async () => {
      await post('/register', registration);

      expect(await parse(await post('/register', registration))).toEqual({
        status: 409,
        body: { statusCode: 409, error: 'Conflict', message: 'Un compte existe déjà avec cette adresse email' },
      });
      expect(emailSender.sent).toHaveLength(1);
    });

    it.each([
      ['sans corps', undefined],
      ['avec un email invalide', { ...registration, email: 'pas-un-email' }],
      ['avec un mot de passe trop court', { ...registration, password: 'court' }],
      ['avec un mot de passe trop faible', { ...registration, password: 'motdepasse-faible' }],
      ['sans téléphone', { ...registration, phone: undefined }],
      ['avec un téléphone invalide', { ...registration, phone: '123' }],
      ['avec une adresse incomplète', { ...registration, addressLine1: '1 rue des Lilas' }],
      ['avec un code postal invalide', { ...registration, addressLine1: '1 rue', postalCode: 'ABC', city: 'Paris' }],
    ])('renvoie 400 %s, sans créer de compte', async (_case, body) => {
      expect((await post('/register', body)).status).toBe(400);
      expect(repository.registrations).toHaveLength(0);
      expect(emailSender.sent).toHaveLength(0);
    });

    it('renvoie 400 pour un lien de vérification invalide', async () => {
      expect(await parse(await post('/verify-email', { token: 'falsifié' }))).toEqual({
        status: 400,
        body: { statusCode: 400, error: 'Bad Request', message: 'Le lien de vérification est invalide ou a expiré' },
      });
    });

    it('ne laisse pas le lien de vérification servir de cookie de session', async () => {
      await post('/register', registration);

      expect((await getMe(emailSender.sent[0].token)).status).toBe(401);
    });

    it('renvoie un nouveau lien à un compte non vérifié', async () => {
      await post('/register', registration);

      const response = await post('/resend-verification', { email: NEW_EMAIL });

      expect(response.status).toBe(204);
      expect(emailSender.sent).toHaveLength(2);
    });

    it('répond 204 sans rien envoyer pour un email inconnu', async () => {
      const response = await post('/resend-verification', { email: 'inconnu@example.fr' });

      expect(response.status).toBe(204);
      expect(emailSender.sent).toHaveLength(0);
    });
  });
});
