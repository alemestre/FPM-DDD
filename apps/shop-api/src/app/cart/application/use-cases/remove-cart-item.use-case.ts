import { ProductRepository } from '../../../product/domain/product.repository';
import type { CartWithProducts } from '../cart-with-products';
import { CartRepository } from '../../domain/cart.repository';
import { Inject, NotFoundException } from '@nestjs/common';

export class RemoveCartItemUseCase {
    constructor(
        @Inject(CartRepository) private readonly carts: CartRepository,
        @Inject(ProductRepository) private readonly products: ProductRepository,
    ) {}

    /**
     * Removes a product from the customer's cart, even if it is no longer available.
     *
     * @throws {NotFoundException} If the customer has no cart or the product is not in it.
     */
    async execute(customerId: string, productId: string): Promise<CartWithProducts> {
        const cart = await this.carts.findByCustomerId(customerId);
        if (!cart?.has(productId)) {
            throw new NotFoundException(`Le produit ${productId} n'est pas dans le panier`);
        }

        cart.remove(productId);
        await this.carts.save(cart);
        // An empty `productIds` filter does not filter: it would list the whole catalog.
        const products =
            cart.lines.length === 0
                ? []
                : await this.products.findManyWithProducer({ productIds: cart.productIds });
        return { cart, products };
    }
}
