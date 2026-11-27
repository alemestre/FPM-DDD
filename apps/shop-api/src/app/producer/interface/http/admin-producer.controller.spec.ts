import { DomainValidationErrorFilter } from '../../../shared/interface/http/domain-validation-error.filter';
import { JwtCookieAuthGuard } from '../../../auth/interface/http/guards/jwt-cookie-auth.guard';
import { JwtCookieStrategy } from '../../../auth/interface/http/strategies/jwt-cookie.strategy';
import { GetCurrentUserUseCase } from '../../../auth/application/use-cases/get-current-user.use-case';
import { DeactivateProducerUseCase } from '../../application/use-cases/deactivate-producer.use-case';
import { ActivateProducerUseCase } from '../../application/use-cases/activate-producer.use-case';
import { CreateProducerUseCase } from '../../application/use-cases/create-producer.use-case';
import { UpdateProducerUseCase } from '../../application/use-cases/update-producer.use-case';
import { ListProducersUseCase } from '../../application/use-cases/list-producers.use-case';
import { GetProducerUseCase } from '../../application/use-cases/get-producer.use-case';
import { AdminGuard } from '../../../auth/interface/http/guards/admin.guard';
import { ACCESS_TOKEN_COOKIE } from '../../../auth/interface/http/auth.constants';
import { type INestApplication, NotFoundException } from '@nestjs/common';
import { ProducerRepository } from '../../domain/producer.repository';
import { AdminProducerController } from './admin-producer.controller';
import { Producer } from '../../domain/producer.entity';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
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
const PRODUCER_ID = 'a3bb189e-8bf9-4888-9912-ace4e6543002';
const ADMIN_ID = '9b2d7c1e-4f3a-4e8b-a6d5-1c0f2e3d4b5a';
const CUSTOMER_ID = '3f0c9a52-8a6e-4c1b-9d57-2b1e7f4a6c10';

class InMemoryProducerRepository extends ProducerRepository {
  readonly producers = new Map<string, Producer>();

  async save(producer: Producer): Promise<Producer> {
    this.producers.set(producer.id, producer);
    return producer;
  }

  async findById(id: string): Promise<Producer | null> {
    return this.producers.get(id) ?? null;
  }

  async findByIdOrFail(id: string): Promise<Producer> {
    const producer = this.producers.get(id);
    if (!producer) throw new NotFoundException();
    return producer;
  }

  async findAll(): Promise<Producer[]> {
    return [...this.producers.values()];
  }

  async update(): Promise<Producer> {
    throw new Error('not used by the producer use cases');
  }

  async delete(): Promise<void> {
    throw new Error('producers are never deleted');
  }
}

describe('AdminProducerController (HTTP)', () => {
  let app: INestApplication;
  let repository: InMemoryProducerRepository;
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
    const response = await fetch(`${baseUrl}/admin/producers${path}`, {
      method,
      headers: { 'content-type': 'application/json', ...(cookie && { cookie }) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await response.text();
    return { status: response.status, body: text ? JSON.parse(text) : undefined };
  };
  const request = (method: string, path: string, body?: unknown) => requestAs(adminCookie, method, path, body);

  const seedProducer = (isActive = true) =>
    repository.producers.set(
      PRODUCER_ID,
      Producer.reconstitute(
        PRODUCER_ID,
        'Ferme du Moulin',
        'contact@ferme-moulin.fr',
        '+33612345678',
        'FR40303265045',
        '1 chemin du Moulin',
        '75001',
        'Paris',
        '',
        isActive,
      ),
    );

  const expectedProducer = {
    id: PRODUCER_ID,
    name: 'Ferme du Moulin',
    email: 'contact@ferme-moulin.fr',
    phone: '+33612345678',
    vatNumber: 'FR40303265045',
    addressLine1: '1 chemin du Moulin',
    addressLine2: '',
    postalCode: '75001',
    city: 'Paris',
    isActive: true,
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: 'test-secret' })],
      controllers: [AdminProducerController],
      providers: [
        JwtCookieAuthGuard,
        JwtCookieStrategy,
        AdminGuard,
        { provide: GetCurrentUserUseCase, useValue: getCurrentUser },
        { provide: ConfigService, useValue: { getOrThrow: () => 'test-secret' } },
        CreateProducerUseCase,
        ListProducersUseCase,
        GetProducerUseCase,
        UpdateProducerUseCase,
        ActivateProducerUseCase,
        DeactivateProducerUseCase,
        { provide: ProducerRepository, useClass: InMemoryProducerRepository },
        { provide: APP_PIPE, useClass: ZodValidationPipe },
        { provide: APP_FILTER, useClass: DomainValidationErrorFilter },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    await app.listen(0);
    baseUrl = await app.getUrl();
    repository = moduleRef.get(ProducerRepository);

    const jwt = moduleRef.get(JwtService);
    adminCookie = `${ACCESS_TOKEN_COOKIE}=${await jwt.signAsync({ sub: ADMIN_ID })}`;
    customerCookie = `${ACCESS_TOKEN_COOKIE}=${await jwt.signAsync({ sub: CUSTOMER_ID })}`;
  });

  beforeEach(() => repository.producers.clear());

  afterAll(async () => {
    await app.close();
  });

  describe('accès', () => {
    // Toujours 3 colonnes : avec moins, Jest passerait `done` en dernier argument et attendrait son appel.
    const routes: [string, string, unknown][] = [
      ['GET', '', undefined],
      ['GET', `/${PRODUCER_ID}`, undefined],
      ['POST', '', { name: 'Ferme des Saules' }],
      ['PATCH', `/${PRODUCER_ID}`, { city: 'Lyon' }],
      ['POST', `/${PRODUCER_ID}/activate`, undefined],
      ['POST', `/${PRODUCER_ID}/deactivate`, undefined],
    ];

    it.each(routes)('%s %s renvoie 401 sans session', async (method, path, body) => {
      seedProducer();

      expect((await requestAs(null, method, path, body)).status).toBe(401);
      const producer = repository.producers.get(PRODUCER_ID);
      expect([producer?.city, producer?.isActive]).toEqual(['Paris', true]);
    });

    it.each(routes)('%s %s renvoie 403 pour un client', async (method, path, body) => {
      seedProducer();

      expect((await requestAs(customerCookie, method, path, body)).status).toBe(403);
      const producer = repository.producers.get(PRODUCER_ID);
      expect([producer?.city, producer?.isActive]).toEqual(['Paris', true]);
    });
  });

  describe('POST /admin/producers', () => {
    const payload = {
      name: 'Ferme du Moulin',
      email: 'contact@ferme-moulin.fr',
      phone: '06 12 34 56 78',
      vatNumber: 'FR40303265045',
      addressLine1: '1 chemin du Moulin',
      postalCode: '75001',
      city: 'Paris',
    };

    it('crée un producteur actif et renvoie sa représentation publique (201)', async () => {
      const { status, body } = await request('POST', '', payload);

      expect(status).toBe(201);
      expect(body).toEqual({ ...expectedProducer, id: NEW_ID });
    });

    it('renvoie 400 si le corps est invalide', async () => {
      expect((await request('POST', '', { ...payload, email: 'pas-un-email' })).status).toBe(400);
    });

    it('renvoie 400 si le numéro de TVA est invalide', async () => {
      const { status, body } = await request('POST', '', { ...payload, vatNumber: 'FR41303265045' });

      expect(status).toBe(400);
      expect(body.message).toContain('clé du numéro de TVA');
    });
  });

  describe('GET', () => {
    it('liste tous les producteurs, actifs ou non', async () => {
      seedProducer(false);

      const { status, body } = await request('GET', '');

      expect(status).toBe(200);
      expect(body).toEqual([{ ...expectedProducer, isActive: false }]);
    });

    it('renvoie un producteur par id', async () => {
      seedProducer();

      expect(await request('GET', `/${PRODUCER_ID}`)).toEqual({ status: 200, body: expectedProducer });
    });

    it("renvoie 404 si le producteur n'existe pas", async () => {
      expect((await request('GET', `/${PRODUCER_ID}`)).status).toBe(404);
    });

    it("renvoie 400 si l'id n'est pas un UUID", async () => {
      expect((await request('GET', '/abc')).status).toBe(400);
    });
  });

  describe('PATCH /admin/producers/:id', () => {
    it('met à jour les champs fournis', async () => {
      seedProducer();

      const { status, body } = await request('PATCH', `/${PRODUCER_ID}`, { city: 'Lyon', postalCode: '69002' });

      expect(status).toBe(200);
      expect(body).toEqual({ ...expectedProducer, city: 'Lyon', postalCode: '69002' });
    });

    it('désactive puis réactive le producteur via isActive', async () => {
      seedProducer();

      const deactivated = await request('PATCH', `/${PRODUCER_ID}`, { isActive: false });
      expect(deactivated).toEqual({ status: 200, body: { ...expectedProducer, isActive: false } });
      expect(repository.producers.get(PRODUCER_ID)?.isActive).toBe(false);

      const reactivated = await request('PATCH', `/${PRODUCER_ID}`, { isActive: true });
      expect(reactivated).toEqual({ status: 200, body: expectedProducer });
    });

    it("garde l'état actif quand isActive n'est pas envoyé", async () => {
      seedProducer(false);

      const { body } = await request('PATCH', `/${PRODUCER_ID}`, { city: 'Lyon' });

      expect(body.isActive).toBe(false);
    });

    it('renvoie 400 si isActive n’est pas un booléen', async () => {
      seedProducer();

      const { status } = await request('PATCH', `/${PRODUCER_ID}`, { isActive: 'non' });

      expect(status).toBe(400);
      expect(repository.producers.get(PRODUCER_ID)?.isActive).toBe(true);
    });
  });

  describe('activation', () => {
    it('désactive puis réactive un producteur sans le supprimer', async () => {
      seedProducer();

      const deactivated = await request('POST', `/${PRODUCER_ID}/deactivate`);
      expect(deactivated).toEqual({ status: 200, body: { ...expectedProducer, isActive: false } });
      expect(repository.producers.has(PRODUCER_ID)).toBe(true);

      const activated = await request('POST', `/${PRODUCER_ID}/activate`);
      expect(activated).toEqual({ status: 200, body: expectedProducer });
    });

    it("renvoie 404 si le producteur à désactiver n'existe pas", async () => {
      expect((await request('POST', `/${PRODUCER_ID}/deactivate`)).status).toBe(404);
    });
  });

  it("n'expose pas de route DELETE (404)", async () => {
    seedProducer();

    expect((await request('DELETE', `/${PRODUCER_ID}`)).status).toBe(404);
    expect(repository.producers.has(PRODUCER_ID)).toBe(true);
  });
});
