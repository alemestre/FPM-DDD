import type { ProductWithProducerResponseDto } from '@fpm/contracts';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';
import { provideRouter } from '@angular/router';
import { CartService } from '../../services/cart.service';
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
    isAvailable: true,
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
        expect(element.textContent).toContain('Aucun article dans votre panier');
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
        expect(element.textContent).toContain('(3) articles');
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

    it('vide le panier avec le bouton "Vider le panier"', async () => {
        const { fixture, cart, element } = await createComponent();
        cart.addToCart(product('p-1', 10));
        cart.addToCart(product('p-2', 5));
        await fixture.whenStable();

        const clearButton = [...element.querySelectorAll<HTMLButtonElement>('button')].find((b) =>
            b.textContent?.includes('Vider le panier'),
        );
        expect(clearButton).toBeDefined();
        clearButton?.click();
        await fixture.whenStable();

        expect(cart.isEmpty()).toBe(true);
        expect(element.textContent).toContain('Votre panier est tristement vide');
    });
});

describe('CartComponent : saisie de la quantité', () => {
    beforeEach(() => localStorage.clear());

    const createComponent = async (connected: boolean) => {
        TestBed.configureTestingModule({
            imports: [CartComponent],
            providers: [
                provideRouter([]),
                provideHttpClient(),
                provideHttpClientTesting(),
                { provide: AuthService, useValue: { isConnected: signal(connected) } },
            ],
        });
        const fixture = TestBed.createComponent(CartComponent);
        await fixture.whenStable();
        const element = fixture.nativeElement as HTMLElement;
        return {
            fixture,
            cart: TestBed.inject(CartService),
            http: TestBed.inject(HttpTestingController),
            quantityInput: () => element.querySelector<HTMLInputElement>('#quantity-p-1'),
        };
    };

    const type = (input: HTMLInputElement | null, value: string) => {
        if (!input) throw new Error('champ quantité introuvable');
        input.value = value;
        input.dispatchEvent(new Event('change'));
    };

    it('invité : affiche la nouvelle quantité quand elle est acceptée', async () => {
        const { fixture, cart, quantityInput } = await createComponent(false);
        cart.addToCart(product('p-1', 10), 2);
        await fixture.whenStable();

        type(quantityInput(), '5');
        await fixture.whenStable();

        expect(cart.items()[0].quantity).toBe(5);
        expect(quantityInput()?.value).toBe('5');
    });

    it('invité : revient à la quantité du panier au-delà de la limite', async () => {
        const { fixture, cart, quantityInput } = await createComponent(false);
        cart.addToCart(product('p-1', 10), 2);
        await fixture.whenStable();

        type(quantityInput(), '11');
        await fixture.whenStable();

        expect(cart.items()[0].quantity).toBe(2);
        expect(quantityInput()?.value).toBe('2');
    });

    it("connecté : revient à la quantité du panier quand l'API refuse (stock)", async () => {
        const { fixture, http, quantityInput } = await createComponent(true);
        http.expectOne(`${environment.apiUrl}/cart`).flush({
            success: true,
            data: { items: [{ product: product('p-1', 10), quantity: 2 }] },
        });
        await fixture.whenStable();

        type(quantityInput(), '8');
        http.expectOne(`${environment.apiUrl}/cart/items/p-1`).flush(
            { message: 'Stock insuffisant pour "Produit p-1" : 4 disponible(s)' },
            { status: 400, statusText: 'Bad Request' },
        );
        await fixture.whenStable();

        expect(quantityInput()?.value).toBe('2');
        http.verify();
    });

    it("connecté : affiche la quantité renvoyée par l'API quand elle est acceptée", async () => {
        const { fixture, http, quantityInput } = await createComponent(true);
        http.expectOne(`${environment.apiUrl}/cart`).flush({
            success: true,
            data: { items: [{ product: product('p-1', 10), quantity: 2 }] },
        });
        await fixture.whenStable();

        type(quantityInput(), '4');
        http.expectOne(`${environment.apiUrl}/cart/items/p-1`).flush({
            success: true,
            data: { items: [{ product: product('p-1', 10), quantity: 4 }] },
        });
        await fixture.whenStable();

        expect(quantityInput()?.value).toBe('4');
        http.verify();
    });
});
