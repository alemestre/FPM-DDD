import { PrismaService } from '../../../prisma/prisma.service';
import { CartLine } from '../domain/cart-line.value-object';
import { CartRepository } from '../domain/cart.repository';
import { Cart } from '../domain/cart.entity';
import { Injectable } from '@nestjs/common';

/** Prisma adapter of the Cart aggregate. It only reads the customer table, never writes it. */
@Injectable()
export class PrismaCartRepository extends CartRepository {
    constructor(private readonly prisma: PrismaService) {
        super();
    }

    async findByCustomerId(customerId: string): Promise<Cart | null> {
        const row = await this.prisma.cart.findUnique({
            where: { customerId },
            select: {
                id: true,
                customerId: true,
                cartItems: {
                    select: { productId: true, quantity: true },
                    orderBy: { createdAt: 'asc' },
                },
            },
        });
        if (!row) {
            return null;
        }

        return Cart.restore({
            id: row.id,
            customerId: row.customerId,
            lines: row.cartItems.map((item) => CartLine.create(item.productId, item.quantity)),
        });
    }

    /**
     * Upserts the cart, deletes the lines it no longer holds and upserts the others,
     * so a line kept in the cart keeps its `createdAt` and its place in the list.
     */
    async save(cart: Cart): Promise<void> {
        const productIds = cart.lines.map((line) => line.productId);

        await this.prisma.$transaction(async (tx) => {
            await tx.cart.upsert({
                where: { customerId: cart.customerId },
                create: { id: cart.id, customerId: cart.customerId },
                update: {},
            });
            await tx.cartItem.deleteMany({
                where: { cartId: cart.id, productId: { notIn: productIds } },
            });
            for (const line of cart.lines) {
                await tx.cartItem.upsert({
                    where: { cartId_productId: { cartId: cart.id, productId: line.productId } },
                    create: { cartId: cart.id, productId: line.productId, quantity: line.quantity },
                    update: { quantity: line.quantity },
                });
            }
        });
    }

    async customerExists(customerId: string): Promise<boolean> {
        return (await this.prisma.customer.count({ where: { id: customerId } })) > 0;
    }
}
