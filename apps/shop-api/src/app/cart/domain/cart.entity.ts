import { DomainValidationError } from '../../shared/domain/errors/domain-validation.error';
import { Uuid } from '../../shared/domain/value-objects/uuid.value-object';
import { CartLineNotFoundError } from './cart-line-not-found.error';
import { CartLine } from './cart-line.value-object';

/** Most distinct products a cart may hold, as in the storefront. */
export const MAX_CART_LINES = 50;

/** What a cart needs to know about a catalog product to hold it. */
export interface CartProduct {
    readonly id: string;
    readonly name: string;
    /** Units in stock right now. */
    readonly stock: number;
}

export interface CartProps {
    readonly id: string;
    readonly customerId: string;
    readonly lines: readonly CartLine[];
}

/**
 * Cart aggregate of a signed-in customer: one per customer, one line per product.
 * A line never asks for more units than the product has in stock when it is added or changed.
 */
export class Cart {
    private constructor(
        readonly id: string,
        readonly customerId: string,
        private _lines: readonly CartLine[],
    ) {}

    /** Empty cart of a customer who did not have one yet. */
    static createFor(customerId: string): Cart {
        return new Cart(new Uuid().getValue(), customerId, []);
    }

    /** Rebuilds a cart read from the database. */
    static restore({ id, customerId, lines }: CartProps): Cart {
        return new Cart(id, customerId, [...lines]);
    }

    get lines(): readonly CartLine[] {
        return this._lines;
    }

    get productIds(): string[] {
        return this._lines.map((line) => line.productId);
    }

    has(productId: string): boolean {
        return this._lines.some((line) => line.productId === productId);
    }

    /**
     * Adds units of a product, on top of those already in the cart.
     *
     * @throws {DomainValidationError} If the resulting quantity is above the per-product maximum
     * or the stock, or if the cart already holds {@link MAX_CART_LINES} products.
     */
    add(product: CartProduct, quantity: number): void {
        const existing = this.lineOf(product.id);
        if (!existing && this._lines.length >= MAX_CART_LINES) {
            throw new DomainValidationError(
                `Le panier ne peut pas contenir plus de ${MAX_CART_LINES} produits`,
            );
        }

        const line = existing
            ? existing.withQuantity(existing.quantity + quantity)
            : CartLine.create(product.id, quantity);
        Cart.assertInStock(product, line.quantity);

        this._lines = existing
            ? this._lines.map((current) => (current === existing ? line : current))
            : [...this._lines, line];
    }

    /**
     * Replaces the quantity of a product already in the cart.
     *
     * @throws {CartLineNotFoundError} If the product is not in the cart.
     * @throws {DomainValidationError} If the quantity is above the per-product maximum or the stock.
     */
    changeQuantity(product: CartProduct, quantity: number): void {
        const existing = this.lineOf(product.id);
        if (!existing) {
            throw new CartLineNotFoundError(product.id);
        }

        const line = existing.withQuantity(quantity);
        Cart.assertInStock(product, line.quantity);

        this._lines = this._lines.map((current) => (current === existing ? line : current));
    }

    /** @throws {CartLineNotFoundError} If the product is not in the cart. */
    remove(productId: string): void {
        if (!this.has(productId)) {
            throw new CartLineNotFoundError(productId);
        }

        this._lines = this._lines.filter((line) => line.productId !== productId);
    }

    /** Removes every product; an empty cart stays empty. */
    clear(): void {
        this._lines = [];
    }

    private lineOf(productId: string): CartLine | undefined {
        return this._lines.find((line) => line.productId === productId);
    }

    private static assertInStock(product: CartProduct, quantity: number): void {
        if (quantity > product.stock) {
            throw new DomainValidationError(
                `Stock insuffisant pour "${product.name}" : ${Math.max(product.stock, 0)} disponible(s)`,
            );
        }
    }
}
