import { DomainValidationError } from '../../shared/domain/errors/domain-validation.error';
import { BillingAddress } from './billing-address.value-object';
import { OrderContact } from './order-contact.value-object';
import { OrderNumber } from './order-number.value-object';
import { OrderLine } from './order-line.value-object';
import { Order } from './order.entity';
import type { OrderStatus } from './order-status';
import { OrderStatusTransitionError } from './order-status-transition.error';

jest.mock('uuid', () => ({
    v4: jest.fn(() => '12345678-1234-4123-8123-123456789abc'),
    validate: jest.fn(() => true),
}));

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

            expect(order.id).toBe('12345678-1234-4123-8123-123456789abc');
            expect(order.status).toBe('PENDING');
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

    describe('isPlacedBy', () => {
        const CUSTOMER_ID = '3f0c9a52-8a6e-4c1b-9d57-2b1e7f4a6c10';
        const OTHER_ID = '9b2d7c1e-4f3a-4e8b-a6d5-1c0f2e3d4b5a';

        it('reconnaît le client qui a passé la commande', () => {
            expect(place({ customerId: CUSTOMER_ID }).isPlacedBy(CUSTOMER_ID)).toBe(true);
        });

        it('refuse un autre client', () => {
            expect(place({ customerId: CUSTOMER_ID }).isPlacedBy(OTHER_ID)).toBe(false);
        });

        it("n'attribue une commande d'invité à aucun client", () => {
            expect(place({ customerId: null }).isPlacedBy(CUSTOMER_ID)).toBe(false);
        });
    });

    describe('cycle de vie', () => {
        /** An order brought to `status` through the regular transitions. */
        const inStatus = (status: OrderStatus): Order => {
            const order = place();
            const steps: Record<OrderStatus, (o: Order) => void> = {
                PENDING: () => undefined,
                PREPARING: (o) => o.confirm(),
                READY: (o) => {
                    o.confirm();
                    o.markReady();
                },
                COMPLETED: (o) => {
                    o.confirm();
                    o.markReady();
                    o.markPickedUp();
                },
                CANCELLED: (o) => o.cancel(),
            };
            steps[status](order);
            return order;
        };

        it('suit PENDING → PREPARING → READY → COMPLETED', () => {
            const order = place();
            expect(order.status).toBe('PENDING');

            order.confirm();
            expect(order.status).toBe('PREPARING');

            order.markReady();
            expect(order.status).toBe('READY');

            order.markPickedUp();
            expect(order.status).toBe('COMPLETED');
        });

        it.each<[string, (order: Order) => void, OrderStatus[]]>([
            [
                'valider',
                (order) => order.confirm(),
                ['PREPARING', 'READY', 'COMPLETED', 'CANCELLED'],
            ],
            [
                'marquer prête',
                (order) => order.markReady(),
                ['PENDING', 'READY', 'COMPLETED', 'CANCELLED'],
            ],
            [
                'marquer retirée',
                (order) => order.markPickedUp(),
                ['PENDING', 'PREPARING', 'COMPLETED', 'CANCELLED'],
            ],
        ])('refuse de %s une commande hors de son statut de départ', (_action, act, statuses) => {
            for (const status of statuses) {
                const order = inStatus(status);

                expect(() => act(order)).toThrow(OrderStatusTransitionError);
                expect(order.status).toBe(status);
            }
        });

        it.each<OrderStatus>(['PENDING', 'PREPARING', 'READY'])(
            'annule une commande %s, y compris quand le client ne vient pas la chercher',
            (status) => {
                const order = inStatus(status);

                order.cancel();

                expect(order.status).toBe('CANCELLED');
            },
        );

        it.each<OrderStatus>(['COMPLETED', 'CANCELLED'])(
            'refuse d’annuler une commande %s',
            (status) => {
                const order = inStatus(status);

                expect(() => order.cancel()).toThrow(OrderStatusTransitionError);
                expect(order.status).toBe(status);
            },
        );

        it('donne le statut de la commande dans l’erreur', () => {
            const order = inStatus('READY');

            expect(() => order.confirm()).toThrow(
                expect.objectContaining({ orderId: order.id, status: 'READY' }),
            );
        });
    });

    describe('adjustLineQuantity', () => {
        it('valide une commande telle quelle : rien n’est modifié', () => {
            const order = place();

            order.confirm();

            expect(order.isModified).toBe(false);
            expect(order.total).toBe(12.7);
        });

        it('change la quantité d’une ligne avant de valider et recalcule les totaux', () => {
            const order = place();

            order.adjustLineQuantity(FLOUR_ID, 1);
            order.confirm();

            expect(order.lines[0]).toMatchObject({ quantity: 3, confirmedQuantity: 1 });
            expect(order.isModified).toBe(true);
            expect(order.subtotal).toBe(6.49);
            expect(order.tax).toBe(0.94);
            expect(order.total).toBe(7.43);
        });

        it('retire un produit en gardant sa ligne', () => {
            const order = place();

            order.adjustLineQuantity(PASTA_ID, 0);

            expect(order.lines).toHaveLength(2);
            expect(order.lines[1].isRemoved).toBe(true);
            expect(order.total).toBe(7.91);
        });

        it('ajuste encore pendant la préparation', () => {
            const order = place();
            order.confirm();

            order.adjustLineQuantity(FLOUR_ID, 2);

            expect(order.lines[0].confirmedQuantity).toBe(2);
            expect(order.status).toBe('PREPARING');
        });

        it.each<OrderStatus>(['READY', 'COMPLETED', 'CANCELLED'])(
            'refuse d’ajuster une commande %s',
            (status) => {
                const order = place();
                if (status === 'CANCELLED') {
                    order.cancel();
                } else {
                    order.confirm();
                    order.markReady();
                    if (status === 'COMPLETED') order.markPickedUp();
                }

                expect(() => order.adjustLineQuantity(FLOUR_ID, 1)).toThrow(
                    OrderStatusTransitionError,
                );
                expect(order.lines[0].confirmedQuantity).toBe(3);
            },
        );

        it('refuse un produit qui n’est pas dans la commande', () => {
            const order = place();

            expect(() =>
                order.adjustLineQuantity('c3bb189e-8bf9-4888-9912-ace4e6543002', 1),
            ).toThrow(DomainValidationError);
        });

        it('refuse une quantité supérieure à la quantité commandée', () => {
            const order = place();

            expect(() => order.adjustLineQuantity(FLOUR_ID, 4)).toThrow(DomainValidationError);
            expect(order.lines[0].confirmedQuantity).toBe(3);
        });

        it('refuse de retirer le dernier produit : il faut annuler la commande', () => {
            const order = place();
            order.adjustLineQuantity(PASTA_ID, 0);

            expect(() => order.adjustLineQuantity(FLOUR_ID, 0)).toThrow(DomainValidationError);
            expect(order.lines[0].confirmedQuantity).toBe(3);
        });

        it('remet un produit retiré', () => {
            const order = place();
            order.adjustLineQuantity(PASTA_ID, 0);

            order.adjustLineQuantity(PASTA_ID, 1);

            expect(order.isModified).toBe(false);
        });
    });
});
