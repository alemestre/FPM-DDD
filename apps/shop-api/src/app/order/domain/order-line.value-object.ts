import { DomainValidationError } from '../../shared/domain/errors/domain-validation.error';
import { PositiveAmount } from '../../shared/domain/value-objects/positive-amount.value-object';
import { Percentage } from '../../shared/domain/value-objects/percentage.value-object';
import { Quantity } from '../../shared/domain/value-objects/quantity.value-object';
import { roundToCents } from './money';

export interface OrderLineProps {
    readonly productId: string;
    readonly productName: string;
    /** Unit price excluding VAT, read from the catalog when ordering. */
    readonly unitPrice: number;
    /** VAT rate in percent, e.g. 5.5. */
    readonly vatRate: number;
    /** Quantity ordered by the customer. */
    readonly quantity: number;
    /**
     * Quantity kept by the shop, from 0 (product removed) to `quantity`.
     * Equal to `quantity` when omitted, i.e. as ordered.
     */
    readonly confirmedQuantity?: number;
}

/**
 * One product of an order, with the name, price and VAT rate it had when ordered,
 * so later catalog changes do not alter the order.
 * The shop may lower the quantity, down to 0 to remove the product: the line stays,
 * so the customer still sees what they ordered, and the totals use the confirmed quantity.
 */
export class OrderLine {
    private constructor(
        readonly productId: string,
        readonly productName: string,
        private readonly _unitPrice: PositiveAmount,
        private readonly _vatRate: Percentage,
        private readonly _quantity: Quantity,
        private readonly _confirmedQuantity: Quantity,
    ) {}

    static create({
        productId,
        productName,
        unitPrice,
        vatRate,
        quantity,
        confirmedQuantity = quantity,
    }: OrderLineProps): OrderLine {
        const name = productName?.trim() ?? '';
        if (!name) {
            throw new DomainValidationError('Le nom du produit commandé est obligatoire');
        }
        if (!Number.isInteger(quantity) || quantity < 1) {
            throw new DomainValidationError(
                `La quantité commandée de "${name}" doit être d'au moins 1`,
            );
        }

        OrderLine.assertConfirmedQuantity(name, quantity, confirmedQuantity);

        return new OrderLine(
            productId,
            name,
            PositiveAmount.create(unitPrice),
            Percentage.create(vatRate),
            Quantity.create(quantity),
            Quantity.create(confirmedQuantity),
        );
    }

    private static assertConfirmedQuantity(
        name: string,
        quantity: number,
        confirmedQuantity: number,
    ): void {
        if (!Number.isInteger(confirmedQuantity) || confirmedQuantity < 0) {
            throw new DomainValidationError(
                `La quantité confirmée de "${name}" doit être un entier positif ou nul`,
            );
        }
        if (confirmedQuantity > quantity) {
            throw new DomainValidationError(
                `La quantité confirmée de "${name}" ne peut pas dépasser la quantité commandée (${quantity})`,
            );
        }
    }

    /**
     * @returns The same line with the quantity kept by the shop; 0 removes the product.
     * @throws {DomainValidationError} If the quantity is negative, not whole, or above the ordered one.
     */
    withConfirmedQuantity(confirmedQuantity: number): OrderLine {
        OrderLine.assertConfirmedQuantity(this.productName, this.quantity, confirmedQuantity);

        return new OrderLine(
            this.productId,
            this.productName,
            this._unitPrice,
            this._vatRate,
            this._quantity,
            Quantity.create(confirmedQuantity),
        );
    }

    get unitPrice(): number {
        return this._unitPrice.value;
    }

    get vatRate(): number {
        return this._vatRate.value;
    }

    /** Quantity ordered by the customer. */
    get quantity(): number {
        return this._quantity.value;
    }

    /** Quantity kept by the shop, used for the totals. */
    get confirmedQuantity(): number {
        return this._confirmedQuantity.value;
    }

    /** The shop changed the quantity ordered, or removed the product. */
    get isModified(): boolean {
        return this.confirmedQuantity !== this.quantity;
    }

    /** The shop removed the product from the order. */
    get isRemoved(): boolean {
        return this.confirmedQuantity === 0;
    }

    /** Line total excluding VAT, on the confirmed quantity, rounded to the cent. */
    get subtotal(): number {
        return roundToCents(this.unitPrice * this.confirmedQuantity);
    }

    /** VAT of the line, rounded to the cent (see `money.ts`). */
    get tax(): number {
        return roundToCents((this.subtotal * this.vatRate) / 100);
    }

    /** Line total including VAT: subtotal + VAT, so the lines add up to the order total. */
    get total(): number {
        return roundToCents(this.subtotal + this.tax);
    }
}
