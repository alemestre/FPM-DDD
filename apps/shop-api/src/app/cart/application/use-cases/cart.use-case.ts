import { DomainValidationError } from '../../../shared/domain/errors/domain-validation.error';
import { ProductRepository } from '../../../product/domain/product.repository';
import { CartRepository } from '../../domain/cart.repository';
import type { CartProduct } from '../../domain/cart.entity';
import { Inject } from '@nestjs/common';

/**
 * Base of the use cases that put a catalog product in the cart. Subclasses keep this
 * constructor, so Nest injects both repositories through it.
 */
export abstract class CartUseCase {
    constructor(
        @Inject(CartRepository) protected readonly carts: CartRepository,
        @Inject(ProductRepository) protected readonly products: ProductRepository,
    ) {}

    /**
     * Reads the catalog product a customer puts in their cart.
     *
     * @throws {DomainValidationError} If the product does not exist or is no longer available.
     */
    protected async findCartProduct(productId: string): Promise<CartProduct> {
        const product = await this.products.findById(productId);
        if (!product) {
            throw new DomainValidationError(`Le produit ${productId} n'existe pas`);
        }
        if (!product.isAvailable) {
            throw new DomainValidationError(`Le produit "${product.name}" n'est plus disponible`);
        }
        return { id: product.id, name: product.name, stock: product.stock };
    }
}
