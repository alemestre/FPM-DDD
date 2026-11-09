import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CategoriesService } from '../../services/categories.service';
import { provideRouter } from '@angular/router';
import { Navbar } from './navbar';
import { of } from 'rxjs';

describe('Navbar', () => {
    let component: Navbar;
    let fixture: ComponentFixture<Navbar>;
    let element: HTMLElement;

    const clickAndWait = async (target: HTMLElement) => {
        target.click();
        await fixture.whenStable();
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [Navbar],
            providers: [
                provideRouter([]),
                {
                    provide: CategoriesService,
                    useValue: {
                        getAllCategories: () =>
                            of([
                                { id: 'cat-1', name: 'viandes' },
                                { id: 'cat-2', name: 'fruits & légumes' },
                            ]),
                    },
                },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(Navbar);
        component = fixture.componentInstance;
        element = fixture.nativeElement as HTMLElement;
        await fixture.whenStable();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should open then close the menu when clicking the burger', async () => {
        const burger = element.querySelector<HTMLButtonElement>('.navbar-toggler');
        if (!burger) throw new Error('Burger button not found');

        expect(burger.getAttribute('aria-expanded')).toBe('false');

        await clickAndWait(burger);
        expect(burger.getAttribute('aria-expanded')).toBe('true');

        await clickAndWait(burger);
        expect(burger.getAttribute('aria-expanded')).toBe('false');
    });

    it('should link to the cart', () => {
        const cart = element.querySelector<HTMLAnchorElement>('a.app-cart');

        expect(cart?.textContent).toContain('Votre panier');
        expect(cart?.getAttribute('href')).toBe('/panier');
    });

    it('should show the number of items in the cart badge', async () => {
        const badge = element.querySelector('.app-cart-badge');

        expect(badge?.textContent?.replace(/\s+/g, ' ').trim()).toBe('0 article');

        component['cartItemCount'].set(3);
        await fixture.whenStable();

        expect(badge?.textContent?.replace(/\s+/g, ' ').trim()).toBe('3 articles');
    });

    it('should list each category in the main menu, with the about link last', () => {
        const links = Array.from(
            element.querySelectorAll<HTMLAnchorElement>('.app-categories > .nav-item > a'),
        );

        expect(links.map((link) => link.textContent?.trim())).toEqual([
            'Viandes',
            'Fruits & Légumes',
            'À propos',
        ]);
        expect(links.map((link) => link.getAttribute('href'))).toEqual([
            '/products/cat-1',
            '/products/cat-2',
            '/about',
        ]);
    });

    it('should link the logo to the home page', () => {
        const brand = element.querySelector<HTMLAnchorElement>('a.app-brand');

        expect(brand?.querySelector('img')).toBeTruthy();
        expect(brand?.getAttribute('href')).toBe('/home');
    });

    it('should show the auth buttons and no profile when logged out', () => {
        expect(element.querySelector('a[href="/login"]')).toBeTruthy();
        expect(element.querySelector('a[href="/register"]')).toBeTruthy();
        expect(element.querySelector('.app-profile')).toBeNull();
    });

    it('should show the profile and no auth buttons when logged in', async () => {
        component['isAuthenticated'].set(true);
        await fixture.whenStable();

        expect(element.querySelector('.app-profile')).toBeTruthy();
        expect(element.querySelector('a[href="/login"]')).toBeNull();
        expect(element.querySelector('a[href="/register"]')).toBeNull();
    });

    it('should not have a Produits dropdown', () => {
        const toggles = Array.from(element.querySelectorAll('button.dropdown-toggle'));

        expect(toggles.some((toggle) => toggle.textContent?.includes('Produits'))).toBe(false);
    });
});
