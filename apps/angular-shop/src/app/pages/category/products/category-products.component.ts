import { ProductCard } from '../../../components/product-card/product-card';
import type { CategoryResponseDto as Category } from '@fpm/contracts';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { PRODUCTS_INITIAL_STATE } from '../../../shared/constant';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { Products } from '../../../components/abstract-products';
import { ProductsState } from '../../../shared/interface';
import { TitleCasePipe } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
    selector: 'app-products',
    imports: [ProductCard, TitleCasePipe],
    templateUrl: './category-products.component.html',
})
export class CategoryProducts extends Products {
    category = input.required<Category>();

    protected readonly state = toSignal(
        toObservable(this.category).pipe(
            switchMap((category) =>
                this.productsService.getActiveProductsByCategoryId(category.id).pipe(
                    map((products) => ({
                        products,
                        loading: false,
                        error: null,
                    })),
                    catchError(() =>
                        of<ProductsState>({
                            products: [],
                            loading: false,
                            error: 'Une erreur est survenue.',
                        }),
                    ),
                ),
            ),
            startWith({
                ...PRODUCTS_INITIAL_STATE,
                loading: true,
            }),
        ),
        { initialValue: PRODUCTS_INITIAL_STATE },
    );
}
