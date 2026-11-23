import { NotificationService } from '../../../services/notification.service';
import { CommonModule, CurrencyPipe, NgOptimizedImage } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../../services/cart.service';
import type { CartItem } from '../cart-item';

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

  /** Récapitulatif de la page checkout : quantités affichées sans pouvoir les modifier ni supprimer de produit. */
  readonly readonly = input(false);

  // Expose cart service for template
  get cart() {
    return this.cartService;
  }

  updateQuantity(item: CartItem, field: HTMLInputElement) {
    const qty = Number.parseInt(field.value, 10);
    // L'input affiche toujours la quantité du panier : il reprend tout de suite la valeur
    // actuelle, puis suit le panier. Une quantité refusée (limite, stock) n'y reste donc pas.
    field.value = String(item.quantity);

    if (Number.isNaN(qty) || qty < 0) {
      this.notificationService.showError('Please enter a valid quantity');
      return;
    }

    const result = this.cartService.updateQuantity(item.product.id, qty);
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
