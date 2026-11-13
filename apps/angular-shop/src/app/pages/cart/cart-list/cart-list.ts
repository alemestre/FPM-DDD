import { NotificationService } from '../../../services/notification.service';
import { CommonModule, CurrencyPipe, NgOptimizedImage } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../../services/cart.service';

@Component({
  selector: 'app-cart-list',
  imports: [
    CommonModule,
    NgOptimizedImage,
    FormsModule,
    CurrencyPipe
  ],
  templateUrl: './cart-list.html'
})
export class CartListComponent {
  private readonly cartService = inject(CartService);
  private readonly notificationService = inject(NotificationService);

  // Expose cart service for template
  get cart() {
    return this.cartService;
  }

  updateQuantity(productId: string, quantity: string) {
    const qty = Number.parseInt(quantity, 10);
    if (Number.isNaN(qty) || qty < 0) {
      this.notificationService.showError('Please enter a valid quantity');
      return;
    }

    const result = this.cartService.updateQuantity(productId, qty);
    if (!result.success) {
      this.notificationService.showError(result.message);
    }
  }

  removeItem(productId: string) {
    const result = this.cartService.removeFromCart(productId);
    if (result.success) {
      this.notificationService.showSuccess('Item removed from cart');
    } else {
      this.notificationService.showError(result.message);
    }
  }
}
