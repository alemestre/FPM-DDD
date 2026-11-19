import { DomainValidationErrorFilter } from '../../../shared/interface/http/domain-validation-error.filter';
import { ApiResponseInterceptor } from '../../../shared/interface/http/api-response.interceptor';
import { JwtCookieAuthGuard } from '../../../auth/interface/http/guards/jwt-cookie-auth.guard';
import { OrderConfirmationSender } from '../../application/ports/order-confirmation-sender';
import { PlaceOrderUseCase } from '../../application/use-cases/place-order.use-case';
import { ACCESS_TOKEN_COOKIE } from '../../../auth/interface/http/auth.constants';
import type { OrderableProduct, OrderCustomerContact } from '../../domain/order.repository';
import { OrderNumber } from '../../domain/order-number.value-object';
import { OrderRepository } from '../../domain/order.repository';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import type { Order } from '../../domain/order.entity';
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
const flour: OrderableProduct = { id: FLOUR_ID, name: 'Farine de blé', price: 2.5, vatRate: 5.5, isAvailable: true };

class InMemoryOrderRepository extends OrderRepository {
    readonly orders: Order[] = [];
    readonly products = new Map<string, OrderableProduct>([
        [FLOUR_ID, flour],
    ]);
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
                status: 'REGISTERED',
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
                        quantity: 2, total: 5.28,
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
});
