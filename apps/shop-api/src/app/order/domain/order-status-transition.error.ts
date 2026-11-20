import type { OrderStatus } from './order-status';

/**
 * Raised when an action does not fit the current status of an order
 * (preparing a cancelled order, changing a ready one, …).
 * Not a validation error: the request is well-formed, the order is just not in the right state.
 */
export class OrderStatusTransitionError extends Error {
    constructor(
        readonly orderId: string,
        readonly status: OrderStatus,
        action: string,
    ) {
        super(`Impossible de ${action} : la commande est au statut ${status}`);
        this.name = 'OrderStatusTransitionError';
    }
}
