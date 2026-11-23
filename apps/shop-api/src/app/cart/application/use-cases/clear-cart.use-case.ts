import { CartRepository } from '../../domain/cart.repository';
import { Inject } from '@nestjs/common';

export class ClearCartUseCase {
    constructor(@Inject(CartRepository) private readonly carts: CartRepository) {}

    /**
     * Removes every product from the customer's cart. The cart itself is kept.
     * Idempotent: a cart that is already empty, or missing, is left as it is.
     */
    async execute(customerId: string): Promise<void> {
        const cart = await this.carts.findByCustomerId(customerId);
        if (!cart || cart.lines.length === 0) {
            return;
        }

        cart.clear();
        await this.carts.save(cart);
    }
}
