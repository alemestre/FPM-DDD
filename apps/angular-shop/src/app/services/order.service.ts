import type { ApiResponseDto, OrderResponseDto } from '@fpm/contracts';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { CONSTANTS } from '../shared/constant';
import { map, Observable } from 'rxjs';

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
export class OrderService {
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
}
