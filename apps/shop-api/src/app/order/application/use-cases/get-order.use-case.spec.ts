import type { OrderRepository } from '../../domain/order.repository';
import { BillingAddress } from '../../domain/billing-address.value-object';
import { OrderContact } from '../../domain/order-contact.value-object';
import { OrderLine } from '../../domain/order-line.value-object';
import { GetOrderUseCase } from './get-order.use-case';
import { Order } from '../../domain/order.entity';
import { NotFoundException } from '@nestjs/common';

jest.mock('uuid', () => ({
    v4: jest.fn(() => '12345678-1234-4123-8123-123456789abc'),
    validate: jest.fn(() => true),
}));

const ORDER_ID = '12345678-1234-4123-8123-123456789abc';
const CUSTOMER_ID = '3f0c9a52-8a6e-4c1b-9d57-2b1e7f4a6c10';
const OTHER_ID = '9b2d7c1e-4f3a-4e8b-a6d5-1c0f2e3d4b5a';

const placeOrder = (customerId: string | null) =>
    Order.place({
        customerId,
        contact: OrderContact.create({
            firstName: 'Marie',
            lastName: 'Durand',
            email: 'marie@example.fr',
            phone: '0612345678',
        }),
        billingAddress: BillingAddress.create({
            line1: '1 rue des Lilas',
            postalCode: '29000',
            city: 'Quimper',
        }),
        lines: [
            OrderLine.create({
                productId: 'a3bb189e-8bf9-4888-9912-ace4e6543002',
                productName: 'Farine',
                unitPrice: 2.5,
                vatRate: 5.5,
                quantity: 1,
            }),
        ],
        orderedAt: new Date('2026-11-19T10:00:00Z'),
    });

describe('GetOrderUseCase', () => {
    let repository: jest.Mocked<OrderRepository>;
    let useCase: GetOrderUseCase;

    beforeEach(() => {
        repository = {
            save: jest.fn(),
            findByCustomerId: jest.fn(),
            findById: jest.fn(),
            findOrderableProducts: jest.fn(),
            findCustomerContact: jest.fn(),
        };
        useCase = new GetOrderUseCase(repository);
    });

    it('renvoie la commande du client connecté', async () => {
        const order = placeOrder(CUSTOMER_ID);
        repository.findById.mockResolvedValue(order);

        await expect(useCase.execute(ORDER_ID, CUSTOMER_ID)).resolves.toBe(order);
        expect(repository.findById).toHaveBeenCalledWith(ORDER_ID);
    });

    it.each([
        ["n'existe pas", null],
        ['appartient à un autre client', placeOrder(OTHER_ID)],
        ['a été passée par un invité', placeOrder(null)],
    ])('lève NotFoundException si la commande %s', async (_case, found) => {
        repository.findById.mockResolvedValue(found);

        await expect(useCase.execute(ORDER_ID, CUSTOMER_ID)).rejects.toBeInstanceOf(
            NotFoundException,
        );
    });
});
