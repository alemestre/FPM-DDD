import type { CategoryResponseDto, ProductWithProducerResponseDto } from '@fpm/contracts';
import { CategoriesService } from '../../services/categories.service';
import { ProductsService } from '../../services/products.service';
import { catchError, map, of, switchMap } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProductCard } from '../../components/product-card/product-card';
import { TitleCasePipe } from '@angular/common';

interface CategoryProducts {
  category: CategoryResponseDto | null;
  products: ProductWithProducerResponseDto[];
}

const NO_CATEGORY: CategoryProducts = { category: null, products: [] };

@Component({
  selector: 'app-products',
  imports: [ProductCard, TitleCasePipe],
  templateUrl: './products.html',
  styleUrl: './products.css'
})
export class Products {
  private readonly categoriesService = inject(CategoriesService);
  private readonly productsService = inject(ProductsService);
  private readonly route = inject(ActivatedRoute);

  // L'URL porte le slug (/produits/fruits-legumes) : on le résout en catégorie,
  // puis on charge ses produits par id. Un slug inconnu donne une catégorie nulle.
  private readonly state = toSignal(
    this.route.paramMap.pipe(
      map((params) => params.get('slug')),
      switchMap((slug) => (slug ? this.loadCategoryProducts(slug) : of(NO_CATEGORY)))
    ),
    { initialValue: NO_CATEGORY }
  );

  readonly category = computed(() => this.state().category);
  readonly products = computed(() => this.state().products);
  readonly productsCount = computed(() => this.products().length);
  readonly hasProducts = computed(() => this.productsCount() > 0);

  private loadCategoryProducts(slug: string) {
    return this.categoriesService.getCategoryBySlug(slug).pipe(
      switchMap((category) =>
        this.productsService
          .getProductsByCategoryId(category.id)
          .pipe(map((products): CategoryProducts => ({ category, products })))
      ),
      catchError(() => of(NO_CATEGORY))
    );
  }
}
