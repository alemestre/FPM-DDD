import type { ProductWithProducerResponseDto } from '@fpm/contracts';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { NotificationService } from '../../services/notification.service';
import { CartComponent } from './cart';

const product = (id: string, price: number): ProductWithProducerResponseDto => ({
    id,
    name: `Produit ${id}`,
    image: 'https://example.com/produit.jpg',
    price,
    vatRate: 10,
    stock: 10,
    minStock: 1,
    producer: { id: 'producer-1', name: 'Ferme des Lilas' },
    categoryId: 'cat-1',
    unit: 'KG',
    content: null,
    referencePrice: { amount: price, unit: 'kg' },
});

describe('CartComponent', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    const createComponent = async () => {
        TestBed.configureTestingModule({
            imports: [CartComponent],
            providers: [provideRouter([])],
        });
        const fixture = TestBed.createComponent(CartComponent);
        const cart = TestBed.inject(CartService);
        await fixture.whenStable();
        const element = fixture.nativeElement as HTMLElement;
        return { fixture, cart, element };
    };

    it('affiche le panier vide', async () => {
        const { element } = await createComponent();

        expect(element.textContent).toContain('Votre panier est tristement vide');
        expect(element.textContent).toContain('No items in cart');
        expect(element.querySelector('.btn-primary')).toBeNull();
    });

    it('affiche les produits du panier et le récapitulatif', async () => {
        const { fixture, cart, element } = await createComponent();

        cart.addToCart(product('p-1', 10), 2);
        cart.addToCart(product('p-2', 5));
        await fixture.whenStable();

        expect(element.querySelectorAll('app-cart-list .card')).toHaveLength(2);
        expect(element.textContent).toContain('Produit p-1');
        expect(element.textContent).toContain('Produit p-2');
        expect(element.textContent).toContain('Items (3)');
        expect(element.textContent).not.toContain('Votre panier est tristement vide');
    });

    it('retire un produit avec le bouton de suppression', async () => {
        const { fixture, cart, element } = await createComponent();
        cart.addToCart(product('p-1', 10));
        await fixture.whenStable();

        element.querySelector<HTMLButtonElement>('button[aria-label="Remove item"]')?.click();
        await fixture.whenStable();

        expect(cart.isEmpty()).toBe(true);
        expect(element.textContent).toContain('Votre panier est tristement vide');
    });

    it('vide le panier avec le bouton "Clear Cart"', async () => {
        const { fixture, cart, element } = await createComponent();
        const notifications = TestBed.inject(NotificationService);
        cart.addToCart(product('p-1', 10));
        cart.addToCart(product('p-2', 5));
        await fixture.whenStable();

        const clearButton = [...element.querySelectorAll<HTMLButtonElement>('button')].find((b) =>
            b.textContent?.includes('Clear Cart'),
        );
        expect(clearButton).toBeDefined();
        clearButton?.click();
        await fixture.whenStable();

        expect(cart.isEmpty()).toBe(true);
        expect(notifications.notifications().map((n) => n.message)).toContain(
            'Cart cleared successfully!',
        );
    });
});
