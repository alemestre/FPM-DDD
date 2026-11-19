import { ProductCard } from '../../components/product-card/product-card';
import { SearchBar } from '../../components/search-bar/search-bar';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, debounceTime, distinctUntilChanged, map, of } from 'rxjs';
import { PRODUCTS_INITIAL_STATE } from '../../shared/constant';
import { Products } from '../../components/abstract-products';
import { ProductsState } from '../../shared/interface';
import { Component, computed, signal } from '@angular/core';

/** Délai après la dernière frappe avant de filtrer la liste. */
export const SEARCH_DEBOUNCE_MS = 500;

/** Insensible à la casse et aux accents : « legume » trouve « Légumes ». */
const normalize = (value: string) =>
    value
        .trim()
        .toLocaleLowerCase('fr')
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '');

@Component({
    selector: 'app-home',
    imports: [ProductCard, SearchBar],
    templateUrl: './home.html',
})
export class Home extends Products {
    protected readonly state = toSignal(
        this.productsService.getAvailableProducts().pipe(
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
        { initialValue: PRODUCTS_INITIAL_STATE },
    );

    /** Valeur du champ de recherche, mise à jour à chaque frappe. */
    readonly searchTerm = signal('');

    private readonly debouncedSearchTerm = toSignal(
        toObservable(this.searchTerm).pipe(
            debounceTime(SEARCH_DEBOUNCE_MS),
            distinctUntilChanged(),
        ),
        { initialValue: '' },
    );

    readonly filteredProducts = computed(() => {
        const term = normalize(this.debouncedSearchTerm());
        const products = this.products();
        return term
            ? products.filter((product) => normalize(product.name).includes(term))
            : products;
    });
}
