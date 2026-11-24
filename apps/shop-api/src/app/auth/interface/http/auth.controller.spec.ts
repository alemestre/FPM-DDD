import { ApiResponseInterceptor } from '../../../shared/interface/http/api-response.interceptor';
import { DomainValidationErrorFilter } from '../../../shared/interface/http/domain-validation-error.filter';
import { PasswordHasher } from '../../application/ports/password-hasher';
import { VerificationEmailSender } from '../../application/ports/verification-email-sender';
import { ForgotPasswordEmailSender } from '../../application/ports/forgot-password-email-sender';
import type { CustomerRegistration } from '../../domain/customer-registration';
import { EmailAlreadyUsedError } from '../../domain/errors/email-already-used.error';
import { EMAIL_VERIFICATION_PURPOSE } from '../../infrastructure/jwt-email-verification.token';
import { RESET_PASSWORD_PURPOSE } from '../../infrastructure/jwt-forgot-password.token';
import { ACCESS_TOKEN_TTL_SECONDS } from './auth.constants';
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
const INVALID_RESET_LINK = 'Le lien de réinitialisation est invalide ou a expiré';
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

  async findCredentialsById(id: string): Promise<UserCredentials | null> {
    return [...this.credentials.values()].find(({ user }) => user.id === id) ?? null;
  }

  async savePasswordHash(userId: string, passwordHash: string): Promise<void> {
    const credentials = await this.findCredentialsById(userId);
    if (credentials) {
      this.credentials.set(credentials.user.email, { ...credentials, passwordHash });
    }
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

/** Garde les jetons de réinitialisation au lieu d'envoyer des emails. */
class FakeForgotPasswordEmailSender extends ForgotPasswordEmailSender {
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
  let forgotPasswordEmailSender: FakeForgotPasswordEmailSender;
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

  /** Demande un lien « mot de passe oublié » et renvoie le jeton qu'il contient. */
  const resetLinkFor = async (email: string) => {
    await post('/forgot-password', { email });
    return forgotPasswordEmailSender.sent[forgotPasswordEmailSender.sent.length - 1].token;
  };

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
      .overrideProvider(ForgotPasswordEmailSender)
      .useClass(FakeForgotPasswordEmailSender)
      .compile();

    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    await app.listen(0);
    baseUrl = await app.getUrl();
    repository = app.get(UserRepository);
    emailSender = app.get(VerificationEmailSender);
    forgotPasswordEmailSender = app.get(ForgotPasswordEmailSender);
  });

  afterAll(() => app.close());

  beforeEach(() => {
    repository.credentials.clear();
    repository.registrations.length = 0;
    emailSender.sent.length = 0;
    forgotPasswordEmailSender.sent.length = 0;
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

    it('donne un jeton de session qui expire avec le cookie (1 h)', async () => {
      seedUser();

      const cookie = accessTokenCookieOf(await post('/login', { email: EMAIL, password: PASSWORD }));
      const token = cookie?.split(';')[0].slice('access_token='.length) ?? '';
      const { iat, exp } = new JwtService({ secret: SECRET }).decode<{ iat: number; exp?: number }>(token);

      expect(exp).toBeDefined();
      expect((exp ?? 0) - iat).toBe(ACCESS_TOKEN_TTL_SECONDS);
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

  describe('POST /admin/login', () => {
    const ADMIN_ID = 'a1b2c3d4-5e6f-4a7b-8c9d-0e1f2a3b4c5e';
    const ADMIN_EMAIL = 'admin@example.fr';

    const seedAdmin = () =>
      repository.credentials.set(ADMIN_EMAIL, {
        user: User.reconstitute(ADMIN_ID, ADMIN_EMAIL, 'Alice', 'Martin', 'ADMIN', true, true),
        passwordHash: `hash:${PASSWORD}`,
      });

    it("pose le cookie de session et renvoie le profil d'un admin", async () => {
      seedAdmin();

      const response = await post('/admin/login', { email: ADMIN_EMAIL, password: PASSWORD });

      expect(accessTokenCookieOf(response)).toMatch(/HttpOnly/);
      expect(await parse(response)).toEqual({
        status: 200,
        body: {
          success: true,
          data: { id: ADMIN_ID, email: ADMIN_EMAIL, firstName: 'Alice', lastName: 'Martin', role: 'ADMIN' },
        },
      });
    });

    it("refuse un client (401, même message qu'un mauvais mot de passe) sans poser de cookie", async () => {
      seedUser();

      const response = await post('/admin/login', { email: EMAIL, password: PASSWORD });

      expect(accessTokenCookieOf(response)).toBeUndefined();
      expect(await parse(response)).toEqual({ status: 401, body: INVALID_CREDENTIALS });
    });

    it('refuse un admin avec un mauvais mot de passe', async () => {
      seedAdmin();

      const response = await post('/admin/login', { email: ADMIN_EMAIL, password: 'mauvais' });

      expect(accessTokenCookieOf(response)).toBeUndefined();
      expect(response.status).toBe(401);
    });

    it.each([
      ['sans corps', undefined],
      ['avec un email invalide', { email: 'pas-un-email', password: PASSWORD }],
    ])('renvoie 400 %s', async (_case, body) => {
      expect((await post('/admin/login', body)).status).toBe(400);
    });
  });

  describe('PATCH /me/password', () => {
    const NEW_PASSWORD = 'Nouveau1!motdepasse';

    const patchPassword = async (body: unknown, token?: string) =>
      parse(
        await fetch(`${baseUrl}/me/password`, {
          method: 'PATCH',
          headers: {
            'content-type': 'application/json',
            ...(token === undefined ? {} : { cookie: `access_token=${token}` }),
          },
          body: JSON.stringify(body),
        }),
      );

    it('change le mot de passe (204) : le nouveau permet de se connecter, plus l’ancien', async () => {
      seedUser();

      const result = await patchPassword(
        { currentPassword: PASSWORD, newPassword: NEW_PASSWORD },
        await sign({ sub: USER_ID }),
      );

      expect(result).toEqual({ status: 204, body: undefined });
      expect((await post('/login', { email: EMAIL, password: NEW_PASSWORD })).status).toBe(200);
      expect((await post('/login', { email: EMAIL, password: PASSWORD })).status).toBe(401);
    });

    it('renvoie 400 si le mot de passe actuel est incorrect', async () => {
      seedUser();

      expect(
        await patchPassword({ currentPassword: 'mauvais', newPassword: NEW_PASSWORD }, await sign({ sub: USER_ID })),
      ).toEqual({
        status: 400,
        body: { statusCode: 400, error: 'Bad Request', message: 'Le mot de passe actuel est incorrect' },
      });
      expect(repository.credentials.get(EMAIL)?.passwordHash).toBe(`hash:${PASSWORD}`);
    });

    it.each([
      ['un nouveau mot de passe sans majuscule ni caractère spécial', 'motdepasse2'],
      ['un nouveau mot de passe trop court', 'Ab1!'],
    ])('renvoie 400 pour %s', async (_case, newPassword) => {
      seedUser();

      const { status } = await patchPassword({ currentPassword: PASSWORD, newPassword }, await sign({ sub: USER_ID }));

      expect(status).toBe(400);
      expect(repository.credentials.get(EMAIL)?.passwordHash).toBe(`hash:${PASSWORD}`);
    });

    it('renvoie 401 sans cookie de session', async () => {
      seedUser();

      expect((await patchPassword({ currentPassword: PASSWORD, newPassword: NEW_PASSWORD })).status).toBe(401);
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
      addressLine1: '1 rue des Lilas',
      postalCode: '75001',
      city: 'Paris',
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
      expect(repository.registrations[0].address.postalCode.toString()).toBe('75001');
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

    it("enregistre l'adresse", async () => {
      const response = await post('/register', { ...registration, addressLine2: 'Bât. B' });

      expect(response.status).toBe(201);
      expect(repository.registrations[0].address).toMatchObject({ line1: '1 rue des Lilas', line2: 'Bât. B', city: 'Paris' });
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
      ['sans adresse', { ...registration, addressLine1: undefined, postalCode: undefined, city: undefined }],
      ['sans ligne d\'adresse', { ...registration, addressLine1: undefined }],
      ['sans code postal', { ...registration, postalCode: undefined }],
      ['sans ville', { ...registration, city: undefined }],
      ['avec une ville vide', { ...registration, city: '  ' }],
      ['avec un code postal invalide', { ...registration, postalCode: 'ABC' }],
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

  describe('POST /forgot-password', () => {
    it("envoie un lien de réinitialisation, sans l'email de vérification, et répond 204 sans corps", async () => {
      seedUser();

      const response = await post('/forgot-password', { email: '  Marie.Durand@Example.FR ' });

      expect(response.status).toBe(204);
      expect(await response.text()).toBe('');
      expect(forgotPasswordEmailSender.sent).toEqual([{ email: EMAIL, token: expect.any(String) }]);
      expect(emailSender.sent).toHaveLength(0);
    });

    it('répond 204 sans rien envoyer pour un email inconnu', async () => {
      const response = await post('/forgot-password', { email: 'inconnu@example.fr' });

      expect(response.status).toBe(204);
      expect(forgotPasswordEmailSender.sent).toHaveLength(0);
    });

    it('répond 204 sans rien envoyer pour un compte désactivé', async () => {
      seedUser(false);

      expect((await post('/forgot-password', { email: EMAIL })).status).toBe(204);
      expect(forgotPasswordEmailSender.sent).toHaveLength(0);
    });

    it.each([
      ['sans corps', undefined],
      ['avec un email invalide', { email: 'pas-un-email' }],
    ])('renvoie 400 %s', async (_case, body) => {
      expect((await post('/forgot-password', body)).status).toBe(400);
      expect(forgotPasswordEmailSender.sent).toHaveLength(0);
    });

    it('ne laisse pas le lien de réinitialisation servir de cookie de session', async () => {
      seedUser();
      await post('/forgot-password', { email: EMAIL });

      expect((await getMe(forgotPasswordEmailSender.sent[0].token)).status).toBe(401);
    });
  });

  describe('POST /verify-forgot-password-token', () => {
    it('répond 204 pour un lien valide', async () => {
      seedUser();
      const token = await resetLinkFor(EMAIL);

      expect((await post('/verify-forgot-password-token', { token })).status).toBe(204);
    });

    it('renvoie 400 pour un lien invalide, avec un message propre à la réinitialisation', async () => {
      expect(await parse(await post('/verify-forgot-password-token', { token: 'pas.un.jeton' }))).toEqual({
        status: 400,
        body: { statusCode: 400, error: 'Bad Request', message: INVALID_RESET_LINK },
      });
    });

    it('renvoie 400 si le compte a été désactivé depuis l’envoi du lien', async () => {
      seedUser();
      const token = await resetLinkFor(EMAIL);
      seedUser(false);

      expect((await post('/verify-forgot-password-token', { token })).status).toBe(400);
    });

    it.each([
      ['sans corps', undefined],
      ['avec un jeton vide', { token: '' }],
      ['avec un champ inconnu', { token: 'a.b.c', email: EMAIL }],
    ])('renvoie 400 %s', async (_case, body) => {
      expect((await post('/verify-forgot-password-token', body)).status).toBe(400);
    });
  });

  describe('POST /reset-password', () => {
    const NEW_PASSWORD = 'Nouveau1!motdepasse';

    it('change le mot de passe (204) : le nouveau permet de se connecter, plus l’ancien', async () => {
      seedUser();
      const token = await resetLinkFor(EMAIL);

      const response = await post('/reset-password', { token, password: NEW_PASSWORD });

      expect(response.status).toBe(204);
      expect(await response.text()).toBe('');
      expect((await post('/login', { email: EMAIL, password: NEW_PASSWORD })).status).toBe(200);
      expect((await post('/login', { email: EMAIL, password: PASSWORD })).status).toBe(401);
    });

    it('ne laisse servir le lien qu’une fois', async () => {
      seedUser();
      const token = await resetLinkFor(EMAIL);
      await post('/reset-password', { token, password: NEW_PASSWORD });

      expect((await post('/reset-password', { token, password: 'Autre2!motdepasse' })).status).toBe(400);
      expect((await post('/verify-forgot-password-token', { token })).status).toBe(400);
      expect(repository.credentials.get(EMAIL)?.passwordHash).toBe(`hash:${NEW_PASSWORD}`);
    });

    it('renvoie 400 pour un lien invalide', async () => {
      seedUser();

      expect(await parse(await post('/reset-password', { token: 'pas.un.jeton', password: NEW_PASSWORD }))).toEqual({
        status: 400,
        body: { statusCode: 400, error: 'Bad Request', message: INVALID_RESET_LINK },
      });
      expect(repository.credentials.get(EMAIL)?.passwordHash).toBe(`hash:${PASSWORD}`);
    });

    it('revérifie le lien à la soumission : refusé s’il a expiré depuis l’ouverture de la page', async () => {
      seedUser();
      const expired = await new JwtService({ secret: SECRET }).signAsync(
        { sub: USER_ID, purpose: RESET_PASSWORD_PURPOSE, pwd: 'empreinte' },
        { expiresIn: -60 },
      );

      expect((await post('/reset-password', { token: expired, password: NEW_PASSWORD })).status).toBe(400);
      expect(repository.credentials.get(EMAIL)?.passwordHash).toBe(`hash:${PASSWORD}`);
    });

    it('revérifie le lien à la soumission : refusé si le mot de passe a changé entre-temps', async () => {
      seedUser();
      const token = await resetLinkFor(EMAIL);
      expect((await post('/verify-forgot-password-token', { token })).status).toBe(204);
      await repository.savePasswordHash(USER_ID, 'hash:Autre2!motdepasse');

      expect((await post('/reset-password', { token, password: NEW_PASSWORD })).status).toBe(400);
      expect(repository.credentials.get(EMAIL)?.passwordHash).toBe('hash:Autre2!motdepasse');
    });

    it('revérifie le lien à la soumission : refusé si le compte a été désactivé entre-temps', async () => {
      seedUser();
      const token = await resetLinkFor(EMAIL);
      seedUser(false);

      expect(await parse(await post('/reset-password', { token, password: NEW_PASSWORD }))).toEqual({
        status: 400,
        body: { statusCode: 400, error: 'Bad Request', message: INVALID_RESET_LINK },
      });
      expect(repository.credentials.get(EMAIL)?.passwordHash).toBe(`hash:${PASSWORD}`);
    });

    it('refuse un lien de vérification d’email à la place du lien de réinitialisation', async () => {
      seedUser();
      const token = await sign({ sub: USER_ID, purpose: EMAIL_VERIFICATION_PURPOSE });

      expect((await post('/reset-password', { token, password: NEW_PASSWORD })).status).toBe(400);
    });

    it('renvoie 400 pour un mot de passe qui ne respecte pas les règles', async () => {
      seedUser();
      const token = await resetLinkFor(EMAIL);

      expect((await post('/reset-password', { token, password: 'motdepasse2' })).status).toBe(400);
      expect(repository.credentials.get(EMAIL)?.passwordHash).toBe(`hash:${PASSWORD}`);
    });

    it('renvoie 400 si le nouveau mot de passe est identique à l’actuel', async () => {
      const current = 'Actuel1!motdepasse';
      repository.credentials.set(EMAIL, {
        user: User.reconstitute(USER_ID, EMAIL, 'Marie', 'Durand', 'CUSTOMER', true, true),
        passwordHash: `hash:${current}`,
      });
      const token = await resetLinkFor(EMAIL);

      expect(await parse(await post('/reset-password', { token, password: current }))).toEqual({
        status: 400,
        body: { statusCode: 400, error: 'Bad Request', message: "Le nouveau mot de passe doit être différent de l'actuel" },
      });
    });

    it.each([
      ['sans corps', undefined],
      ['sans jeton', { password: NEW_PASSWORD }],
      ['sans mot de passe', { token: 'header.payload.signature' }],
    ])('renvoie 400 %s', async (_case, body) => {
      expect((await post('/reset-password', body)).status).toBe(400);
    });
  });
});
