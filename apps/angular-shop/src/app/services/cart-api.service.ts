import type { ApiResponseDto, CartResponseDto } from '@fpm/contracts';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { CartItem } from '../pages/cart/cart-item';
import { CONSTANTS } from '../shared/constant';
import { map, Observable } from 'rxjs';

/**
 * Panier du client connecté, enregistré par l'API. L'API le reconnaît à sa session (cookie)
 * et renvoie le panier complet après chaque modification, sauf quand il est vidé (204).
 */
@Injectable({
    providedIn: 'root',
})
export class CartApiService {
    private readonly httpClient = inject(HttpClient);
    private readonly cartUrl = `${environment.apiUrl}/${CONSTANTS.API_END_POINTS.CART}`;
    private readonly itemsUrl = `${environment.apiUrl}/${CONSTANTS.API_END_POINTS.CART_ITEMS}`;

    load(): Observable<CartItem[]> {
        return this.toItems(
            this.httpClient.get<ApiResponseDto<CartResponseDto>>(this.cartUrl, {
                withCredentials: true,
            }),
        );
    }

    /** Ajoute à la quantité déjà dans le panier : 400 au-delà de 10 unités ou du stock. */
    add(productId: string, quantity: number): Observable<CartItem[]> {
        return this.toItems(
            this.httpClient.post<ApiResponseDto<CartResponseDto>>(
                this.itemsUrl,
                { productId, quantity },
                { withCredentials: true },
            ),
        );
    }

    /** 404 si le produit n'est pas dans le panier, 400 au-delà de 10 unités ou du stock. */
    changeQuantity(productId: string, quantity: number): Observable<CartItem[]> {
        return this.toItems(
            this.httpClient.patch<ApiResponseDto<CartResponseDto>>(
                `${this.itemsUrl}/${productId}`,
                { quantity },
                { withCredentials: true },
            ),
        );
    }

    /** 404 si le produit n'est pas dans le panier. */
    remove(productId: string): Observable<CartItem[]> {
        return this.toItems(
            this.httpClient.delete<ApiResponseDto<CartResponseDto>>(`${this.itemsUrl}/${productId}`, {
                withCredentials: true,
            }),
        );
    }

    /** Vide le panier (204, même s'il était déjà vide). */
    clear(): Observable<void> {
        return this.httpClient.delete<void>(this.itemsUrl, { withCredentials: true });
    }

    private toItems(response$: Observable<ApiResponseDto<CartResponseDto>>): Observable<CartItem[]> {
        return response$.pipe(map((response) => response.data.items));
    }
}
