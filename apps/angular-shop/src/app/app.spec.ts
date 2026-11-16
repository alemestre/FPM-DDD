import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { AuthService } from './services/auth.service';
import { CartService } from './services/cart.service';

describe('App', () => {
    const sessionChecked = signal(false);
    const restored = signal(false);

    beforeEach(async () => {
        sessionChecked.set(false);
        restored.set(false);
        await TestBed.configureTestingModule({
            imports: [App],
            providers: [
                provideRouter([]),
                { provide: AuthService, useValue: { sessionChecked } },
                { provide: CartService, useValue: { restored } },
            ],
        }).compileComponents();
    });

    const render = async () => {
        const fixture = TestBed.createComponent(App);
        await fixture.whenStable();
        return fixture;
    };

    const spinner = (fixture: { nativeElement: HTMLElement }) =>
        fixture.nativeElement.querySelector('.spinner-border');

    // La navbar appartient désormais aux layouts (voir main-layout.spec.ts et auth-layout.spec.ts).
    it('should only render the router outlet once loaded', async () => {
        sessionChecked.set(true);
        restored.set(true);
        const compiled = (await render()).nativeElement as HTMLElement;
        expect(compiled.querySelector('nav.navbar')).toBeNull();
        expect(compiled.querySelector('router-outlet')).not.toBeNull();
    });

    it('shows the loader while the session is not checked', async () => {
        restored.set(true);
        const fixture = await render();
        expect(spinner(fixture)).not.toBeNull();
        expect(fixture.nativeElement.querySelector('router-outlet')).toBeNull();
    });

    it('shows the loader while the cart is not restored', async () => {
        sessionChecked.set(true);
        const fixture = await render();
        expect(spinner(fixture)).not.toBeNull();
        expect(fixture.nativeElement.querySelector('router-outlet')).toBeNull();
    });

    it('hides the loader once the session is checked and the cart restored', async () => {
        const fixture = await render();
        expect(spinner(fixture)).not.toBeNull();

        sessionChecked.set(true);
        restored.set(true);
        await fixture.whenStable();

        expect(spinner(fixture)).toBeNull();
        expect(fixture.nativeElement.querySelector('router-outlet')).not.toBeNull();
    });
});
