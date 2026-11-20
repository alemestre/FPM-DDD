import { OrderRepository } from '../../domain/order.repository';
import type { OrderStatus } from '../../domain/order-status';
import type { Order } from '../../domain/order.entity';
import { Inject } from '@nestjs/common';

export class ListOrdersUseCase {
    constructor(@Inject(OrderRepository) private readonly repository: OrderRepository) {}

    /**
     * Lists the orders of a signed-in customer, newest first.
     * A user without a customer profile simply has no orders.
     *
     * @param customerId
     * @param statuses Keeps only the orders in one of these statuses; all statuses when omitted.
     */
    execute(customerId: string, statuses?: readonly OrderStatus[]): Promise<Order[]> {
        return this.repository.findByCustomerId(customerId, statuses);
    }
}
