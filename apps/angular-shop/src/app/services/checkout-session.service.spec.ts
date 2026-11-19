import { CheckoutSessionService } from './checkout-session.service';
import { AuthService } from './auth.service';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

describe('CheckoutSessionService', () => {
    const isConnected = signal(false);

    beforeEach(() => {
        sessionStorage.clear();
        isConnected.set(false);
        TestBed.configureTestingModule({
            providers: [{ provide: AuthService, useValue: { isConnected } }],
        });
    });

    it('garde le choix invité pour la session de l’onglet', () => {
        TestBed.inject(CheckoutSessionService).continueAsGuest();
        TestBed.tick();

        expect(sessionStorage.getItem('fpm_checkout_guest')).toBe('true');
    });

    it('efface le choix invité quand le client se connecte', () => {
        const session = TestBed.inject(CheckoutSessionService);
        session.continueAsGuest();
        TestBed.tick();

        isConnected.set(true);
        TestBed.tick();

        expect(session.isGuest()).toBe(false);
        expect(sessionStorage.getItem('fpm_checkout_guest')).toBeNull();
    });
});
