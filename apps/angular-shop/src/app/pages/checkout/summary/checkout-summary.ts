import { CartTotalSummaryComponent } from '../../cart/cart-total-summary/cart-total-summary';
import { CheckoutAuthenticated } from './form/authenticated/checkout-authenticated';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CartListComponent } from '../../cart/cart-list/cart-list';
import { AuthService } from '../../../services/auth.service';
import { CheckoutGuest } from './form/guest/checkout-guest';


@Component({
    selector: 'app-checkout',
  imports: [CartListComponent, CartTotalSummaryComponent, CheckoutAuthenticated, CheckoutGuest],
    templateUrl: './checkout-summary.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutSummary {
    protected readonly authService = inject(AuthService);
    isAuthenticated = this.authService.isConnected
}
