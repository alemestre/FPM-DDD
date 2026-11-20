import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { isCurrentOrder } from '../../../services/orders.service';
import type { OrderResponseDto } from '@fpm/contracts';
import { OrderCard } from './order-card/order-card';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-customer-orders',
    imports: [RouterLink, OrderCard],
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
}
