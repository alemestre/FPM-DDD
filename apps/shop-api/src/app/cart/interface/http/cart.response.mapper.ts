import { toProductWithProducerResponse } from '../../../product/interface/http/dto/product.response.mapper';
import type { CartWithProducts } from '../../application/cart-with-products';
import type { CartResponseDto } from '@fpm/contracts';

/** Lines in cart order, each with its product. A line whose product was not found is left out. */
export function toCartResponse({ cart, products }: CartWithProducts): CartResponseDto {
    const productById = new Map(products.map((entry) => [entry.product.id, entry]));

    return {
        items: cart.lines.flatMap((line) => {
            const product = productById.get(line.productId);
            return product
                ? [{ product: toProductWithProducerResponse(product), quantity: line.quantity }]
                : [];
        }),
    };
}
