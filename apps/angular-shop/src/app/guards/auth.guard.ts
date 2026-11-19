import { CheckoutSessionService } from '../services/checkout-session.service';
import { AuthService } from '../services/auth.service';
import { type CanActivateFn, type CanMatchFn, Router } from '@angular/router';
import { inject } from '@angular/core';

/** Page à laquelle on renvoie un visiteur qui n'a choisi ni de se connecter ni de commander en invité. */
export const CHECKOUT_IDENTIFICATION_URL = '/checkout/identification';

/**
 * `/checkout` est ouvert au client connecté et au visiteur qui a choisi de commander en tant qu'invité.
 * La session est déjà vérifiée : l'initialiseur de l'application attend `loadCurrentUser`.
 */
export const checkoutMatch: CanMatchFn = () =>
    inject(AuthService).isConnected() || inject(CheckoutSessionService).isGuest();

/** Un client connecté ne choisit pas : il va directement au checkout connecté. */
export const identificationGuard: CanActivateFn = () =>
    !inject(AuthService).isConnected() || inject(Router).parseUrl('/checkout');
