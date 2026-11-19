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
    readonly quantity: number;
}

/**
 * One product of an order, with the name, price and VAT rate it had when ordered,
 * so later catalog changes do not alter the order.
 */
export class OrderLine {
    private constructor(
        readonly productId: string,
        readonly productName: string,
        private readonly _unitPrice: PositiveAmount,
        private readonly _vatRate: Percentage,
        private readonly _quantity: Quantity,
    ) {}

    static create({
        productId,
        productName,
        unitPrice,
        vatRate,
        quantity,
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

        return new OrderLine(
            productId,
            name,
            PositiveAmount.create(unitPrice),
            Percentage.create(vatRate),
            Quantity.create(quantity),
        );
    }

    get unitPrice(): number {
        return this._unitPrice.value;
    }

    get vatRate(): number {
        return this._vatRate.value;
    }

    get quantity(): number {
        return this._quantity.value;
    }

    /** Line total excluding VAT, rounded to the cent. */
    get subtotal(): number {
        return roundToCents(this.unitPrice * this.quantity);
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
