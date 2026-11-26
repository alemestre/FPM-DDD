import type { CategoryResponseDto as Category, CategoryRequestDto, ApiResponseDto } from '@fpm/contracts';
import { AdminEntityService } from '../shared/abstract-entity.service';
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
export class CategoryService extends AdminEntityService<Category, CategoryRequestDto> {
  protected readonly path = CONSTANTS.API_END_POINTS.CATEGORIES;

    allCategoriesResource() {
        return httpResource<ApiResponseDto<Category[]>>(
            () => `${this._apiUrl}/${CONSTANTS.API_END_POINTS.CATEGORIES}`,
        );
    }

    /** Aucune requête tant que `slug` vaut `null`. Recharge quand il change. */
    categoryBySlugResource(slug: Signal<string | null>) {
        return httpResource<ApiResponseDto<Category>>(() => {
            const value = slug();
            return value
                ? `${this._apiUrl}/${CONSTANTS.API_END_POINTS.CATEGORY_BY_SLUG}/${encodeURIComponent(value)}`
                : undefined;
        });
    }
}
