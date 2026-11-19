
import { AuthService } from '../../services/auth.service';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CartTotalSummaryComponent } from '../cart/cart-total-summary/cart-total-summary';
import { CartListComponent } from '../cart/cart-list/cart-list';
import { CheckoutAuthenticated } from './form/authenticated/checkout-authenticated';
import { CheckoutGuest } from './form/guest/checkout-guest';


@Component({
    selector: 'app-checkout',
  imports: [CartListComponent, CartTotalSummaryComponent, CheckoutAuthenticated, CheckoutGuest],
    templateUrl: './checkout.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Checkout {
    protected readonly authService = inject(AuthService);

    isAuthenticated = this.authService.isConnected
}
