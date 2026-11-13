import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { CartService } from '../../../services/cart.service';
import { TopBar } from './top-bar';

describe('TopBar', () => {
    let fixture: ComponentFixture<TopBar>;
    let element: HTMLElement;
    const isConnected = signal(false);
    const totalItems = signal(0);
    const authService = { isConnected, logout: vi.fn(() => of(null)) };

    const clickAndWait = async (target: HTMLElement) => {
        target.click();
        await fixture.whenStable();
    };

    beforeEach(async () => {
        isConnected.set(false);
        totalItems.set(0);
        authService.logout.mockClear();
        await TestBed.configureTestingModule({
            imports: [TopBar],
            providers: [
                provideRouter([{ path: '**', children: [] }]),
                { provide: AuthService, useValue: authService },
                { provide: CartService, useValue: { totalItems } },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(TopBar);
        element = fixture.nativeElement as HTMLElement;
        await fixture.whenStable();
    });

    it('should link the logo to the home page', () => {
        const brand = element.querySelector<HTMLAnchorElement>('a.app-brand');

        expect(brand?.querySelector('img')).toBeTruthy();
        expect(brand?.getAttribute('href')).toBe('/home');
    });

    it('should link to the cart', () => {
        const cart = element.querySelector<HTMLAnchorElement>('a.app-cart');

        expect(cart?.getAttribute('href')).toBe('/panier');
    });

    it('should show the number of items in the cart badge, with a screen reader text', async () => {
        const badge = element.querySelector('.app-cart-badge');
        const text = () => badge?.textContent?.replace(/\s+/g, ' ').trim();

        expect(text()).toBe('0 Votre panier est tristement vide');

        totalItems.set(1);
        await fixture.whenStable();
        expect(text()).toBe('1 1 article dans le panier');

        totalItems.set(3);
        await fixture.whenStable();
        expect(text()).toBe('3 3 articles dans le panier');
    });

    it('should show the login button and no profile when logged out', () => {
        expect(element.querySelector('a[href="/login"]')).toBeTruthy();
        expect(element.querySelector('.app-profile')).toBeNull();
    });

    it('should show the profile and no login button when logged in', async () => {
        isConnected.set(true);
        await fixture.whenStable();

        expect(element.querySelector('.app-profile')).toBeTruthy();
        expect(element.querySelector('a[href="/login"]')).toBeNull();
    });

    it('should log out then go home when clicking "Se déconnecter"', async () => {
        const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
        isConnected.set(true);
        await fixture.whenStable();

        const logout = Array.from(
            element.querySelectorAll<HTMLButtonElement>('.app-profile button'),
        ).find((button) => button.textContent?.includes('Se déconnecter'));
        if (!logout) throw new Error('Logout button not found');
        await clickAndWait(logout);

        expect(authService.logout).toHaveBeenCalledOnce();
        expect(navigate).toHaveBeenCalledWith('/home');
    });

    it('should toggle the menu when clicking the burger', async () => {
        const burger = element.querySelector<HTMLButtonElement>('.navbar-toggler');
        if (!burger) throw new Error('Burger button not found');

        expect(burger.getAttribute('aria-expanded')).toBe('false');

        await clickAndWait(burger);
        expect(burger.getAttribute('aria-expanded')).toBe('true');
        expect(fixture.componentInstance.menuOpen()).toBe(true);

        await clickAndWait(burger);
        expect(burger.getAttribute('aria-expanded')).toBe('false');
    });

    it('should close the menu when clicking the logo', async () => {
        fixture.componentInstance.menuOpen.set(true);
        const brand = element.querySelector<HTMLAnchorElement>('a.app-brand');
        if (!brand) throw new Error('Logo link not found');
        await clickAndWait(brand);

        expect(fixture.componentInstance.menuOpen()).toBe(false);
    });
});
