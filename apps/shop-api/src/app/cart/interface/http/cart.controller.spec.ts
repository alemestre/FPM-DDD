import { DomainValidationErrorFilter } from '../../../shared/interface/http/domain-validation-error.filter';
import { ChangeCartItemQuantityUseCase } from '../../application/use-cases/change-cart-item-quantity.use-case';
import { ApiResponseInterceptor } from '../../../shared/interface/http/api-response.interceptor';
import { JwtCookieAuthGuard } from '../../../auth/interface/http/guards/jwt-cookie-auth.guard';
import { JwtCookieStrategy } from '../../../auth/interface/http/strategies/jwt-cookie.strategy';
import { RemoveCartItemUseCase } from '../../application/use-cases/remove-cart-item.use-case';
import { AddCartItemUseCase } from '../../application/use-cases/add-cart-item.use-case';
import { GetCartUseCase } from '../../application/use-cases/get-cart.use-case';
import { ClearCartUseCase } from '../../application/use-cases/clear-cart.use-case';
import {
    carrots,
    createProductRepositoryMock,
    withProducer,
} from '../../application/use-cases/cart-use-case.test-helpers';
import { ACCESS_TOKEN_COOKIE } from '../../../auth/interface/http/auth.constants';
import { ProductRepository } from '../../../product/domain/product.repository';
import { Product } from '../../../product/domain/product.entity';
import { CartRepository } from '../../domain/cart.repository';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { Cart } from '../../domain/cart.entity';
import { CartController } from './cart.controller';
import type { INestApplication } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ZodValidationPipe } from 'nestjs-zod';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';

// @nestjs/config est publié en ESM, que ts-jest ne charge pas : seul le jeton ConfigService est utile ici.
jest.mock('@nestjs/config', () => ({ ConfigService: class ConfigService {} }));

jest.mock('uuid', () => ({
    v4: jest.fn(() => '12345678-1234-4123-8123-123456789abc'),
    validate: jest.fn(() => true),
}));

const CUSTOMER_ID = '3f0c9a52-8a6e-4c1b-9d57-2b1e7f4a6c10';
const ADMIN_ID = '9b2d7c1e-4f3a-4e8b-a6d5-1c0f2e3d4b5a';
const CARROTS_ID = 'e3bb189e-8bf9-4888-9912-ace4e6543002';
const UNKNOWN_ID = 'd3bb189e-8bf9-4888-9912-ace4e6543002';

class InMemoryCartRepository extends CartRepository {
    readonly carts = new Map<string, Cart>();

    async findByCustomerId(customerId: string): Promise<Cart | null> {
        const cart = this.carts.get(customerId);
        return cart ? Cart.restore(cart) : null;
    }

    async save(cart: Cart): Promise<void> {
        this.carts.set(cart.customerId, Cart.restore(cart));
    }

    async customerExists(customerId: string): Promise<boolean> {
        return customerId === CUSTOMER_ID;
    }

}

describe('CartController (HTTP)', () => {
    let app: INestApplication;
    let carts: InMemoryCartRepository;
    let catalog: Map<string, Product>;
    let baseUrl: string;
    let customerCookie: string;
    let adminCookie: string;

    const request = async (method: string, path: string, cookie: string | null, body?: unknown) => {
        const response = await fetch(`${baseUrl}${path}`, {
            method,
            headers: {
                ...(body !== undefined && { 'content-type': 'application/json' }),
                ...(cookie && { cookie }),
            },
            body: body === undefined ? undefined : JSON.stringify(body),
        });
        const text = await response.text();
        return { status: response.status, body: text ? JSON.parse(text) : undefined };
    };

    beforeAll(async () => {
        catalog = new Map();
        const products = createProductRepositoryMock();
        products.findById.mockImplementation(async (id) => catalog.get(id) ?? null);
        products.findManyWithProducer.mockImplementation(async ({ productIds = [] } = {}) =>
            productIds.flatMap((id) => {
                const product = catalog.get(id);
                return product ? [withProducer(product)] : [];
            }),
        );

        const moduleRef = await Test.createTestingModule({
            imports: [JwtModule.register({ secret: 'test-secret' })],
            controllers: [CartController],
            providers: [
                JwtCookieAuthGuard,
                JwtCookieStrategy,
                { provide: ConfigService, useValue: { getOrThrow: () => 'test-secret' } },
                GetCartUseCase,
                AddCartItemUseCase,
                ChangeCartItemQuantityUseCase,
                RemoveCartItemUseCase,
                ClearCartUseCase,
                { provide: CartRepository, useClass: InMemoryCartRepository },
                { provide: ProductRepository, useValue: products },
                { provide: APP_PIPE, useClass: ZodValidationPipe },
                { provide: APP_INTERCEPTOR, useClass: ApiResponseInterceptor },
                { provide: APP_FILTER, useClass: DomainValidationErrorFilter },
            ],
        }).compile();

        app = moduleRef.createNestApplication();
        app.use(cookieParser());
        await app.listen(0);
        baseUrl = await app.getUrl();
        carts = moduleRef.get(CartRepository);

        const jwt = moduleRef.get(JwtService);
        customerCookie = `${ACCESS_TOKEN_COOKIE}=${await jwt.signAsync({ sub: CUSTOMER_ID })}`;
        adminCookie = `${ACCESS_TOKEN_COOKIE}=${await jwt.signAsync({ sub: ADMIN_ID })}`;
    });

    beforeEach(() => {
        carts.carts.clear();
        catalog.clear();
        catalog.set(CARROTS_ID, carrots({ stock: 4 }));
    });

    afterAll(async () => {
        await app.close();
    });

    const addCarrots = (quantity: number) =>
        request('POST', '/cart/items', customerCookie, { productId: CARROTS_ID, quantity });

    it.each([
        ['GET', '/cart', undefined],
        ['POST', '/cart/items', { productId: CARROTS_ID, quantity: 1 }],
        ['PATCH', `/cart/items/${CARROTS_ID}`, { quantity: 1 }],
        ['DELETE', `/cart/items/${CARROTS_ID}`, undefined],
        ['DELETE', '/cart/items', undefined],
    ])('%s %s répond 401 sans session', async (method, path, body) => {
        expect((await request(method, path, null, body)).status).toBe(401);
    });

    describe('GET /cart', () => {
        it("renvoie un panier vide au client qui n'en a pas", async () => {
            const { status, body } = await request('GET', '/cart', customerCookie);

            expect(status).toBe(200);
            expect(body).toEqual({ success: true, data: { items: [] } });
        });
    });

    describe('POST /cart/items', () => {
        it('ajoute le produit et renvoie le panier avec le produit complet', async () => {
            const { status, body } = await addCarrots(2);

            expect(status).toBe(201);
            expect(body.data.items).toEqual([
                {
                    product: expect.objectContaining({
                        id: CARROTS_ID,
                        name: 'Carottes',
                        price: 2.5,
                        stock: 4,
                        producer: { id: expect.any(String), name: 'Ferme des Lilas' },
                    }),
                    quantity: 2,
                },
            ]);
            expect((await request('GET', '/cart', customerCookie)).body.data.items).toHaveLength(1);
        });

        it('additionne les quantités et répond 400 au-delà du stock', async () => {
            await addCarrots(3);

            const { status, body } = await addCarrots(2);

            expect(status).toBe(400);
            expect(JSON.stringify(body)).toContain('Stock insuffisant pour \\"Carottes\\" : 4 disponible(s)');
            const cart = await request('GET', '/cart', customerCookie);
            expect(cart.body.data.items[0].quantity).toBe(3);
        });

        it.each([0, 11, 1.5])('répond 400 à la quantité %p', async (quantity) => {
            expect((await addCarrots(quantity)).status).toBe(400);
        });

        it('répond 400 à un produit inconnu ou indisponible', async () => {
            const unknown = await request('POST', '/cart/items', customerCookie, {
                productId: UNKNOWN_ID,
                quantity: 1,
            });
            catalog.set(CARROTS_ID, carrots({ isAvailable: false }));

            expect(unknown.status).toBe(400);
            expect((await addCarrots(1)).status).toBe(400);
        });

        it('répond 404 à un utilisateur sans profil client', async () => {
            const { status } = await request('POST', '/cart/items', adminCookie, {
                productId: CARROTS_ID,
                quantity: 1,
            });

            expect(status).toBe(404);
        });
    });

    describe('PATCH /cart/items/:productId', () => {
        it('remplace la quantité', async () => {
            await addCarrots(1);

            const { status, body } = await request('PATCH', `/cart/items/${CARROTS_ID}`, customerCookie, {
                quantity: 4,
            });

            expect(status).toBe(200);
            expect(body.data.items[0].quantity).toBe(4);
        });

        it('répond 400 au-delà du stock', async () => {
            await addCarrots(1);

            const { status } = await request('PATCH', `/cart/items/${CARROTS_ID}`, customerCookie, {
                quantity: 5,
            });

            expect(status).toBe(400);
        });

        it("répond 404 si le produit n'est pas dans le panier", async () => {
            const { status } = await request('PATCH', `/cart/items/${CARROTS_ID}`, customerCookie, {
                quantity: 1,
            });

            expect(status).toBe(404);
        });

        it("répond 400 à un id qui n'est pas un UUID", async () => {
            const { status } = await request('PATCH', '/cart/items/abc', customerCookie, { quantity: 1 });

            expect(status).toBe(400);
        });
    });

    describe('DELETE /cart/items/:productId', () => {
        it('retire le produit et renvoie le panier, puis 404 la seconde fois', async () => {
            await addCarrots(1);

            const first = await request('DELETE', `/cart/items/${CARROTS_ID}`, customerCookie);
            const second = await request('DELETE', `/cart/items/${CARROTS_ID}`, customerCookie);

            expect(first.status).toBe(200);
            expect(first.body.data).toEqual({ items: [] });
            expect(second.status).toBe(404);
        });
    });

    describe('DELETE /cart/items', () => {
        it('vide le panier et répond 204 sans contenu', async () => {
            await addCarrots(2);

            const { status, body } = await request('DELETE', '/cart/items', customerCookie);

            expect(status).toBe(204);
            expect(body).toBeUndefined();
            expect((await request('GET', '/cart', customerCookie)).body.data).toEqual({ items: [] });
        });

        it('répond 204 même si le panier est inexistant ou déjà vide', async () => {
            expect((await request('DELETE', '/cart/items', customerCookie)).status).toBe(204);

            await addCarrots(1);
            await request('DELETE', '/cart/items', customerCookie);
            expect((await request('DELETE', '/cart/items', customerCookie)).status).toBe(204);
        });

        it("ne touche pas au panier d'un autre utilisateur", async () => {
            await addCarrots(1);

            expect((await request('DELETE', '/cart/items', adminCookie)).status).toBe(204);
            expect((await request('GET', '/cart', customerCookie)).body.data.items).toHaveLength(1);
        });
    });
});
