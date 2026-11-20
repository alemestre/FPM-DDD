import type { OrderStatus } from './order-status';
import type { Order } from './order.entity';

/** What an order needs to know about a catalog product when it is placed. */
export interface OrderableProduct {
    readonly id: string;
    readonly name: string;
    /** Unit price excluding VAT. */
    readonly price: number;
    /** VAT rate in percent. */
    readonly vatRate: number;
    readonly isAvailable: boolean;
}

/** Contact details of a signed-in customer, copied onto the order. */
export interface OrderCustomerContact {
    readonly firstName: string;
    readonly lastName: string;
    readonly email: string;
    readonly phone: string;
}

/**
 * Persistence port for the Order aggregate.
 *
 * It does not extend GenericEntityRepository: orders are only placed and listed
 * per customer for now, never updated or deleted. It also reads, without changing them, the
 * products and the customer an order is placed with, as order-specific types
 * (not the Product or Customer entities of their own contexts).
 */
export abstract class OrderRepository {
    /**
     * Persists a new order and gives it the next number of its month (`YYYY-MM-N`),
     * in the same transaction, so a failed save does not use up a number.
     */
    abstract save(order: Order): Promise<Order>;

    /**
     * @param statuses Keeps only the orders in one of these statuses; all statuses when omitted.
     * @returns The orders of a customer, newest first; empty if they have none.
     */
    abstract findByCustomerId(
        customerId: string,
        statuses?: readonly OrderStatus[],
    ): Promise<Order[]>;

    /** @returns The products that exist among `ids`; unknown ids are left out. */
    abstract findOrderableProducts(ids: readonly string[]): Promise<OrderableProduct[]>;

    /** @returns The contact details, or `null` if the user has no customer profile. */
    abstract findCustomerContact(customerId: string): Promise<OrderCustomerContact | null>;
}
