import type { OrderRepository } from '../../domain/order.repository';
import type { Order } from '../../domain/order.entity';
import { ListOrdersUseCase } from './list-orders.use-case';

const CUSTOMER_ID = '3f0c9a52-8a6e-4c1b-9d57-2b1e7f4a6c10';

describe('ListOrdersUseCase', () => {
    let repository: jest.Mocked<OrderRepository>;
    let useCase: ListOrdersUseCase;

    beforeEach(() => {
        repository = {
            save: jest.fn(),
            findByCustomerId: jest.fn(),
            findOrderableProducts: jest.fn(),
            findCustomerContact: jest.fn(),
        };
        useCase = new ListOrdersUseCase(repository);
    });

    it('renvoie les commandes du client connecté', async () => {
        const orders = [{ id: 'order-1' }, { id: 'order-2' }] as Order[];
        repository.findByCustomerId.mockResolvedValue(orders);

        await expect(useCase.execute(CUSTOMER_ID)).resolves.toBe(orders);
        expect(repository.findByCustomerId).toHaveBeenCalledWith(CUSTOMER_ID, undefined);
    });

    it('transmet les statuts demandés au dépôt', async () => {
        repository.findByCustomerId.mockResolvedValue([]);

        await useCase.execute(CUSTOMER_ID, ['IN_PROGRESS', 'READY']);

        expect(repository.findByCustomerId).toHaveBeenCalledWith(CUSTOMER_ID, [
            'IN_PROGRESS',
            'READY',
        ]);
    });

    it('renvoie une liste vide pour un compte sans commande', async () => {
        repository.findByCustomerId.mockResolvedValue([]);

        await expect(useCase.execute(CUSTOMER_ID)).resolves.toEqual([]);
    });
});
