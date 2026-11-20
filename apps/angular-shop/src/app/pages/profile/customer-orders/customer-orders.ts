import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { OrderResponseDto, OrderStatusDto } from '@fpm/contracts';
import { isCurrentOrder } from '../../../services/orders.service';
import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';

interface StatusBadge {
    readonly label: string;
    /** Icône Bootstrap Icons, sans le préfixe `bi`. */
    readonly icon: string;
    readonly classes: string;
}

/** Un badge par statut : le `Record` oblige à n'en oublier aucun. */
const STATUS_BADGES: Readonly<Record<OrderStatusDto, StatusBadge>> = {
    REGISTERED: { label: 'En attente', icon: 'bi-clock', classes: 'text-bg-warning' },
    IN_PROGRESS: { label: 'En préparation', icon: 'bi-box-seam', classes: 'text-bg-info' },
    MODIFIED: {
        label: 'Modifiée',
        icon: 'bi-pencil-square',
        classes: 'bg-warning-subtle text-warning-emphasis',
    },
    READY: { label: 'Prête à retirer', icon: 'bi-shop', classes: 'text-bg-success' },
    COMPLETED: {
        label: 'Retirée',
        icon: 'bi-check2-all',
        classes: 'bg-secondary-subtle text-secondary',
    },
    CANCELLED: { label: 'Annulée', icon: 'bi-x-circle', classes: 'bg-danger-subtle text-danger' },
};

@Component({
    selector: 'app-customer-orders',
    imports: [RouterLink, DatePipe, NgTemplateOutlet],
    templateUrl: './customer-orders.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerOrders {
    /** Déjà triées par l'API, les plus récentes en premier. */
    readonly orders = input.required<readonly OrderResponseDto[]>();
    readonly isLoading = input(false);
    readonly hasError = input(false);
    /** Demande au parent de recharger les commandes après une erreur. */
    readonly retry = output<void>();

    protected readonly currentOrders = computed(() => this.orders().filter(isCurrentOrder));
    protected readonly pastOrders = computed(() =>
        this.orders().filter((order) => !isCurrentOrder(order)),
    );

    protected badgeOf(status: OrderStatusDto): StatusBadge {
        return STATUS_BADGES[status];
    }
}
