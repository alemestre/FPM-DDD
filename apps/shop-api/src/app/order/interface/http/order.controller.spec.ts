import { DomainValidationErrorFilter } from '../../../shared/interface/http/domain-validation-error.filter';
import { ApiResponseInterceptor } from '../../../shared/interface/http/api-response.interceptor';
import { JwtCookieAuthGuard } from '../../../auth/interface/http/guards/jwt-cookie-auth.guard';
import { OrderConfirmationSender } from '../../application/ports/order-confirmation-sender';
import { ListOrdersUseCase } from '../../application/use-cases/list-orders.use-case';
import { GetOrderUseCase } from '../../application/use-cases/get-order.use-case';
import { PlaceOrderUseCase } from '../../application/use-cases/place-order.use-case';
import { ACCESS_TOKEN_COOKIE } from '../../../auth/interface/http/auth.constants';
import type { OrderableProduct, OrderCustomerContact } from '../../domain/order.repository';
import { OrderNumber } from '../../domain/order-number.value-object';
import { OrderRepository } from '../../domain/order.repository';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import type { OrderStatus } from '../../domain/order-status';
import { Order } from '../../domain/order.entity';
import { OrderController } from './order.controller';
import type { INestApplication } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ZodValidationPipe } from 'nestjs-zod';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';

jest.mock('uuid', () => ({
    v4: jest.fn(() => '12345678-1234-4123-8123-123456789abc'),
    validate: jest.fn(() => true),
}));

const CUSTOMER_ID = '3f0c9a52-8a6e-4c1b-9d57-2b1e7f4a6c10';
const ADMIN_ID = '9b2d7c1e-4f3a-4e8b-a6d5-1c0f2e3d4b5a';
const FLOUR_ID = 'a3bb189e-8bf9-4888-9912-ace4e6543002';
const flour: OrderableProduct = {
    id: FLOUR_ID,
    name: 'Farine de blé',
    price: 2.5,
    vatRate: 5.5,
    isAvailable: true,
};

class InMemoryOrderRepository extends OrderRepository {
    readonly orders: Order[] = [];
    readonly products = new Map<string, OrderableProduct>([[FLOUR_ID, flour]]);
    readonly contacts = new Map<string, OrderCustomerContact>([
        [
            CUSTOMER_ID,
            {
                firstName: 'Marie',
                lastName: 'Durand',
                email: 'marie@example.fr',
                phone: '+33612345678',
            },
        ],
    ]);

    async save(order: Order): Promise<Order> {
        order.assignNumber(
            OrderNumber.of(OrderNumber.periodOf(order.orderedAt), this.orders.length + 1),
        );
        this.orders.push(order);
        return order;
    }

    async findByCustomerId(
        customerId: string,
        statuses?: readonly OrderStatus[],
    ): Promise<Order[]> {
        return this.orders
            .filter((order) => order.customerId === customerId)
            .filter((order) => !statuses || statuses.includes(order.status))
            .reverse();
    }

    async findById(id: string): Promise<Order | null> {
        return this.orders.find((order) => order.id === id) ?? null;
    }

    /** The shop moves orders forward; no use case does it yet, so the test does it here. */
    setStatus(index: number, status: OrderStatus): void {
        const order = this.orders[index];
        this.orders[index] = Order.reconstitute({
            id: order.id,
            number: order.number,
            status,
            customerId: order.customerId,
            contact: order.contact,
            billingAddress: order.billingAddress,
            lines: order.lines,
            orderedAt: order.orderedAt,
            estimatedPickupDate: order.estimatedPickupDate,
        });
    }

    async findOrderableProducts(ids: readonly string[]): Promise<OrderableProduct[]> {
        return ids.flatMap((id) => this.products.get(id) ?? []);
    }

    async findCustomerContact(customerId: string): Promise<OrderCustomerContact | null> {
        return this.contacts.get(customerId) ?? null;
    }
}

describe('OrderController (HTTP)', () => {
    let app: INestApplication;
    let repository: InMemoryOrderRepository;
    let sender: { send: jest.Mock };
    let baseUrl: string;
    let customerCookie: string;
    let adminCookie: string;

    const post = async (path: string, cookie: string | null, body: unknown) => {
        const response = await fetch(`${baseUrl}${path}`, {
            method: 'POST',
            headers: { 'content-type': 'application/json', ...(cookie && { cookie }) },
            body: JSON.stringify(body),
        });
        const text = await response.text();
        return { status: response.status, body: text ? JSON.parse(text) : undefined };
    };

    const get = async (path: string, cookie: string | null) => {
        const response = await fetch(`${baseUrl}${path}`, {
            headers: { ...(cookie && { cookie }) },
        });
        const text = await response.text();
        return { status: response.status, body: text ? JSON.parse(text) : undefined };
    };

    const items = [{ productId: FLOUR_ID, quantity: 2 }];
    const billingAddress = { line1: '2 quai Est', postalCode: '29200', city: 'Brest' };
    const contact = {
        firstName: 'Paul',
        lastName: 'Martin',
        email: 'paul@example.fr',
        phone: '06 98 76 54 32',
    };

    beforeAll(async () => {
        sender = { send: jest.fn().mockResolvedValue(undefined) };
        const moduleRef = await Test.createTestingModule({
            imports: [JwtModule.register({ secret: 'test-secret' })],
            controllers: [OrderController],
            providers: [
                JwtCookieAuthGuard,
                PlaceOrderUseCase,
                ListOrdersUseCase,
                GetOrderUseCase,
                { provide: OrderRepository, useClass: InMemoryOrderRepository },
                { provide: OrderConfirmationSender, useValue: sender },
                { provide: APP_PIPE, useClass: ZodValidationPipe },
                { provide: APP_INTERCEPTOR, useClass: ApiResponseInterceptor },
                { provide: APP_FILTER, useClass: DomainValidationErrorFilter },
            ],
        }).compile();

        app = moduleRef.createNestApplication();
        app.use(cookieParser());
        await app.listen(0);
        baseUrl = await app.getUrl();
        repository = moduleRef.get(OrderRepository);

        const jwt = moduleRef.get(JwtService);
        customerCookie = `${ACCESS_TOKEN_COOKIE}=${await jwt.signAsync({ sub: CUSTOMER_ID })}`;
        adminCookie = `${ACCESS_TOKEN_COOKIE}=${await jwt.signAsync({ sub: ADMIN_ID })}`;
    });

    beforeEach(() => {
        repository.orders.length = 0;
        sender.send.mockClear();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('POST /orders', () => {
        it('enregistre la commande du client connecté avec le contact de son compte', async () => {
            const { status, body } = await post('/orders', customerCookie, {
                items,
                billingAddress,
            });

            expect(status).toBe(201);
            expect(body.success).toBe(true);
            expect(body.data).toMatchObject({
                id: '12345678-1234-4123-8123-123456789abc',
                number: expect.stringMatching(/^\d{4}-\d{2}-1$/),
                status: 'PENDING',
                estimatedPickupDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
                contact: {
                    firstName: 'Marie',
                    lastName: 'Durand',
                    email: 'marie@example.fr',
                    phone: '+33612345678',
                },
                billingAddress: {
                    line1: '2 quai Est',
                    line2: '',
                    postalCode: '29200',
                    city: 'Brest',
                },
                items: [
                    {
                        productId: FLOUR_ID,
                        productName: 'Farine de blé',
                        unitPrice: 2.5,
                        vatRate: 5.5,
                        quantity: 2,
                        total: 5.28,
                    },
                ],
                subtotal: 5,
                tax: 0.28,
                total: 5.28,
            });
            expect(repository.orders[0].customerId).toBe(CUSTOMER_ID);
            expect(sender.send).toHaveBeenCalledTimes(1);
        });

        it('renvoie 401 sans session', async () => {
            expect((await post('/orders', null, { items, billingAddress })).status).toBe(401);
        });

        it('renvoie 404 pour un compte sans profil client', async () => {
            expect((await post('/orders', adminCookie, { items, billingAddress })).status).toBe(
                404,
            );
        });

        it.each([
            ['un panier vide', { items: [], billingAddress }],
            [
                'un prix envoyé par le client',
                { items: [{ productId: FLOUR_ID, quantity: 1, price: 0.01 }], billingAddress },
            ],
            [
                'une quantité nulle',
                { items: [{ productId: FLOUR_ID, quantity: 0 }], billingAddress },
            ],
            [
                'un identifiant de produit invalide',
                { items: [{ productId: 'farine', quantity: 1 }], billingAddress },
            ],
            ['sans adresse de facturation', { items }],
            ['un contact (pris dans le compte)', { items, billingAddress, contact }],
        ])('renvoie 400 pour %s', async (_case, body) => {
            expect((await post('/orders', customerCookie, body)).status).toBe(400);
            expect(repository.orders).toHaveLength(0);
        });

        it('renvoie 400 pour un produit indisponible', async () => {
            repository.products.set(FLOUR_ID, {
                ...flour,
                isAvailable: false,
            });

            const { status } = await post('/orders', customerCookie, { items, billingAddress });

            repository.products.set(FLOUR_ID, {
                ...flour,
                isAvailable: true,
            });
            expect(status).toBe(400);
        });
    });

    describe('POST /orders/guest', () => {
        it("enregistre la commande d'un invité sans session", async () => {
            const { status, body } = await post('/orders/guest', null, {
                items,
                contact,
                billingAddress,
            });

            expect(status).toBe(201);
            expect(body.data.contact).toEqual({
                firstName: 'Paul',
                lastName: 'Martin',
                email: 'paul@example.fr',
                phone: '+33698765432',
            });
            expect(repository.orders[0].customerId).toBeNull();
        });

        it.each([
            ['sans contact', { items, billingAddress }],
            [
                'avec un e-mail invalide',
                { items, billingAddress, contact: { ...contact, email: 'paul' } },
            ],
            [
                'avec un code postal invalide',
                { items, contact, billingAddress: { ...billingAddress, postalCode: '29' } },
            ],
        ])('renvoie 400 %s', async (_case, body) => {
            expect((await post('/orders/guest', null, body)).status).toBe(400);
        });
    });

    describe('GET /orders', () => {
        it('renvoie seulement les commandes du client connecté, les plus récentes en premier', async () => {
            await post('/orders', customerCookie, { items, billingAddress });
            await post('/orders/guest', null, { items, contact, billingAddress });
            await post('/orders', customerCookie, { items, billingAddress });

            const { status, body } = await get('/orders', customerCookie);

            expect(status).toBe(200);
            expect(body.success).toBe(true);
            expect(body.data).toHaveLength(2);
            expect(body.data.map((order: { number: string }) => order.number)).toEqual([
                expect.stringMatching(/-3$/),
                expect.stringMatching(/-1$/),
            ]);
            expect(body.data[0]).toMatchObject({
                status: 'PENDING',
                isModified: false,
                contact: { email: 'marie@example.fr' },
                items: [{ productId: FLOUR_ID, quantity: 2, confirmedQuantity: 2, total: 5.28 }],
                total: 5.28,
            });
        });

        it('renvoie une liste vide pour un compte sans commande', async () => {
            await post('/orders', customerCookie, { items, billingAddress });

            const { status, body } = await get('/orders', adminCookie);

            expect(status).toBe(200);
            expect(body.data).toEqual([]);
        });

        it('renvoie 401 sans session', async () => {
            expect((await get('/orders', null)).status).toBe(401);
        });

        it("ignore un customerId passé dans l'URL", async () => {
            await post('/orders/guest', null, { items, contact, billingAddress });

            const { body } = await get(`/orders?customerId=${ADMIN_ID}`, customerCookie);

            expect(body.data).toEqual([]);
        });
    });

    describe('GET /orders?status=', () => {
        const numbersOf = (orders: { number: string }[]) =>
            orders.map((order) => order.number.split('-').at(-1));

        beforeEach(async () => {
            for (let i = 0; i < 3; i++) {
                await post('/orders', customerCookie, { items, billingAddress });
            }
            repository.setStatus(1, 'READY');
            repository.setStatus(2, 'COMPLETED');
        });

        it('garde les commandes du statut demandé', async () => {
            const { status, body } = await get('/orders?status=READY', customerCookie);

            expect(status).toBe(200);
            expect(numbersOf(body.data)).toEqual(['2']);
            expect(body.data[0].status).toBe('READY');
        });

        it('accepte plusieurs statuts, pour les commandes en cours', async () => {
            const { body } = await get('/orders?status=PENDING&status=READY', customerCookie);

            expect(numbersOf(body.data)).toEqual(['2', '1']);
        });

        it('renvoie toutes les commandes sans filtre', async () => {
            const { body } = await get('/orders', customerCookie);

            expect(numbersOf(body.data)).toEqual(['3', '2', '1']);
        });

        it.each([['FOO'], ['ready'], ['']])('renvoie 400 pour le statut "%s"', async (value) => {
            expect((await get(`/orders?status=${value}`, customerCookie)).status).toBe(400);
        });
    });

    describe('GET /orders/:id', () => {
        const ORDER_ID = '12345678-1234-4123-8123-123456789abc';

        it('renvoie la commande du client connecté avec ses lignes', async () => {
            await post('/orders', customerCookie, { items, billingAddress });

            const { status, body } = await get(`/orders/${ORDER_ID}`, customerCookie);

            expect(status).toBe(200);
            expect(body.success).toBe(true);
            expect(body.data).toMatchObject({
                id: ORDER_ID,
                status: 'PENDING',
                contact: { email: 'marie@example.fr' },
                billingAddress: { city: 'Brest' },
                items: [{ productId: FLOUR_ID, productName: 'Farine de blé', quantity: 2 }],
                total: 5.28,
            });
        });

        it('renvoie 404 pour la commande d’un autre compte', async () => {
            await post('/orders', customerCookie, { items, billingAddress });

            expect((await get(`/orders/${ORDER_ID}`, adminCookie)).status).toBe(404);
        });

        it("renvoie 404 pour une commande d'invité", async () => {
            await post('/orders/guest', null, { items, contact, billingAddress });

            expect((await get(`/orders/${ORDER_ID}`, customerCookie)).status).toBe(404);
        });

        it("renvoie 404 pour une commande qui n'existe pas", async () => {
            expect((await get(`/orders/${ORDER_ID}`, customerCookie)).status).toBe(404);
        });

        it('renvoie 400 pour un id qui n’est pas un UUID', async () => {
            expect((await get('/orders/2026-11-1', customerCookie)).status).toBe(400);
        });

        it('renvoie 401 sans session', async () => {
            expect((await get(`/orders/${ORDER_ID}`, null)).status).toBe(401);
        });
    });
});
