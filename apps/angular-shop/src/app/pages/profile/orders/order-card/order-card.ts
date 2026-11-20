import { OrderResponseDto as Order, OrderStatusDto } from '@fpm/contracts';
import { STATUS_BADGES, StatusBadge } from '../orders';
import { Component, computed, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { isCurrentOrder } from '../../../../services/orders.service';
import { OrderAgainService } from '../../../../services/order-again.service';

@Component({
    selector: 'app-order-card',
    templateUrl: './order-card.html',
    imports: [DatePipe, RouterLink],
})
export class OrderCard {
    readonly order = input.required<Order>();
    private readonly orderAgainService = inject(OrderAgainService);

    /** « Commander à nouveau » n'est proposé que pour les commandes de l'historique. */
    protected readonly isCurrent = computed(() => isCurrentOrder(this.order()));
    protected readonly pending = signal(false);

    protected badgeOf(status: OrderStatusDto): StatusBadge {
        return STATUS_BADGES[status];
    }

    async orderAgain() {
        this.pending.set(true);
        try {
            await this.orderAgainService.orderAgain(this.order());
        } finally {
            this.pending.set(false);
        }
    }
}
