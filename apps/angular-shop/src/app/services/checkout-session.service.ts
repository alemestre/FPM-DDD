import { effect, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { AuthService } from './auth.service';
import type { OrderResponseDto } from '@fpm/contracts';
import { isPlatformBrowser } from '@angular/common';

const GUEST_STORAGE_KEY = 'fpm_checkout_guest';

/**
 * État du tunnel de commande : choix « commander en tant qu'invité » et dernière commande passée.
 * Le choix invité est gardé en sessionStorage pour survivre à un rechargement de la page checkout,
 * sans rester d'une visite à l'autre.
 */
@Injectable({
    providedIn: 'root',
})
export class CheckoutSessionService {
    private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

    private readonly _isGuest = signal(this.readGuestFlag());
    readonly isGuest = this._isGuest.asReadonly();

    /** Commande que vient de renvoyer l'API, affichée par la page de confirmation. */
    private readonly _lastOrder = signal<OrderResponseDto | null>(null);
    readonly lastOrder = this._lastOrder.asReadonly();

    constructor() {
        // Une fois connecté, le client ne commande plus en invité : s'il se déconnecte ensuite,
        // `/checkout` le renvoie de nouveau vers l'identification.
        const auth = inject(AuthService);
        effect(() => {
            if (auth.isConnected()) this.reset();
        });
    }

    continueAsGuest(): void {
        this._isGuest.set(true);
        this.writeGuestFlag(true);
    }

    /** Commande enregistrée : on la garde pour la confirmation et on oublie le choix invité. */
    completeOrder(order: OrderResponseDto): void {
        this._lastOrder.set(order);
        this.reset();
    }

    reset(): void {
        this._isGuest.set(false);
        this.writeGuestFlag(false);
    }

    private readGuestFlag(): boolean {
        if (!this.isBrowser) return false;
        try {
            return sessionStorage.getItem(GUEST_STORAGE_KEY) === 'true';
        } catch {
            return false;
        }
    }

    private writeGuestFlag(isGuest: boolean): void {
        if (!this.isBrowser) return;
        try {
            if (isGuest) {
                sessionStorage.setItem(GUEST_STORAGE_KEY, 'true');
            } else {
                sessionStorage.removeItem(GUEST_STORAGE_KEY);
            }
        } catch (error) {
            console.error('Error writing to session storage', error);
        }
    }
}
