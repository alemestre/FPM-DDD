import type { ApiResponseDto, GenericEntity } from '@fpm/contracts';
import { environment } from '../../environments/environment';
import { HttpClient, httpResource } from '@angular/common/http';
import { inject, type Signal } from '@angular/core';
import { map, type Observable } from 'rxjs';

/**
 * Appels CRUD d'une rubrique de l'espace admin, sur `/admin/<path>`, avec le cookie de session.
 * `Body` est le corps envoyé en création et en modification : il diffère souvent de l'entité
 * (par exemple, sans l’`id` ni le `slug` calculé par l’API pour une catégorie).
 *
 * Les méthodes `*Resource` renvoient une ressource (chargement, erreur, valeur en signaux) :
 * elles s'appellent dans un contexte d'injection, par exemple à l'initialisation d'un champ de composant.
 */
export abstract class AdminEntityService<T extends GenericEntity, Body = Partial<T>> {
    protected readonly _apiUrl = environment.apiUrl;
    protected readonly _adminUrl = `${this._apiUrl}/admin`;
    protected abstract readonly path: string;
    protected readonly httpClient = inject(HttpClient);

    getAdminEntityEndpoint() {
        return `${this._adminUrl}/${this.path}`;
    }

    adminEntitiesResource() {
        return httpResource<ApiResponseDto<T[]>>(() => ({
            url: this.getAdminEntityEndpoint(),
            withCredentials: true,
        }));
    }

    /** Aucune requête tant que `id` vaut `null`. Recharge quand il change. */
    adminEntityResource(id: Signal<string | null>) {
        return httpResource<ApiResponseDto<T>>(() => {
            const value = id();
            return value ? { url: this.entityUrl(value), withCredentials: true } : undefined;
        });
    }

    /** 400 si le corps est invalide, 409 en cas de conflit (nom déjà pris…). */
    createEntity(body: Body): Observable<T> {
        return this.httpClient
            .post<ApiResponseDto<T>>(this.getAdminEntityEndpoint(), body, { withCredentials: true })
            .pipe(map((response) => response.data));
    }

    updateEntity(id: string, body: Body): Observable<T> {
        return this.httpClient
            .patch<ApiResponseDto<T>>(this.entityUrl(id), body, { withCredentials: true })
            .pipe(map((response) => response.data));
    }

    /** 204 ; 409 si l'entité est encore utilisée ailleurs. */
    deleteEntity(id: string): Observable<void> {
        return this.httpClient.delete<void>(this.entityUrl(id), { withCredentials: true });
    }

    private entityUrl(id: string) {
        return `${this.getAdminEntityEndpoint()}/${encodeURIComponent(id)}`;
    }
}
