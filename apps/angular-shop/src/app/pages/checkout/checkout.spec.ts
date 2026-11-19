import { AuthService } from '../../services/auth.service';
import { checkoutHarness, saveCart } from './checkout.testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { CheckoutSummary } from './summary/checkout-summary';

describe('Checkout', () => {
    let fixture: ComponentFixture<CheckoutSummary>;
    const page = checkoutHarness(() => fixture);

    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
        saveCart();
    });

    it('affiche le panier en lecture seule, sans « Passer au paiement » ni « Vider le panier »', async () => {
        TestBed.configureTestingModule({
            imports: [CheckoutSummary],
            providers: [
                provideRouter([{ path: '**', children: [] }]),
                provideHttpClient(),
                provideHttpClientTesting(),
                { provide: AuthService, useValue: { isConnected: signal(false) } },
            ],
        });
        fixture = TestBed.createComponent(CheckoutSummary);
        await page.settle();

        expect(page.text()).toContain('Farine de blé');
        expect(page.element().querySelector('input[type="number"]')).toBeNull();
        expect(page.element().querySelector('button[aria-label="Remove item"]')).toBeNull();
        expect(page.text()).not.toContain('Passer au paiement');
        expect(page.text()).not.toContain('Vider le panier');
        expect(page.text()).toContain('Procéder au paiement');
    });
});
