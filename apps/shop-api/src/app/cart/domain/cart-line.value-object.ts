import { DomainValidationError } from '../../shared/domain/errors/domain-validation.error';
import { Quantity } from '../../shared/domain/value-objects/quantity.value-object';

/** Most units of one product a cart may hold. */
export const MAX_QUANTITY_PER_PRODUCT = 10;

/** One product of a cart and how many units of it the customer wants. */
export class CartLine {
    private constructor(
        readonly productId: string,
        private readonly _quantity: Quantity,
    ) {}

    /**
     * @throws {DomainValidationError} If the quantity is not a whole number from 1 to
     * {@link MAX_QUANTITY_PER_PRODUCT}.
     */
    static create(productId: string, quantity: number): CartLine {
        if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY_PER_PRODUCT) {
            throw new DomainValidationError(
                `La quantité d'un produit du panier doit être comprise entre 1 et ${MAX_QUANTITY_PER_PRODUCT}`,
            );
        }

        return new CartLine(productId, Quantity.create(quantity));
    }

    get quantity(): number {
        return this._quantity.value;
    }

    /** @returns The same product with another quantity, checked like {@link create}. */
    withQuantity(quantity: number): CartLine {
        return CartLine.create(this.productId, quantity);
    }
}
