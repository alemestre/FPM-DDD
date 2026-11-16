import { CartTotalSummaryComponent } from './cart-total-summary/cart-total-summary';
import { CartListComponent } from './cart-list/cart-list';
import { Component } from '@angular/core';
import { TitleCasePipe } from '@angular/common';

@Component({
  selector: 'app-cart',
  imports: [
    CartListComponent,
    CartTotalSummaryComponent,
  ],
  templateUrl: './cart.html'
})
export class CartComponent {}
