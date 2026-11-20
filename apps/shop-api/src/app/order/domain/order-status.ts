/**
 * Life cycle of an order, from its registration to its pickup at the shop.
 * A change to the lines (quantity, removed product) is not a status: the order keeps going through the cycle.
 */
export const ORDER_STATUSES = [
    /** Placed by the customer, waiting for the admin to validate it. */
    'PENDING',
    /** Validated by the admin, possibly with adjusted lines, and being prepared. */
    'PREPARING',
    /** Waiting for the customer at the shop. */
    'READY',
    /** Picked up by the customer. */
    'COMPLETED',
    /** Cancelled by the admin, including when the customer never picked it up. */
    'CANCELLED',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];
