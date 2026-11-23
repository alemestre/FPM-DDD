import type { PrismaService } from '../../../prisma/prisma.service';
import { PrismaCartRepository } from './prisma-cart.repository';
import { CartLine } from '../domain/cart-line.value-object';
import { Cart } from '../domain/cart.entity';

jest.mock('../../../prisma/prisma.service', () => ({ PrismaService: class {} }));
jest.mock('uuid', () => ({
    v4: jest.fn(() => '12345678-1234-4123-8123-123456789abc'),
    validate: jest.fn(() => true),
}));

const CUSTOMER_ID = '3f0c9a52-8a6e-4c1b-9d57-2b1e7f4a6c10';
const CART_ID = 'c3bb189e-8bf9-4888-9912-ace4e6543002';
const CARROTS_ID = 'e3bb189e-8bf9-4888-9912-ace4e6543002';
const APPLES_ID = 'f3bb189e-8bf9-4888-9912-ace4e6543002';

const createPrismaMock = () => {
    const tx = {
        cart: { upsert: jest.fn().mockResolvedValue({}) },
        cartItem: {
            deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
            upsert: jest.fn().mockResolvedValue({}),
        },
    };
    return {
        tx,
        $transaction: jest.fn(async (run: (client: typeof tx) => Promise<unknown>) => run(tx)),
        cart: { findUnique: jest.fn() },
        customer: { count: jest.fn() },
    };
};

describe('PrismaCartRepository', () => {
    let prisma: ReturnType<typeof createPrismaMock>;
    let repository: PrismaCartRepository;

    beforeEach(() => {
        prisma = createPrismaMock();
        repository = new PrismaCartRepository(prisma as unknown as PrismaService);
    });

    describe('findByCustomerId', () => {
        it('reconstruit le panier avec ses lignes, les plus anciennes en premier', async () => {
            prisma.cart.findUnique.mockResolvedValue({
                id: CART_ID,
                customerId: CUSTOMER_ID,
                cartItems: [
                    { productId: CARROTS_ID, quantity: 2 },
                    { productId: APPLES_ID, quantity: 5 },
                ],
            });

            const cart = await repository.findByCustomerId(CUSTOMER_ID);

            expect(prisma.cart.findUnique).toHaveBeenCalledWith({
                where: { customerId: CUSTOMER_ID },
                select: {
                    id: true,
                    customerId: true,
                    cartItems: {
                        select: { productId: true, quantity: true },
                        orderBy: { createdAt: 'asc' },
                    },
                },
            });
            expect(cart?.id).toBe(CART_ID);
            expect(cart?.customerId).toBe(CUSTOMER_ID);
            expect(cart?.lines.map((line) => [line.productId, line.quantity])).toEqual([
                [CARROTS_ID, 2],
                [APPLES_ID, 5],
            ]);
        });

        it("renvoie null si le client n'a pas de panier", async () => {
            prisma.cart.findUnique.mockResolvedValue(null);

            await expect(repository.findByCustomerId(CUSTOMER_ID)).resolves.toBeNull();
        });
    });

    describe('save', () => {
        it('crée le panier si besoin, supprime les lignes retirées et met à jour les autres', async () => {
            const cart = Cart.restore({
                id: CART_ID,
                customerId: CUSTOMER_ID,
                lines: [CartLine.create(CARROTS_ID, 2), CartLine.create(APPLES_ID, 3)],
            });

            await repository.save(cart);

            const { tx } = prisma;
            expect(prisma.$transaction).toHaveBeenCalledTimes(1);
            expect(tx.cart.upsert).toHaveBeenCalledWith({
                where: { customerId: CUSTOMER_ID },
                create: { id: CART_ID, customerId: CUSTOMER_ID },
                update: {},
            });
            expect(tx.cartItem.deleteMany).toHaveBeenCalledWith({
                where: { cartId: CART_ID, productId: { notIn: [CARROTS_ID, APPLES_ID] } },
            });
            expect(tx.cartItem.upsert).toHaveBeenCalledTimes(2);
            expect(tx.cartItem.upsert).toHaveBeenCalledWith({
                where: { cartId_productId: { cartId: CART_ID, productId: APPLES_ID } },
                create: { cartId: CART_ID, productId: APPLES_ID, quantity: 3 },
                update: { quantity: 3 },
            });
        });

        it('supprime toutes les lignes quand le panier est vide', async () => {
            await repository.save(Cart.restore({ id: CART_ID, customerId: CUSTOMER_ID, lines: [] }));

            expect(prisma.tx.cartItem.deleteMany).toHaveBeenCalledWith({
                where: { cartId: CART_ID, productId: { notIn: [] } },
            });
            expect(prisma.tx.cartItem.upsert).not.toHaveBeenCalled();
        });
    });

    describe('customerExists', () => {
        it.each([
            [1, true],
            [0, false],
        ])('compte %p profil client → %p', async (count, expected) => {
            prisma.customer.count.mockResolvedValue(count);

            await expect(repository.customerExists(CUSTOMER_ID)).resolves.toBe(expected);
            expect(prisma.customer.count).toHaveBeenCalledWith({ where: { id: CUSTOMER_ID } });
        });
    });
});
