import type { Order } from '../../domain/order.entity';

/** Sends the "order registered" email to the contact of a saved order. */
export abstract class OrderConfirmationSender {
    abstract send(order: Order): Promise<void>;
}
