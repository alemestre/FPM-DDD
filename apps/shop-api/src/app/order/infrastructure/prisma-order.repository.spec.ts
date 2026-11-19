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
});
