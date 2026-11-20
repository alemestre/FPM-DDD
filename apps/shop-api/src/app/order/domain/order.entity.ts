import { DomainValidationError } from '../../shared/domain/errors/domain-validation.error';
import { Uuid } from '../../shared/domain/value-objects/uuid.value-object';
import type { BillingAddress } from './billing-address.value-object';
import type { OrderContact } from './order-contact.value-object';
import type { OrderNumber } from './order-number.value-object';
import type { OrderLine } from './order-line.value-object';
import type { OrderStatus } from './order-status';
import { OrderStatusTransitionError } from './order-status-transition.error';
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

/** Statuses in which the shop may still change the quantities, before the order is ready. */
const ADJUSTABLE_STATUSES: readonly OrderStatus[] = ['PENDING', 'PREPARING'];

/** Statuses an order no longer leaves. */
const FINAL_STATUSES: readonly OrderStatus[] = ['COMPLETED', 'CANCELLED'];

/**
 * Order aggregate: what a customer or a guest ordered, for pickup at the shop.
 * Payment happens at the shop for now.
 *
 * Life cycle: PENDING → PREPARING → READY → COMPLETED, and CANCELLED from any
 * status that is not final. The shop may change the quantities while PENDING or PREPARING.
 */
export class Order {
    private constructor(
        readonly id: string,
        private _number: OrderNumber | null,
        private _status: OrderStatus,
        readonly customerId: string | null,
        readonly contact: OrderContact,
        readonly billingAddress: BillingAddress,
        private _lines: readonly OrderLine[],
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
            'PENDING',
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

    /**
     * Sets the quantity the shop keeps for one product; 0 removes it, the line stays.
     *
     * @throws {OrderStatusTransitionError} Once the order is ready, picked up or cancelled.
     * @throws {DomainValidationError} For a product not in the order, a quantity above the
     * ordered one, or when it would remove the last product: cancel the order instead.
     */
    adjustLineQuantity(productId: string, confirmedQuantity: number): void {
        this.assertStatusIn(ADJUSTABLE_STATUSES, 'modifier les quantités');

        const line = this._lines.find((candidate) => candidate.productId === productId);
        if (!line) {
            throw new DomainValidationError(
                `Le produit ${productId} ne fait pas partie de la commande`,
            );
        }

        const lines = this._lines.map((candidate) =>
            candidate === line ? line.withConfirmedQuantity(confirmedQuantity) : candidate,
        );
        if (lines.every((candidate) => candidate.isRemoved)) {
            throw new DomainValidationError(
                'Impossible de retirer tous les produits : annulez plutôt la commande',
            );
        }
        this._lines = lines;
    }

    /**
     * The shop validates the order, as ordered or with adjusted quantities, and starts preparing it.
     *
     * @throws {OrderStatusTransitionError} Unless the order is PENDING.
     */
    confirm(): void {
        this.transition(['PENDING'], 'PREPARING', 'valider la commande');
    }

    /** @throws {OrderStatusTransitionError} Unless the order is PREPARING. */
    markReady(): void {
        this.transition(['PREPARING'], 'READY', 'marquer la commande prête');
    }

    /** @throws {OrderStatusTransitionError} Unless the order is READY. */
    markPickedUp(): void {
        this.transition(['READY'], 'COMPLETED', 'marquer la commande retirée');
    }

    /**
     * Cancels the order at any time before it is picked up, including when the customer never comes.
     *
     * @throws {OrderStatusTransitionError} If the order is already picked up or cancelled.
     */
    cancel(): void {
        if (FINAL_STATUSES.includes(this._status)) {
            throw new OrderStatusTransitionError(this.id, this._status, 'annuler la commande');
        }
        this._status = 'CANCELLED';
    }

    private transition(from: readonly OrderStatus[], to: OrderStatus, action: string): void {
        this.assertStatusIn(from, action);
        this._status = to;
    }

    private assertStatusIn(allowed: readonly OrderStatus[], action: string): void {
        if (!allowed.includes(this._status)) {
            throw new OrderStatusTransitionError(this.id, this._status, action);
        }
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

    /** Only the customer who placed an order may see it; a guest order belongs to no customer. */
    isPlacedBy(customerId: string): boolean {
        return this.customerId !== null && this.customerId === customerId;
    }

    /** The shop changed at least one quantity or removed a product. */
    get isModified(): boolean {
        return this._lines.some((line) => line.isModified);
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
