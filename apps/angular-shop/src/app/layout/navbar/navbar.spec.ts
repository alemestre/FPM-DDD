import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Navbar } from './navbar';

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
            providers: [provideRouter([])],
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

    it('should show the categories when clicking Produits', async () => {
        const toggles = Array.from(
            element.querySelectorAll<HTMLButtonElement>('button.dropdown-toggle'),
        );
        const products = toggles.find((toggle) => toggle.textContent?.includes('Produits'));
        if (!products) throw new Error('Produits button not found');

        const menu = products.parentElement?.querySelector('.dropdown-menu');
        expect(menu?.classList.contains('show')).toBe(false);

        await clickAndWait(products);

        expect(menu?.classList.contains('show')).toBe(true);
        expect(menu?.textContent).toContain('Fromages');
        expect(menu?.textContent).toContain('Légumes');
        expect(menu?.textContent).toContain('Viandes');
    });
});
