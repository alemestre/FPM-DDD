import { DomainValidationError } from '../../shared/domain/errors/domain-validation.error';
import { BillingAddress } from './billing-address.value-object';
import { OrderContact } from './order-contact.value-object';
import { OrderNumber } from './order-number.value-object';
import { OrderLine } from './order-line.value-object';
import { Order } from './order.entity';

jest.mock('uuid', () => ({ v4: jest.fn(() => '12345678-1234-4123-8123-123456789abc'), validate: jest.fn(() => true) }));

const FLOUR_ID = 'a3bb189e-8bf9-4888-9912-ace4e6543002';
const PASTA_ID = 'b3bb189e-8bf9-4888-9912-ace4e6543002';

const contact = OrderContact.create({
    firstName: 'Marie',
    lastName: 'Durand',
    email: 'marie@example.fr',
    phone: '0612345678',
});
const billingAddress = BillingAddress.create({
    line1: '1 rue des Lilas',
    postalCode: '29000',
    city: 'Quimper',
});
const flour = OrderLine.create({
    productId: FLOUR_ID,
    productName: 'Farine',
    unitPrice: 2.5,
    vatRate: 5.5,
    quantity: 3,
});
const pasta = OrderLine.create({
    productId: PASTA_ID,
    productName: 'Pâtes',
    unitPrice: 3.99,
    vatRate: 20,
    quantity: 1,
});

/** Monday 16/11/2026, noon in Paris. */
const orderedAt = new Date('2026-11-16T11:00:00Z');

const place = (overrides: Partial<Parameters<typeof Order.place>[0]> = {}) =>
    Order.place({
        customerId: null,
        contact,
        billingAddress,
        lines: [flour, pasta],
        orderedAt,
        ...overrides,
    });

describe('Order', () => {
    describe('place', () => {
        it('enregistre la commande sans numéro, avec sa date de retrait indicative', () => {
            const order = place();

            expect(order.id).toBe("12345678-1234-4123-8123-123456789abc");
            expect(order.status).toBe('REGISTERED');
            expect(order.number).toBeNull();
            expect(order.estimatedPickupDate.toISOString().slice(0, 10)).toBe('2026-11-19');
            expect(order.lines).toEqual([flour, pasta]);
        });

        it("distingue la commande d'un invité de celle d'un client", () => {
            expect(place().isGuestOrder).toBe(true);
            expect(place({ customerId: '3f0c9a52-8a6e-4c1b-9d57-2b1e7f4a6c10' }).isGuestOrder).toBe(
                false,
            );
        });

        it('refuse une commande sans produit', () => {
            expect(() => place({ lines: [] })).toThrow(DomainValidationError);
        });

        it('refuse un même produit sur deux lignes', () => {
            expect(() => place({ lines: [flour, flour] })).toThrow(DomainValidationError);
        });
    });

    it('calcule les totaux arrondis au centime', () => {
        const order = place();

        // HT : 7,50 + 3,99 = 11,49 ; TVA : 0,4125 + 0,798 = 1,2105 → 1,21
        expect(order.subtotal).toBe(11.49);
        expect(order.tax).toBe(1.21);
        expect(order.total).toBe(12.7);
    });

    describe('assignNumber', () => {
        it('donne son numéro à la commande', () => {
            const order = place();

            order.assignNumber(OrderNumber.of('2026-11', 3));

            expect(order.number?.toString()).toBe('2026-11-3');
        });

        it('refuse de changer un numéro déjà donné', () => {
            const order = place();
            order.assignNumber(OrderNumber.of('2026-11', 3));

            expect(() => order.assignNumber(OrderNumber.of('2026-11', 4))).toThrow(
                DomainValidationError,
            );
        });
    });
});
