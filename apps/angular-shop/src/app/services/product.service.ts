import type { ApiResponseDto, ProductWithProducerResponseDto as Product } from '@fpm/contracts';
import { AdminEntityService } from '../shared/abstract-entity.service';
import { Injectable, type Signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { map, type Observable } from 'rxjs';
import { CONSTANTS } from '../shared/constant';

/**
 * Les méthodes `*Resource` renvoient une ressource (chargement, erreur, valeur en signaux) :
 * elles s'appellent dans un contexte d'injection, par exemple à l'initialisation d'un champ de composant.
 */
@Injectable({
    providedIn: 'root',
})
export class ProductService extends AdminEntityService<Product>{
  protected path = CONSTANTS.API_END_POINTS.PRODUCTS

    availableProductsResource() {
        return httpResource<ApiResponseDto<Product[]>>(() => ({
            url: `${this._apiUrl}/${this.path}`,
            params: { isAvailable: true },
        }));
    }

    /** Recharge quand `categoryId` change. */
    activeProductsByCategoryResource(categoryId: Signal<string>) {
        return httpResource<ApiResponseDto<Product[]>>(() => ({
            url: `${this._apiUrl}/${this.path}`,
            params: { categoryId: categoryId(), isAvailable: true },
        }));
    }

    /**
     * Un seul appel, à la demande (par exemple au clic) : les produits qui existent parmi `ids`,
     * disponibles ou non. Les ids inconnus sont absents de la réponse.
     */
    productsByIds(ids: readonly string[]): Observable<Product[]> {
        return this.httpClient
            .get<ApiResponseDto<Product[]>>(`${this._apiUrl}/${this.path}`, {
                params: { productIds: [...ids] },
            })
            .pipe(map((response) => response.data));
    }

}
