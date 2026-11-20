import { OrderResponseDto as Order, OrderStatusDto } from '@fpm/contracts';
import { STATUS_BADGES, StatusBadge } from '../orders';
import { Component,  input, } from '@angular/core';
import { DatePipe } from '@angular/common';


@Component({
  selector: 'app-order-card',
  templateUrl: './order-card.html',
  imports: [
    DatePipe
  ]
})
export class OrderCard {
  readonly order = input.required<Order>();

  protected badgeOf(status: OrderStatusDto): StatusBadge {
        return STATUS_BADGES[status];
    }
}
