import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { checkoutHarness, ORDER, PRODUCT, saveCart } from '../../../checkout.testing';
import { environment } from '../../../../../../environments/environment';
import { CheckoutAuthenticated } from './checkout-authenticated';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';

const PROFILE_URL = `${environment.apiUrl}/customers/me`;
const ORDERS_URL = `${environment.apiUrl}/orders`;

const profile = {
    id: '3f0c9a52-8a6e-4c1b-9d57-2b1e7f4a6c10',
    email: 'marie@example.fr',
    firstName: 'Marie',
    lastName: 'Durand',
    phone: '+33612345678',
    address: { line1: '1 rue des Lilas', line2: '', postalCode: '29000', city: 'Quimper' },
};

describe('CheckoutAuthenticated', () => {
    let fixture: ComponentFixture<CheckoutAuthenticated>;
    let http: HttpTestingController;
    let navigate: ReturnType<typeof vi.spyOn>;
    const page = checkoutHarness(() => fixture);

    const createComponent = async () => {
        TestBed.configureTestingModule({
            imports: [CheckoutAuthenticated],
            providers: [
                provideRouter([{ path: '**', children: [] }]),
                provideHttpClient(),
                provideHttpClientTesting(),
            ],
        });
        http = TestBed.inject(HttpTestingController);
        navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
        fixture = TestBed.createComponent(CheckoutAuthenticated);
        await page.settle();
    };

    const createWithProfile = async () => {
        await createComponent();
        http.expectOne(PROFILE_URL).flush({ success: true, data: profile });
        await page.settle();
    };

    beforeEach(() => {
        localStorage.clear();
        saveCart();
    });

    afterEach(() => http.verify());

    it("reprend le contact et l'adresse du compte, sans champ à saisir", async () => {
        await createWithProfile();

        expect(page.text()).toContain('Marie Durand');
        expect(page.text()).toContain('marie@example.fr');
        expect(page.text()).toContain('1 rue des Lilas');
        expect(page.text()).toContain('29000 Quimper');
        expect(page.element().querySelector('input')).toBeNull();
    });

    it("enregistre la commande avec l'adresse du compte", async () => {
        await createWithProfile();

        await page.submit();

        const request = http.expectOne(ORDERS_URL);
        expect(request.request.body).toEqual({
            items: [{ productId: PRODUCT.id, quantity: 2 }],
            billingAddress: {
                line1: '1 rue des Lilas',
                line2: '',
                postalCode: '29000',
                city: 'Quimper',
            },
        });
        request.flush({ success: true, data: ORDER });
        await page.settle();

        expect(navigate).toHaveBeenCalledWith('/checkout/confirmation');
    });

    it("envoie l'adresse modifiée avec la commande sans mettre à jour le profil", async () => {
        await createWithProfile();

        page.button('Modifier')?.click();
        await page.settle();
        expect(page.text()).toContain("l'adresse de votre compte ne change pas");

        await page.fill({ line1: '2 quai Est', postalCode: '29200', city: 'Brest' });
        await page.submit();

        const request = http.expectOne(ORDERS_URL);
        expect(request.request.body.billingAddress).toEqual({
            line1: '2 quai Est',
            line2: '',
            postalCode: '29200',
            city: 'Brest',
        });
        request.flush({ success: true, data: ORDER });
        await page.settle();
        // Aucun PATCH /customers/me : http.verify() échouerait sur une requête inattendue.
    });

    it("bloque la commande si le profil n'a pas pu être chargé", async () => {
        await createComponent();
        http.expectOne(PROFILE_URL).flush(null, { status: 500, statusText: 'Server Error' });
        await page.settle();

        expect(page.text()).toContain("Impossible de charger l'adresse de votre compte");
        expect(page.button('Procéder au paiement')?.disabled).toBe(true);
    });
});
