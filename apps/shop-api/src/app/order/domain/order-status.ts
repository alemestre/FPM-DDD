/** Life cycle of an order, from its registration to its pickup at the shop. */
export const ORDER_STATUSES = [
    /** Placed by the customer, not yet handled by the shop. */
    'REGISTERED',
    'IN_PROGRESS',
    /** A quantity was changed or a product removed while preparing the order. */
    'MODIFIED',
    /** Waiting for the customer at the shop. */
    'READY',
    /** Picked up by the customer. */
    'COMPLETED',
    'CANCELLED',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];
