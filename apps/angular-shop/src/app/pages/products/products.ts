import type { CategoryResponseDto as Category, ProductWithProducerResponseDto as Product } from '@fpm/contracts';
import { CategoriesService } from '../../services/categories.service';
import { ProductsService } from '../../services/products.service';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { Component, computed, effect, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProductCard } from '../../components/product-card/product-card';
import { TitleCasePipe } from '@angular/common';
import { CartService } from '../cart/cart.service';
import { NotificationService } from '../../components/notification/notification.service';


interface ProductsState {
  category: Category | null
  products: Product[];
  loading: boolean
  error: string | null
}

const INITIAL_STATE: ProductsState = {
  category: null,
  products: [],
  loading: true,
  error: null,
}

@Component({
  selector: 'app-products',
  imports: [ProductCard, TitleCasePipe],
  templateUrl: './products.html',
  styleUrl: './products.css',
})
export class Products {
  private readonly notificationService = inject(NotificationService);
  private readonly categoriesService = inject(CategoriesService);
  private readonly productsService = inject(ProductsService);
  private readonly cartService = inject(CartService)
  private readonly route = inject(ActivatedRoute);

  private readonly state = toSignal(
    this.route.paramMap.pipe(
      map(params => params.get('slug')),

      switchMap(slug => {
        if (!slug) {
          return of({
            ...INITIAL_STATE,
            loading: false,
          });
        }

        return this.categoriesService.getCategoryBySlug(slug).pipe(
          switchMap(category =>
            this.productsService.getProductsByCategoryId(category.id).pipe(
              map(products => ({
                category,
                products,
                loading: false,
                error: null,
              }))
            )
          ),

          catchError(err =>
            of({
              category: null,
              products: [],
              loading: false,
              error: err.message ?? 'Une erreur est survenue.',
            })
          ),

          startWith({
            ...INITIAL_STATE,
            loading: true,
          })
        );
      })
    ),
    { initialValue: INITIAL_STATE }
  );

  readonly category = computed(() => this.state().category);

  readonly products = computed(() => this.state().products);

  readonly productsCount = computed(() => this.products().length);

  readonly hasProducts = computed(() => this.productsCount() > 0);

  readonly isLoading = computed(() => this.state().loading);

  readonly error = computed(() => this.state().error);

  onAddToCart(product: Product ) {
    console.log("produit reçu")
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
