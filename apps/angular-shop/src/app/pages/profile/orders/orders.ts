import { OrderStatusDto } from '@fpm/contracts';

export interface StatusBadge {
    readonly label: string;
    /** Icône Bootstrap Icons, sans le préfixe `bi`. */
    readonly icon: string;
    readonly classes: string;
}

/** Un badge par statut : le `Record` oblige à n'en oublier aucun. */
export const STATUS_BADGES: Readonly<Record<OrderStatusDto, StatusBadge>> = {
    PENDING: { label: 'En attente', icon: 'bi-clock', classes: 'text-bg-warning' },
    PREPARING: { label: 'En préparation', icon: 'bi-box-seam', classes: 'text-bg-info' },
    READY: { label: 'Prête à retirer', icon: 'bi-shop', classes: 'text-bg-success' },
    COMPLETED: {
        label: 'Retirée',
        icon: 'bi-check2-all',
        classes: 'bg-secondary-subtle text-secondary',
    },
    CANCELLED: { label: 'Annulée', icon: 'bi-x-circle', classes: 'bg-danger-subtle text-danger' },
};
