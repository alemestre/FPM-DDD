import type { OrderableProduct, OrderCustomerContact } from '../domain/order.repository';
import { BillingAddress } from '../domain/billing-address.value-object';
import { OrderContact } from '../domain/order-contact.value-object';
import { OrderNumber } from '../domain/order-number.value-object';
import { OrderLine } from '../domain/order-line.value-object';
import type { OrderStatus } from '../domain/order-status';
import type { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { OrderRepository } from '../domain/order.repository';
import { Order } from '../domain/order.entity';
import { Injectable } from '@nestjs/common';

/** Columns needed to rebuild the Order aggregate, with its lines. */
const ORDER_SELECT = {
    id: true,
    number: true,
    status: true,
    estimatedPickupDate: true,
    createdAt: true,
    customerId: true,
    firstName: true,
    lastName: true,
    email: true,
    phone: true,
    billingAddressLine1: true,
    billingAddressLine2: true,
    billingPostalCode: true,
    billingCity: true,
    orderItems: {
        select: { productId: true, productName: true, price: true, vatRate: true, quantity: true },
    },
} satisfies Prisma.OrderSelect;

type OrderRow = Prisma.OrderGetPayload<{ select: typeof ORDER_SELECT }>;

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

    async findByCustomerId(
        customerId: string,
        statuses?: readonly OrderStatus[],
    ): Promise<Order[]> {
        const rows = await this.prisma.order.findMany({
            where: { customerId, ...(statuses && { status: { in: [...statuses] } }) },
            orderBy: { createdAt: 'desc' },
            select: ORDER_SELECT,
        });

        return rows.map((row) => this.toDomain(row));
    }

    async findById(id: string): Promise<Order | null> {
        const row = await this.prisma.order.findUnique({ where: { id }, select: ORDER_SELECT });

        return row ? this.toDomain(row) : null;
    }

    /** Rebuilds the Order aggregate from its row: contact and address are the snapshot taken when ordering. */
    private toDomain(row: OrderRow): Order {
        return Order.reconstitute({
            id: row.id,
            number: OrderNumber.parse(row.number),
            status: row.status,
            customerId: row.customerId,
            contact: OrderContact.create({
                firstName: row.firstName,
                lastName: row.lastName,
                email: row.email,
                phone: row.phone,
            }),
            billingAddress: BillingAddress.create({
                line1: row.billingAddressLine1,
                line2: row.billingAddressLine2,
                postalCode: row.billingPostalCode,
                city: row.billingCity,
            }),
            lines: row.orderItems.map((item) =>
                OrderLine.create({
                    productId: item.productId,
                    productName: item.productName,
                    unitPrice: item.price.toNumber(),
                    vatRate: item.vatRate.toNumber(),
                    quantity: item.quantity,
                }),
            ),
            orderedAt: row.createdAt,
            estimatedPickupDate: row.estimatedPickupDate,
        });
    }
}
