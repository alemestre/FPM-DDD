import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { OrderResponseDto, OrderStatusDto } from '@fpm/contracts';
import { isCurrentOrder } from '../../../services/orders.service';
import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { STATUS_BADGES, StatusBadge } from './orders';
import { RouterLink } from '@angular/router';

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
