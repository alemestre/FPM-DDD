import { CheckoutSessionService } from '../services/checkout-session.service';
import { checkoutMatch, identificationGuard } from './checkout-access.guard';
import { provideRouter, Router, type Route, type UrlSegment, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { appRoutes } from '../app.routes';

@Component({ template: '' })
class Stub {}

describe('checkout : choix de la page selon la session', () => {
    const isConnected = signal(false);
    const isGuest = signal(false);

    const match = () =>
        TestBed.runInInjectionContext(() => checkoutMatch({} as Route, [] as UrlSegment[], {} as never));

    beforeEach(() => {
        isConnected.set(false);
        isGuest.set(false);
        TestBed.configureTestingModule({
            providers: [
                provideRouter([]),
                { provide: AuthService, useValue: { isConnected } },
                { provide: CheckoutSessionService, useValue: { isGuest } },
            ],
        });
    });

    it('ouvre le checkout au client connecté et au visiteur qui a choisi « invité », pas aux autres', () => {
        expect(match()).toBe(false);

        isConnected.set(true);
        expect(match()).toBe(true);

        isConnected.set(false);
        isGuest.set(true);
        expect(match()).toBe(true);
    });

    it("renvoie le client connecté de l'identification vers le checkout", () => {
        const guard = () => TestBed.runInInjectionContext(() => identificationGuard({} as never, {} as never));

        expect(guard()).toBe(true);

        isConnected.set(true);
        expect(TestBed.inject(Router).serializeUrl(guard() as UrlTree)).toBe('/checkout');
    });

    it("renvoie les autres visiteurs vers la page d'identification", async () => {
        // Les routes de l'application, composants remplacés : seule la sélection est testée.
        const stubbed = (routes: Route[]): Route[] =>
            routes.map(({ loadComponent, component, children, ...route }) => ({
                ...route,
                ...(loadComponent || component ? { component: Stub } : {}),
                ...(children ? { children: stubbed(children) } : {}),
            }));
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
            providers: [
                provideRouter(stubbed(appRoutes)),
                { provide: AuthService, useValue: { isConnected } },
                { provide: CheckoutSessionService, useValue: { isGuest } },
            ],
        });
        const router = TestBed.inject(Router);

        await router.navigateByUrl('/checkout');
        expect(router.url).toBe('/checkout/identification');

        isGuest.set(true);
        await router.navigateByUrl('/checkout');
        expect(router.url).toBe('/checkout');
    });
});
