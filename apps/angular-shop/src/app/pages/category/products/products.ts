import type { CategoryResponseDto as Category, ProductWithProducerResponseDto as Product } from '@fpm/contracts';
import { ProductsService } from '../../../services/products.service';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Component, computed, effect, inject, input } from '@angular/core';
import { ProductCard } from '../../../components/product-card/product-card';
import { TitleCasePipe } from '@angular/common';
import { CartService } from '../../../services/cart.service';
import { NotificationService } from '../../../services/notification.service';


interface ProductsState {
  products: Product[];
  loading: boolean
  error: string | null
}

const INITIAL_STATE: ProductsState = {
  products: [],
  loading: true,
  error: null,
}

@Component({
  selector: 'app-products',
  imports: [ProductCard, TitleCasePipe],
  templateUrl: './products.html'
})
export class Products {
  private readonly notificationService = inject(NotificationService);
  private readonly productsService = inject(ProductsService);
  private readonly cartService = inject(CartService)

  category = input.required<Category>();

  private readonly state = toSignal(
      toObservable(this.category).pipe(
        switchMap(category =>
          this.productsService.getProductsByCategoryId(category.id).pipe(
            map(products => ({
              products,
              loading: false,
              error: null,
            })),
            catchError(err =>
              of<ProductsState>({
                products: [],
                loading: false,
                error: err.message ?? 'Une erreur est survenue.',
              })
            )
          )
        ),
        startWith({
            ...INITIAL_STATE,
            loading: true,
          }),
        ),
    { initialValue: INITIAL_STATE }
  )

  readonly products = computed(() => this.state().products);

  readonly productsCount = computed(() => this.products().length);

  readonly hasProducts = computed(() => this.productsCount() > 0);

  readonly isLoading = computed(() => this.state().loading);

  readonly error = computed(() => this.state().error);

  onAddToCart(product: Product ) {
    this.cartService.addToCart(product)
  }

  constructor() {
    effect(() => {
      const error = this.error();
      if (error)
        this.notificationService.showError(error)
    });
  }
}
