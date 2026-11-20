import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { OrderResponseDto, type OrderStatusDto } from '@fpm/contracts';
import { isCurrentOrder, OrdersService } from '../../../../services/orders.service';
import { OrderAgainService } from '../../../../services/order-again.service';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { STATUS_BADGES, StatusBadge } from '../orders';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

@Component({
    selector: 'app-order-detail',
    imports: [DatePipe, RouterLink, CurrencyPipe],
    templateUrl: './order-detail.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderDetail {
    private readonly ordersService = inject(OrdersService);
    private readonly route = inject(ActivatedRoute);
    private readonly orderAgainService = inject(OrderAgainService);

    private readonly orderId = toSignal(
        this.route.paramMap.pipe(map((params) => params.get('id'))),
        {
            initialValue: null,
        },
    );

    protected readonly orderResource = this.ordersService.myOrderResource(this.orderId);
    protected readonly order = computed<OrderResponseDto | undefined>(() =>
        this.orderResource.hasValue() ? this.orderResource.value().data : undefined,
    );

    protected readonly isLoading = this.orderResource.isLoading;
    protected readonly hasError = computed(() => this.orderResource.error() !== undefined);

    protected reload() {
        this.orderResource.reload();
    }

    protected badgeOf(status: OrderStatusDto): StatusBadge {
        return STATUS_BADGES[status];
    }

    /** « Commander à nouveau » n'est proposé que pour les commandes de l'historique. */
    protected readonly isCurrent = computed(() => {
        const order = this.order();
        return order ? isCurrentOrder(order) : false;
    });
    protected readonly pending = signal(false);

    protected async orderAgain(order: OrderResponseDto) {
        this.pending.set(true);
        try {
            await this.orderAgainService.orderAgain(order);
        } finally {
            this.pending.set(false);
        }
    }
}
