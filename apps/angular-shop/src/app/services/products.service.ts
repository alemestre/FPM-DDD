import { environment } from '../../environments/environment';
import type { ApiResponseDto, CategoryResponseDto as Category, ProductWithProducerResponseDto as Product } from '@fpm/contracts';
import { inject, Injectable, type Signal } from '@angular/core';
import { HttpClient, httpResource } from '@angular/common/http';
import { map, type Observable } from 'rxjs';
import { CONSTANTS } from '../shared/constant';

/**
 * Les méthodes `*Resource` renvoient une ressource (chargement, erreur, valeur en signaux) :
 * elles s'appellent dans un contexte d'injection, par exemple à l'initialisation d'un champ de composant.
 */
@Injectable({
    providedIn: 'root',
})
export class ProductsService {
    private _apiUrl = environment.apiUrl;
    private readonly httpClient = inject(HttpClient);

    availableProductsResource() {
        return httpResource<ApiResponseDto<Product[]>>(() => ({
            url: `${this._apiUrl}/${CONSTANTS.API_END_POINTS.PRODUCTS}`,
            params: { isAvailable: true },
        }));
    }

    /** Recharge quand `categoryId` change. */
    activeProductsByCategoryResource(categoryId: Signal<string>) {
        return httpResource<ApiResponseDto<Product[]>>(() => ({
            url: `${this._apiUrl}/${CONSTANTS.API_END_POINTS.PRODUCTS}`,
            params: { categoryId: categoryId(), isAvailable: true },
        }));
    }

    /**
     * Un seul appel, à la demande (par exemple au clic) : les produits qui existent parmi `ids`,
     * disponibles ou non. Les ids inconnus sont absents de la réponse.
     */
    productsByIds(ids: readonly string[]): Observable<Product[]> {
        return this.httpClient
            .get<ApiResponseDto<Product[]>>(`${this._apiUrl}/${CONSTANTS.API_END_POINTS.PRODUCTS}`, {
                params: { productIds: [...ids] },
            })
            .pipe(map((response) => response.data));
    }

}
