import type { Cart } from './cart.entity';

/**
 * Persistence port for the Cart aggregate.
 *
 * It does not extend GenericEntityRepository: a cart is only read and saved through its
 * customer, never listed, and it is saved whole, lines included.
 */
export abstract class CartRepository {
    /** @returns The cart of the customer with its lines, oldest first, or `null` if they have none. */
    abstract findByCustomerId(customerId: string): Promise<Cart | null>;

    /** Creates or replaces the cart and its lines in one transaction. */
    abstract save(cart: Cart): Promise<void>;

    /** @returns Whether the user has a customer profile (an admin has none). */
    abstract customerExists(customerId: string): Promise<boolean>;
}
