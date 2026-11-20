import { BillingAddress } from '../domain/billing-address.value-object';
import { OrderContact } from '../domain/order-contact.value-object';
import { OrderLine } from '../domain/order-line.value-object';
import type { PrismaService } from '../../../prisma/prisma.service';
import { PrismaOrderRepository } from './prisma-order.repository';
import { Order } from '../domain/order.entity';

jest.mock('../../../prisma/prisma.service', () => ({ PrismaService: class {} }));
jest.mock('uuid', () => ({
    v4: jest.fn(() => '12345678-1234-4123-8123-123456789abc'),
    validate: jest.fn(() => true),
}));

const CUSTOMER_ID = '3f0c9a52-8a6e-4c1b-9d57-2b1e7f4a6c10';
const FLOUR_ID = 'a3bb189e-8bf9-4888-9912-ace4e6543002';

const decimal = (value: number) => ({ toNumber: () => value });

const createPrismaMock = () => {
    const tx = {
        $queryRaw: jest.fn().mockResolvedValue([{ lastValue: 7 }]),
        order: { create: jest.fn().mockResolvedValue({}) },
    };
    return {
        tx,
        $transaction: jest.fn(async (run: (client: typeof tx) => Promise<unknown>) => run(tx)),
        product: { findMany: jest.fn() },
        order: { findMany: jest.fn(), findUnique: jest.fn() },
        customer: { findUnique: jest.fn() },
    };
};

const placeOrder = (orderedAt = new Date('2026-11-19T10:00:00Z')) =>
    Order.place({
        customerId: CUSTOMER_ID,
        contact: OrderContact.create({
            firstName: 'Marie',
            lastName: 'Durand',
            email: 'marie@example.fr',
            phone: '0612345678',
        }),
        billingAddress: BillingAddress.create({
            line1: '1 rue des Lilas',
            line2: 'Bât. B',
            postalCode: '29000',
            city: 'Quimper',
        }),
        lines: [
            OrderLine.create({
                productId: FLOUR_ID,
                productName: 'Farine',
                unitPrice: 2.5,
                vatRate: 5.5,
                quantity: 3,
            }),
        ],
        orderedAt,
    });

describe('PrismaOrderRepository', () => {
    let prisma: ReturnType<typeof createPrismaMock>;
    let repository: PrismaOrderRepository;

    beforeEach(() => {
        prisma = createPrismaMock();
        repository = new PrismaOrderRepository(prisma as unknown as PrismaService);
    });

    describe('save', () => {
        it('prend le numéro suivant du mois et crée la commande avec ses lignes dans une transaction', async () => {
            const order = placeOrder();

            const saved = await repository.save(order);

            expect(prisma.$transaction).toHaveBeenCalledTimes(1);
            const [sql, period] = prisma.tx.$queryRaw.mock.calls[0];
            expect(sql.join('?')).toContain('ON CONFLICT ("period") DO UPDATE');
            expect(period).toBe('2026-11');
            expect(prisma.tx.order.create).toHaveBeenCalledWith({
                data: {
                    id: order.id,
                    number: '2026-11-7',
                    status: 'REGISTERED',
                    estimatedPickupDate: new Date('2026-11-21T00:00:00Z'),
                    createdAt: order.orderedAt,
                    customerId: CUSTOMER_ID,
                    firstName: 'Marie',
                    lastName: 'Durand',
                    email: 'marie@example.fr',
                    phone: '+33612345678',
                    billingAddressLine1: '1 rue des Lilas',
                    billingAddressLine2: 'Bât. B',
                    billingPostalCode: '29000',
                    billingCity: 'Quimper',
                    orderItems: {
                        create: [
                            {
                                productId: FLOUR_ID,
                                productName: 'Farine',
                                price: 2.5,
                                vatRate: 5.5,
                                quantity: 3,
                            },
                        ],
                    },
                },
            });
            expect(saved.number?.toString()).toBe('2026-11-7');
        });

        it('numérote selon le mois de Paris', async () => {
            await repository.save(placeOrder(new Date('2026-11-30T23:30:00Z')));

            expect(prisma.tx.$queryRaw.mock.calls[0][1]).toBe('2026-12');
        });

        it("ne donne pas de numéro si l'insertion échoue", async () => {
            const failure = new Error('insert failed');
            prisma.tx.order.create.mockRejectedValue(failure);
            const order = placeOrder();

            await expect(repository.save(order)).rejects.toBe(failure);
            expect(order.number).toBeNull();
        });
    });

    it('lit les produits commandables avec un select explicite', async () => {
        prisma.product.findMany.mockResolvedValue([
            {
                id: FLOUR_ID,
                name: 'Farine',
                price: decimal(2.5),
                vatRate: decimal(5.5),
                isAvailable: true,
            },
        ]);

        await expect(repository.findOrderableProducts([FLOUR_ID])).resolves.toEqual([
            { id: FLOUR_ID, name: 'Farine', price: 2.5, vatRate: 5.5, isAvailable: true },
        ]);
        expect(prisma.product.findMany).toHaveBeenCalledWith({
            where: { id: { in: [FLOUR_ID] } },
            select: { id: true, name: true, price: true, vatRate: true, isAvailable: true },
        });
    });

    describe('findCustomerContact', () => {
        it("réunit le nom et l'e-mail du compte avec le téléphone du profil", async () => {
            prisma.customer.findUnique.mockResolvedValue({
                phone: '+33612345678',
                user: { firstName: 'Marie', lastName: 'Durand', email: 'marie@example.fr' },
            });

            await expect(repository.findCustomerContact(CUSTOMER_ID)).resolves.toEqual({
                firstName: 'Marie',
                lastName: 'Durand',
                email: 'marie@example.fr',
                phone: '+33612345678',
            });
        });

        it('renvoie null sans profil client', async () => {
            prisma.customer.findUnique.mockResolvedValue(null);

            await expect(repository.findCustomerContact(CUSTOMER_ID)).resolves.toBeNull();
        });
    });

    describe('findByCustomerId', () => {
        const row = {
            id: '12345678-1234-4123-8123-123456789abc',
            number: '2026-11-7',
            status: 'READY',
            estimatedPickupDate: new Date('2026-11-21T00:00:00Z'),
            createdAt: new Date('2026-11-19T10:00:00Z'),
            customerId: CUSTOMER_ID,
            firstName: 'Marie',
            lastName: 'Durand',
            email: 'marie@example.fr',
            phone: '+33612345678',
            billingAddressLine1: '1 rue des Lilas',
            billingAddressLine2: 'Bât. B',
            billingPostalCode: '29000',
            billingCity: 'Quimper',
            orderItems: [
                {
                    productId: FLOUR_ID,
                    productName: 'Farine',
                    price: decimal(2.5),
                    vatRate: decimal(5.5),
                    quantity: 3,
                },
            ],
        };

        it('lit les commandes du client, les plus récentes en premier, avec leurs lignes', async () => {
            prisma.order.findMany.mockResolvedValue([]);

            await repository.findByCustomerId(CUSTOMER_ID);

            const [query] = prisma.order.findMany.mock.calls[0];
            expect(query.where).toEqual({ customerId: CUSTOMER_ID });
            expect(query.orderBy).toEqual({ createdAt: 'desc' });
            expect(query.select).toMatchObject({
                number: true,
                billingCity: true,
                orderItems: {
                    select: {
                        productId: true,
                        productName: true,
                        price: true,
                        vatRate: true,
                        quantity: true,
                    },
                },
            });
            expect(query.select).not.toHaveProperty('customer');
        });

        it('garde seulement les statuts demandés', async () => {
            prisma.order.findMany.mockResolvedValue([]);

            await repository.findByCustomerId(CUSTOMER_ID, ['REGISTERED', 'READY']);

            expect(prisma.order.findMany.mock.calls[0][0].where).toEqual({
                customerId: CUSTOMER_ID,
                status: { in: ['REGISTERED', 'READY'] },
            });
        });

        it('reconstitue la commande depuis sa ligne', async () => {
            prisma.order.findMany.mockResolvedValue([row]);

            const [order] = await repository.findByCustomerId(CUSTOMER_ID);

            expect(order).toBeInstanceOf(Order);
            expect(order.id).toBe(row.id);
            expect(order.number?.toString()).toBe('2026-11-7');
            expect(order.status).toBe('READY');
            expect(order.customerId).toBe(CUSTOMER_ID);
            expect(order.orderedAt).toEqual(row.createdAt);
            expect(order.estimatedPickupDate).toEqual(row.estimatedPickupDate);
            expect(order.contact.fullName).toBe('Marie Durand');
            expect(order.contact.email).toBe('marie@example.fr');
            expect(order.billingAddress).toMatchObject({
                line1: '1 rue des Lilas',
                line2: 'Bât. B',
                postalCode: '29000',
                city: 'Quimper',
            });
            expect(order.lines).toHaveLength(1);
            expect(order.lines[0]).toMatchObject({
                productId: FLOUR_ID,
                productName: 'Farine',
                unitPrice: 2.5,
                vatRate: 5.5,
                quantity: 3,
            });
            expect(order.subtotal).toBe(7.5);
            expect(order.tax).toBe(0.41);
            expect(order.total).toBe(7.91);
        });

        it('renvoie une liste vide si le client n’a pas de commande', async () => {
            prisma.order.findMany.mockResolvedValue([]);

            await expect(repository.findByCustomerId(CUSTOMER_ID)).resolves.toEqual([]);
        });
    });

    describe('findById', () => {
        it('lit la commande avec ses lignes par son id', async () => {
            prisma.order.findUnique.mockResolvedValue({
                id: '12345678-1234-4123-8123-123456789abc',
                number: '2026-11-7',
                status: 'REGISTERED',
                estimatedPickupDate: new Date('2026-11-21T00:00:00Z'),
                createdAt: new Date('2026-11-19T10:00:00Z'),
                customerId: CUSTOMER_ID,
                firstName: 'Marie',
                lastName: 'Durand',
                email: 'marie@example.fr',
                phone: '+33612345678',
                billingAddressLine1: '1 rue des Lilas',
                billingAddressLine2: '',
                billingPostalCode: '29000',
                billingCity: 'Quimper',
                orderItems: [
                    {
                        productId: FLOUR_ID,
                        productName: 'Farine',
                        price: decimal(2.5),
                        vatRate: decimal(5.5),
                        quantity: 3,
                    },
                ],
            });

            const order = await repository.findById('12345678-1234-4123-8123-123456789abc');

            const [query] = prisma.order.findUnique.mock.calls[0];
            expect(query.where).toEqual({ id: '12345678-1234-4123-8123-123456789abc' });
            expect(query.select).toHaveProperty('orderItems');
            expect(order).toBeInstanceOf(Order);
            expect(order?.number?.toString()).toBe('2026-11-7');
            expect(order?.customerId).toBe(CUSTOMER_ID);
            expect(order?.total).toBe(7.91);
        });

        it("renvoie null si la commande n'existe pas", async () => {
            prisma.order.findUnique.mockResolvedValue(null);

            await expect(repository.findById(FLOUR_ID)).resolves.toBeNull();
        });
    });
});
