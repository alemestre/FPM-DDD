import type { CartWithProducts } from '../cart-with-products';
import { CartUseCase } from './cart.use-case';
import { NotFoundException } from '@nestjs/common';

export class ChangeCartItemQuantityUseCase extends CartUseCase {
    /**
     * Replaces the quantity of a product of the customer's cart, checked against the current stock.
     *
     * @throws {NotFoundException} If the customer has no cart or the product is not in it.
     * @throws {DomainValidationError} If the product is no longer available, or if the
     * quantity is above the maximum or the stock.
     */
    async execute(customerId: string, productId: string, quantity: number): Promise<CartWithProducts> {
        const cart = await this.carts.findByCustomerId(customerId);
        if (!cart?.has(productId)) {
            throw new NotFoundException(`Le produit ${productId} n'est pas dans le panier`);
        }

        cart.changeQuantity(await this.findCartProduct(productId), quantity);
        await this.carts.save(cart);
        // Never empty here: the cart holds at least the product just added or changed.
        const products = await this.products.findManyWithProducer({ productIds: cart.productIds });
        return { cart, products };
    }
}
