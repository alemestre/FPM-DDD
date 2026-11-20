import { OrderRepository } from '../../domain/order.repository';
import type { Order } from '../../domain/order.entity';
import { Inject, NotFoundException } from '@nestjs/common';

export class GetOrderUseCase {
    constructor(@Inject(OrderRepository) private readonly repository: OrderRepository) {}

    /**
     * Reads one order of the signed-in customer, with its lines.
     *
     * @throws {NotFoundException} If the order does not exist or was placed by someone else:
     * the same answer in both cases, so the route does not reveal which ids exist.
     */
    async execute(orderId: string, customerId: string): Promise<Order> {
        const order = await this.repository.findById(orderId);
        if (!order?.isPlacedBy(customerId)) {
            throw new NotFoundException(`Commande ${orderId} introuvable`);
        }
        return order;
    }
}
