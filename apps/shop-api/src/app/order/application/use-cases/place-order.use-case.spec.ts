import { DomainValidationError } from '../../../shared/domain/errors/domain-validation.error';
import type { OrderConfirmationSender } from '../ports/order-confirmation-sender';
import type { OrderableProduct, OrderRepository } from '../../domain/order.repository';
import { OrderNumber } from '../../domain/order-number.value-object';
import type { Order } from '../../domain/order.entity';
import { PlaceOrderUseCase } from './place-order.use-case';
import { NotFoundException } from '@nestjs/common';

jest.mock('uuid', () => ({
    v4: jest.fn(() => '12345678-1234-4123-8123-123456789abc'),
    validate: jest.fn(() => true),
}));

const CUSTOMER_ID = '3f0c9a52-8a6e-4c1b-9d57-2b1e7f4a6c10';
const FLOUR_ID = 'a3bb189e-8bf9-4888-9912-ace4e6543002';
const PASTA_ID = 'b3bb189e-8bf9-4888-9912-ace4e6543002';

const flour: OrderableProduct = {
    id: FLOUR_ID,
    name: 'Farine de blé',
    price: 2.5,
    vatRate: 5.5,
    isAvailable: true,
};
const pasta: OrderableProduct = {
    id: PASTA_ID,
    name: 'Pâtes',
    price: 3.99,
    vatRate: 5.5,
    isAvailable: true,
};

const billingAddress = { line1: '2 quai Est', postalCode: '29200', city: 'Brest' };
const guestContact = {
    firstName: 'Paul',
    lastName: 'Martin',
    email: 'paul@example.fr',
    phone: '0698765432',
};
const orderedAt = new Date('2026-11-19T10:00:00Z');

describe('PlaceOrderUseCase', () => {
    let repository: jest.Mocked<OrderRepository>;
    let sender: jest.Mocked<OrderConfirmationSender>;
    let useCase: PlaceOrderUseCase;

    beforeEach(() => {
        repository = {
            save: jest.fn(async (order: Order) => {
                order.assignNumber(OrderNumber.of('2026-11', 1));
                return order;
            }),
            findOrderableProducts: jest.fn().mockResolvedValue([flour, pasta]),
            findCustomerContact: jest.fn().mockResolvedValue({
                firstName: 'Marie',
                lastName: 'Durand',
                email: 'marie@example.fr',
                phone: '+33612345678',
            }),
        };
        sender = { send: jest.fn().mockResolvedValue(undefined) };
        useCase = new PlaceOrderUseCase(repository, sender);
    });

    describe('client connecté', () => {
        const input = {
            customerId: CUSTOMER_ID,
            items: [
                { productId: FLOUR_ID, quantity: 2 },
                { productId: PASTA_ID, quantity: 1 },
            ],
            billingAddress,
        };

        it("enregistre la commande avec le contact du compte et l'adresse saisie", async () => {
            const order = await useCase.execute(input, orderedAt);

            expect(repository.findCustomerContact).toHaveBeenCalledWith(CUSTOMER_ID);
            expect(order.customerId).toBe(CUSTOMER_ID);
            expect(order.contact.email).toBe('marie@example.fr');
            expect(order.billingAddress.city).toBe('Brest');
            expect(order.status).toBe('REGISTERED');
            expect(order.number?.toString()).toBe('2026-11-1');
            expect(repository.save).toHaveBeenCalledWith(order);
        });

        it('prend le nom, le prix et la TVA dans le catalogue', async () => {
            const order = await useCase.execute(input, orderedAt);

            expect(repository.findOrderableProducts).toHaveBeenCalledWith([FLOUR_ID, PASTA_ID]);
            expect(
                order.lines.map((line) => [
                    line.productName,
                    line.unitPrice,
                    line.vatRate,
                    line.quantity,
                ]),
            ).toEqual([
                ['Farine de blé', 2.5, 5.5, 2],
                ['Pâtes', 3.99, 5.5, 1],
            ]);
            expect(order.subtotal).toBe(8.99);
        });

        it("renvoie 404 si le compte n'a pas de profil client", async () => {
            repository.findCustomerContact.mockResolvedValue(null);

            await expect(useCase.execute(input, orderedAt)).rejects.toBeInstanceOf(
                NotFoundException,
            );
            expect(repository.save).not.toHaveBeenCalled();
        });
    });

    describe('invité', () => {
        const input = {
            contact: guestContact,
            items: [{ productId: FLOUR_ID, quantity: 1 }],
            billingAddress,
        };

        it('enregistre une commande sans client avec le contact saisi', async () => {
            const order = await useCase.execute(input, orderedAt);

            expect(repository.findCustomerContact).not.toHaveBeenCalled();
            expect(order.customerId).toBeNull();
            expect(order.contact.fullName).toBe('Paul Martin');
            expect(order.contact.phone).toBe('+33698765432');
        });

        it('refuse un contact invalide', async () => {
            await expect(
                useCase.execute(
                    { ...input, contact: { ...guestContact, email: 'paul' } },
                    orderedAt,
                ),
            ).rejects.toBeInstanceOf(DomainValidationError);
            expect(repository.save).not.toHaveBeenCalled();
        });
    });

    it('calcule la date de retrait indicative depuis la date de commande', async () => {
        // Jeudi 19/11 + 2 jours = samedi 21/11, jour d'ouverture.
        const order = await useCase.execute(
            {
                contact: guestContact,
                items: [{ productId: FLOUR_ID, quantity: 1 }],
                billingAddress,
            },
            orderedAt,
        );

        expect(order.estimatedPickupDate.toISOString().slice(0, 10)).toBe('2026-11-21');
    });

    it("envoie l'e-mail de confirmation de la commande enregistrée", async () => {
        const order = await useCase.execute(
            {
                contact: guestContact,
                items: [{ productId: FLOUR_ID, quantity: 1 }],
                billingAddress,
            },
            orderedAt,
        );

        expect(sender.send).toHaveBeenCalledWith(order);
        expect(sender.send.mock.invocationCallOrder[0]).toBeGreaterThan(
            repository.save.mock.invocationCallOrder[0],
        );
    });

    it.each([
        ['inconnu', []],
        ['indisponible', [{ ...flour, isAvailable: false }]],
    ])('refuse un produit %s', async (_case, products) => {
        repository.findOrderableProducts.mockResolvedValue(products);

        await expect(
            useCase.execute(
                {
                    contact: guestContact,
                    items: [{ productId: FLOUR_ID, quantity: 1 }],
                    billingAddress,
                },
                orderedAt,
            ),
        ).rejects.toBeInstanceOf(DomainValidationError);
        expect(repository.save).not.toHaveBeenCalled();
        expect(sender.send).not.toHaveBeenCalled();
    });

    it('refuse une adresse de facturation invalide', async () => {
        await expect(
            useCase.execute(
                {
                    contact: guestContact,
                    items: [{ productId: FLOUR_ID, quantity: 1 }],
                    billingAddress: { ...billingAddress, postalCode: '12' },
                },
                orderedAt,
            ),
        ).rejects.toBeInstanceOf(DomainValidationError);
    });
});
