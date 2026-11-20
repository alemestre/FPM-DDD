import { DomainValidationError } from '../../shared/domain/errors/domain-validation.error';
import { Uuid } from '../../shared/domain/value-objects/uuid.value-object';
import type { BillingAddress } from './billing-address.value-object';
import type { OrderContact } from './order-contact.value-object';
import type { OrderNumber } from './order-number.value-object';
import type { OrderLine } from './order-line.value-object';
import type { OrderStatus } from './order-status';
import { estimatePickupDate } from './pickup-date';
import { roundToCents, sumCents } from './money';

export interface PlaceOrderProps {
    /** Null for a guest order. */
    readonly customerId: string | null;
    readonly contact: OrderContact;
    readonly billingAddress: BillingAddress;
    readonly lines: readonly OrderLine[];
    readonly orderedAt: Date;
}

export interface OrderProps extends PlaceOrderProps {
    readonly id: string;
    /** Null until the order is saved: the repository gives the next number of the month. */
    readonly number: OrderNumber | null;
    readonly status: OrderStatus;
    readonly estimatedPickupDate: Date;
}

/**
 * Order aggregate: what a customer or a guest ordered, for pickup at the shop.
 * Payment happens at the shop for now.
 */
export class Order {
    private constructor(
        readonly id: string,
        private _number: OrderNumber | null,
        private readonly _status: OrderStatus,
        readonly customerId: string | null,
        readonly contact: OrderContact,
        readonly billingAddress: BillingAddress,
        private readonly _lines: readonly OrderLine[],
        readonly orderedAt: Date,
        readonly estimatedPickupDate: Date,
    ) {}

    /**
     * Registers a new order and computes its indicative pickup date.
     *
     * @throws {DomainValidationError} Without lines, or when a product appears twice.
     */
    static place({
        customerId,
        contact,
        billingAddress,
        lines,
        orderedAt,
    }: PlaceOrderProps): Order {
        Order.assertLines(lines);

        return new Order(
            new Uuid().getValue(),
            null,
            'REGISTERED',
            customerId,
            contact,
            billingAddress,
            [...lines],
            orderedAt,
            estimatePickupDate(orderedAt),
        );
    }

    static reconstitute(props: OrderProps): Order {
        return new Order(
            props.id,
            props.number,
            props.status,
            props.customerId,
            props.contact,
            props.billingAddress,
            [...props.lines],
            props.orderedAt,
            props.estimatedPickupDate,
        );
    }

    private static assertLines(lines: readonly OrderLine[]): void {
        if (lines.length === 0) {
            throw new DomainValidationError('Une commande doit contenir au moins un produit');
        }

        const productIds = new Set(lines.map((line) => line.productId));
        if (productIds.size !== lines.length) {
            throw new DomainValidationError(
                "Un même produit ne peut apparaître qu'une fois dans la commande",
            );
        }
    }

    /**
     * Gives the order its number. Called once, by the repository, when the order is saved.
     *
     * @throws {DomainValidationError} If the order already has a number.
     */
    assignNumber(number: OrderNumber): void {
        if (this._number) {
            throw new DomainValidationError(
                `La commande ${this._number.toString()} a déjà un numéro`,
            );
        }
        this._number = number;
    }

    get number(): OrderNumber | null {
        return this._number;
    }

    get status(): OrderStatus {
        return this._status;
    }

    get isGuestOrder(): boolean {
        return this.customerId === null;
    }

    get lines(): readonly OrderLine[] {
        return this._lines;
    }

    /** Total excluding VAT: sum of the line subtotals. */
    get subtotal(): number {
        return sumCents(this._lines.map((line) => line.subtotal));
    }

    /** VAT: sum of the line VATs, each rounded to the cent. */
    get tax(): number {
        return sumCents(this._lines.map((line) => line.tax));
    }

    /** Total including VAT. */
    get total(): number {
        return roundToCents(this.subtotal + this.tax);
    }
}
