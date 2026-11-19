/** Mêmes valeurs que l'enum `OrderStatus` de l'API. */
export type OrderStatus = 'REGISTERED' | 'IN_PROGRESS' | 'MODIFIED' | 'READY' | 'COMPLETED' | 'CANCELLED';

export interface Order {
    id: string;
    /** Numéro lisible de la commande (`uid` côté API). */
    number: number;
    status: OrderStatus;
    createdAt: string;
}
