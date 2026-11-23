import { ProductRepository } from '../../../product/domain/product.repository';
import type { CartWithProducts } from '../cart-with-products';
import { CartRepository } from '../../domain/cart.repository';
import { Cart } from '../../domain/cart.entity';
import { Inject } from '@nestjs/common';

export class GetCartUseCase {
    constructor(
        @Inject(CartRepository) private readonly carts: CartRepository,
        @Inject(ProductRepository) private readonly products: ProductRepository,
    ) {}

    /** Cart of the signed-in customer; an empty one, not saved, if they have none yet. */
    async execute(customerId: string): Promise<CartWithProducts> {
        const cart = (await this.carts.findByCustomerId(customerId)) ?? Cart.createFor(customerId);
        // An empty `productIds` filter does not filter: it would list the whole catalog.
        const products =
            cart.lines.length === 0
                ? []
                : await this.products.findManyWithProducer({ productIds: cart.productIds });
        return { cart, products };
    }
}
