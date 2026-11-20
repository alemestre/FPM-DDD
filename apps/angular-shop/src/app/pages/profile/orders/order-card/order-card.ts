import { OrderResponseDto as Order } from '@fpm/contracts';
import { Component,  input, } from '@angular/core';


@Component({
  selector: 'app-order-card',
  templateUrl: './order-card.html',
})
export class OrderCard {
  readonly order = input.required<Order>();


}
