import type { OrderableProduct, OrderCustomerContact } from '../domain/order.repository';
import { OrderNumber } from '../domain/order-number.value-object';
import { OrderRepository } from '../domain/order.repository';
import { PrismaService } from '../../../prisma/prisma.service';
import type { Order } from '../domain/order.entity';
import { Injectable } from '@nestjs/common';

/**
 * Prisma adapter of the Order aggregate. It only reads the product and customer
 * tables (explicit `select`), never writes them.
 */
@Injectable()
export class PrismaOrderRepository extends OrderRepository {
    constructor(private readonly prisma: PrismaService) {
        super();
    }

    /**
     * Takes the next number of the month and inserts the order with its lines in one
     * transaction. The upsert locks the month's row, so concurrent orders get distinct
     * numbers, and a rolled back insert gives its number back.
     */
    async save(order: Order): Promise<Order> {
        const period = OrderNumber.periodOf(order.orderedAt);

        await this.prisma.$transaction(async (tx) => {
            const [{ lastValue }] = await tx.$queryRaw<{ lastValue: number }[]>`
        INSERT INTO "OrderNumberSequence" ("period", "lastValue")
        VALUES (${period}, 1)
        ON CONFLICT ("period") DO UPDATE SET "lastValue" = "OrderNumberSequence"."lastValue" + 1
        RETURNING "lastValue"`;
            const number = OrderNumber.of(period, lastValue);

            const { contact, billingAddress } = order;
            await tx.order.create({
                data: {
                    id: order.id,
                    number: number.toString(),
                    status: order.status,
                    estimatedPickupDate: order.estimatedPickupDate,
                    createdAt: order.orderedAt,
                    customerId: order.customerId,
                    firstName: contact.firstName,
                    lastName: contact.lastName,
                    email: contact.email,
                    phone: contact.phone,
                    billingAddressLine1: billingAddress.line1,
                    billingAddressLine2: billingAddress.line2,
                    billingPostalCode: billingAddress.postalCode,
                    billingCity: billingAddress.city,
                    orderItems: {
                        create: order.lines.map((line) => ({
                            productId: line.productId,
                            productName: line.productName,
                            price: line.unitPrice,
                            vatRate: line.vatRate,
                            quantity: line.quantity,
                        })),
                    },
                },
            });

            order.assignNumber(number);
        });

        return order;
    }

    async findOrderableProducts(ids: readonly string[]): Promise<OrderableProduct[]> {
        const rows = await this.prisma.product.findMany({
            where: { id: { in: [...ids] } },
            select: { id: true, name: true, price: true, vatRate: true, isAvailable: true },
        });

        return rows.map((row) => ({
            id: row.id,
            name: row.name,
            price: row.price.toNumber(),
            vatRate: row.vatRate.toNumber(),
            isAvailable: row.isAvailable,
        }));
    }

    async findCustomerContact(customerId: string): Promise<OrderCustomerContact | null> {
        const row = await this.prisma.customer.findUnique({
            where: { id: customerId },
            select: {
                phone: true,
                user: { select: { firstName: true, lastName: true, email: true } },
            },
        });

        return row ? { ...row.user, phone: row.phone } : null;
    }
}
