import type { CartWithProducts } from '../cart-with-products';
import { CartUseCase } from './cart.use-case';
import { Cart } from '../../domain/cart.entity';
import { NotFoundException } from '@nestjs/common';

export class AddCartItemUseCase extends CartUseCase {
    /**
     * Adds units of a product to the customer's cart, creating the cart on the first product.
     *
     * @throws {NotFoundException} If the signed-in user has no customer profile.
     * @throws {DomainValidationError} If the product is unknown or unavailable, or if the
     * resulting quantity is above the maximum or the stock.
     */
    async execute(customerId: string, productId: string, quantity: number): Promise<CartWithProducts> {
        const [cart, product] = await Promise.all([
            this.cartOf(customerId),
            this.findCartProduct(productId),
        ]);

        cart.add(product, quantity);
        await this.carts.save(cart);
        // Never empty here: the cart holds at least the product just added or changed.
        const products = await this.products.findManyWithProducer({ productIds: cart.productIds });
        return { cart, products };
    }

    private async cartOf(customerId: string): Promise<Cart> {
        const cart = await this.carts.findByCustomerId(customerId);
        if (cart) {
            return cart;
        }
        if (!(await this.carts.customerExists(customerId))) {
            throw new NotFoundException();
        }
        return Cart.createFor(customerId);
    }
}
