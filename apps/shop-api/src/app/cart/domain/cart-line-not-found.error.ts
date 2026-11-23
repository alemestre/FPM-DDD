/**
 * Raised when a cart is asked to change or remove a product it does not hold.
 * Not a DomainValidationError: the application layer answers with a 404.
 */
export class CartLineNotFoundError extends Error {
    constructor(readonly productId: string) {
        super(`Le produit ${productId} n'est pas dans le panier`);
        this.name = 'CartLineNotFoundError';
    }
}
