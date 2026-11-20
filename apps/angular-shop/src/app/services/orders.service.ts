import type { ApiResponseDto, OrderResponseDto, OrderStatusDto } from '@fpm/contracts';
import { environment } from '../../environments/environment';
import { HttpClient, httpResource } from '@angular/common/http';
import { inject, Injectable, Signal } from '@angular/core';
import { CONSTANTS } from '../shared/constant';
import { map, Observable } from 'rxjs';

/** Commandes pas encore retirées ni annulées. */
export const CURRENT_ORDER_STATUSES: readonly OrderStatusDto[] = [
    'REGISTERED',
    'IN_PROGRESS',
    'MODIFIED',
    'READY',
];

export const isCurrentOrder = (order: Pick<OrderResponseDto, 'status'>): boolean =>
    CURRENT_ORDER_STATUSES.includes(order.status);

export interface OrderItemPayload {
    readonly productId: string;
    readonly quantity: number;
}

export interface BillingAddressPayload {
    readonly line1: string;
    readonly line2: string;
    readonly postalCode: string;
    readonly city: string;
}

export interface GuestContactPayload {
    readonly firstName: string;
    readonly lastName: string;
    readonly email: string;
    readonly phone: string;
}

/** Commande du client connecté : son contact vient de son compte, côté API. */
export interface PlaceOrderPayload {
    readonly items: readonly OrderItemPayload[];
    readonly billingAddress: BillingAddressPayload;
}

export interface PlaceGuestOrderPayload extends PlaceOrderPayload {
    readonly contact: GuestContactPayload;
}

/** Les prix ne sont jamais envoyés : l'API les lit dans le catalogue. */
@Injectable({
    providedIn: 'root',
})
export class OrdersService {
    private readonly httpClient = inject(HttpClient);
    private readonly apiUrl = environment.apiUrl;

    placeOrder(payload: PlaceOrderPayload): Observable<OrderResponseDto> {
        return this.post(CONSTANTS.API_END_POINTS.ORDERS, payload);
    }

    placeGuestOrder(payload: PlaceGuestOrderPayload): Observable<OrderResponseDto> {
        return this.post(CONSTANTS.API_END_POINTS.GUEST_ORDERS, payload);
    }

    private post(endpoint: string, payload: PlaceOrderPayload) {
        return this.httpClient
            .post<ApiResponseDto<OrderResponseDto>>(`${this.apiUrl}/${endpoint}`, payload, {
                withCredentials: true,
            })
            .pipe(map((response) => response.data));
    }

    /**
     * Commandes du client connecté, les plus récentes en premier : l'API le reconnaît à sa session.
     * Renvoie une ressource (chargement, erreur, valeur en signaux) : à appeler dans un contexte d'injection.
     */
    myOrdersResource() {
        return httpResource<ApiResponseDto<OrderResponseDto[]>>(() => ({
            url: `${this.apiUrl}/${CONSTANTS.API_END_POINTS.ORDERS}`,
            withCredentials: true,
        }));
    }

  myOrderResource(orderId: Signal<string | null>) {
    return httpResource<ApiResponseDto<OrderResponseDto>>(() => {
      const id = orderId();
      return id
        ? {
          url: `${this.apiUrl}/${CONSTANTS.API_END_POINTS.ORDERS}/${encodeURIComponent(id)}`,
          withCredentials: true
        }
        : undefined;
    });
  }
}
