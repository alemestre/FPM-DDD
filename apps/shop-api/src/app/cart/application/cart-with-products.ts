import type { ProductWithProducer } from '../../product/domain/product.repository';
import type { Cart } from '../domain/cart.entity';

/** A cart with the catalog products of its lines, as the storefront displays it. */
export interface CartWithProducts {
    readonly cart: Cart;
    readonly products: readonly ProductWithProducer[];
}
