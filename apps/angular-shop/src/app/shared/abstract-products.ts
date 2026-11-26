import type { ApiResponseDto, ProductWithProducerResponseDto as Product } from '@fpm/contracts';
import { NotificationService } from '../services/notification.service';
import { ProductService } from '../services/product.service';
import type { HttpResourceRef } from '@angular/common/http';
import { CartService } from '../services/cart.service';
import { computed, effect, inject } from '@angular/core';

export abstract class Products {
    protected readonly notificationService = inject(NotificationService);
    protected readonly productsService = inject(ProductService);
    protected readonly cartService = inject(CartService);

    /** Fournie par la sous-classe avec l'une des méthodes `*Resource` de ProductsService. */
    protected abstract readonly productsResource: HttpResourceRef<
        ApiResponseDto<Product[]> | undefined
    >;

    readonly products = computed<Product[]>(() =>
        this.productsResource.hasValue() ? this.productsResource.value().data : [],
    );

    readonly productsCount = computed(() => this.products().length);

    readonly hasProducts = computed(() => this.productsCount() > 0);

    readonly isLoading = computed(() => this.productsResource.isLoading());

    readonly error = computed(() =>
        this.productsResource.error() ? 'Une erreur est survenue.' : null,
    );

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
