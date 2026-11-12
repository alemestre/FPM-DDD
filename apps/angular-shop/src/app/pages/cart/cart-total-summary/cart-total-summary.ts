import { NotificationService } from '../../../components/notification/notification.service';
import { Component, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { CartService } from '../cart.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cart-total-summary',
  imports: [
    CurrencyPipe
  ],
  templateUrl: './cart-total-summary.html'
})
export class CartTotalSummaryComponent {
  private readonly cartService = inject(CartService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);

  // Expose cart service for template
  get cart() {
    return this.cartService;
  }

  proceedToCheckout(): void {
    if (this.cartService.isEmpty()) {
      this.notificationService.showError('Your cart is empty. Add some items before checkout.');
      return;
    }

    // Navigate to checkout page
    this.router.navigate(['/checkout']);
  }

  clearCart(): void {
    if (this.cartService.isEmpty()) {
      this.notificationService.showInfo('Your cart is already empty.');
      return;
    }

    this.cartService.clearCart();
    this.notificationService.showSuccess('Cart cleared successfully!');
  }
}
