import { environment } from '../../environments/environment';
import type { ApiResponseDto, CategoryResponseDto as Category, ProductWithProducerResponseDto as Product } from '@fpm/contracts';
import { Injectable, type Signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
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

    productsByIdRessource(ids: Signal<string[] | null>) {
        return httpResource<ApiResponseDto<Product[]>>(() => {
          const productIds = ids()
          return productIds
            ? { url: `${this._apiUrl}/${CONSTANTS.API_END_POINTS.PRODUCTS}`, params: { productIds } }
            : undefined
        })
    }

}
