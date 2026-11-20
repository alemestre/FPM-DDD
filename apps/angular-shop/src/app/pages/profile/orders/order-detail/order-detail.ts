import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { OrderResponseDto, type OrderStatusDto } from '@fpm/contracts';
import { OrdersService } from '../../../../services/orders.service';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { STATUS_BADGES, StatusBadge } from '../orders';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';

@Component({
    selector: 'app-order-detail',
  imports: [
    DatePipe,
    CurrencyPipe
  ],
    templateUrl: './order-detail.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderDetail {
  private readonly ordersService = inject(OrdersService);
  private readonly route = inject(ActivatedRoute);

  private readonly orderId = toSignal(this.route.paramMap.pipe(map((params) => params.get('id'))), {
    initialValue: null
  });

  protected readonly orderResource = this.ordersService.myOrderResource(this.orderId);
  protected readonly order = computed<OrderResponseDto | undefined>(() =>
    this.orderResource.hasValue() ? this.orderResource.value().data : undefined
  );

  protected readonly isLoading = this.orderResource.isLoading
  protected readonly hasError = computed(() => this.orderResource.error() !== undefined);

  protected reload() {
    this.orderResource.reload();
  }

  protected badgeOf(status: OrderStatusDto): StatusBadge {
        return STATUS_BADGES[status];
    }
}
