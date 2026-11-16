import type { ProductWithProducerResponseDto as Product } from '@fpm/contracts';
import { computed, effect, inject, Signal } from '@angular/core';
import { NotificationService } from '../services/notification.service';
import { ProductsService } from '../services/products.service';
import { CartService } from '../services/cart.service';
import { ProductsState } from '../shared/interface';



export abstract class Products<State extends ProductsState = ProductsState> {
  protected readonly notificationService = inject(NotificationService);
  protected readonly productsService = inject(ProductsService);
  protected readonly cartService = inject(CartService);

  protected abstract readonly state: Signal<State>

    readonly products = computed(() => this.state().products);

    readonly productsCount = computed(() => this.products().length);

    readonly hasProducts = computed(() => this.productsCount() > 0);

    readonly isLoading = computed(() => this.state().loading);

    readonly error = computed(() => this.state().error);

    onAddToCart({ product, quantity }: { product: Product; quantity: number }) {
        this.cartService.addToCart(product, quantity);
    }

    constructor() {
        effect(() => {
            const error = this.error();
            if (error) this.notificationService.showError(error);
        });
    }
}
