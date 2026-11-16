import { ProductCard } from '../../components/product-card/product-card';
import { PRODUCTS_INITIAL_STATE } from '../../shared/constant';
import { Products } from '../../components/abstract-products';
import { ProductsState } from '../../shared/interface';
import { toSignal } from '@angular/core/rxjs-interop';
import { Component, inject } from '@angular/core';
import { catchError, map, of } from 'rxjs';


@Component({
    selector: 'app-home',
  imports: [
    ProductCard,
  ],
    templateUrl: './home.html',
})
export class Home extends Products {
  protected readonly state = toSignal(this.productsService.getAvailableProducts().pipe(
      map(products => ({
          products,
          loading: false,
          error: null
        })
      ),
      catchError((err) => of<ProductsState>({
        products: [],
        loading: false,
        error: err.message ?? 'Une erreur est survenue.'
      }))
    ), { initialValue: PRODUCTS_INITIAL_STATE }
  );
}
