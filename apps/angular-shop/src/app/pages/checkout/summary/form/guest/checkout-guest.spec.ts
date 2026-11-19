import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CheckoutSessionService } from '../../../../../services/checkout-session.service';
import { checkoutHarness, ORDER, PRODUCT, saveCart } from '../../../checkout.testing';
import { environment } from '../../../../../../environments/environment';
import { CartService } from '../../../../../services/cart.service';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { CheckoutGuest } from './checkout-guest';

const GUEST_ORDERS_URL = `${environment.apiUrl}/orders/guest`;

describe('CheckoutGuest', () => {
    let fixture: ComponentFixture<CheckoutGuest>;
    let http: HttpTestingController;
    let navigate: ReturnType<typeof vi.spyOn>;
    const page = checkoutHarness(() => fixture);

    const createComponent = async () => {
        TestBed.configureTestingModule({
            imports: [CheckoutGuest],
            providers: [
                provideRouter([{ path: '**', children: [] }]),
                provideHttpClient(),
                provideHttpClientTesting(),
            ],
        });
        http = TestBed.inject(HttpTestingController);
        navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
        fixture = TestBed.createComponent(CheckoutGuest);
        await page.settle();
    };

    const validGuest = {
        firstName: 'Paul',
        lastName: 'Martin',
        email: 'paul@example.fr',
        phone: '06 98 76 54 32',
        line1: ' 2 quai Est ',
        postalCode: '29200',
        city: 'Brest',
    };

    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
        saveCart();
    });

    afterEach(() => http.verify());

    it('précise le retrait en magasin, la date indicative et le paiement en magasin', async () => {
        await createComponent();

        expect(page.text()).toContain("La livraison n'est pas disponible");
        expect(page.text()).toContain('jeudi, le vendredi ou le samedi');
        expect(page.text()).toContain('à titre indicatif');
        expect(page.text()).toContain('Paiement en magasin lors du retrait');
    });

    it("demande le contact et l'adresse, puis enregistre la commande", async () => {
        await createComponent();

        await page.fill(validGuest);
        await page.submit();

        const request = http.expectOne(GUEST_ORDERS_URL);
        expect(request.request.method).toBe('POST');
        expect(request.request.body).toEqual({
            items: [{ productId: PRODUCT.id, quantity: 2 }],
            billingAddress: { line1: '2 quai Est', line2: '', postalCode: '29200', city: 'Brest' },
            contact: {
                firstName: 'Paul',
                lastName: 'Martin',
                email: 'paul@example.fr',
                phone: '06 98 76 54 32',
            },
        });
        request.flush({ success: true, data: ORDER });
        await page.settle();

        expect(TestBed.inject(CheckoutSessionService).lastOrder()).toEqual(ORDER);
        expect(navigate).toHaveBeenCalledWith('/checkout/confirmation');
        expect(TestBed.inject(CartService).isEmpty()).toBe(true);
    });

    it("n'envoie rien tant que le formulaire est invalide", async () => {
        await createComponent();

        await page.fill({ firstName: 'Paul', email: 'paul', postalCode: '29' });
        await page.submit();

        http.expectNone(GUEST_ORDERS_URL);
        expect(page.text()).toContain("L'adresse e-mail n'est pas valide.");
        expect(page.text()).toContain('Le code postal doit contenir 5 chiffres.');
        expect(page.text()).toContain('Le nom est obligatoire.');
    });

    it("affiche le refus de l'API sans vider le panier", async () => {
        await createComponent();
        await page.fill(validGuest);
        await page.submit();

        http.expectOne(GUEST_ORDERS_URL).flush(
            { message: 'Le produit "Farine de blé" n\'est plus disponible' },
            { status: 400, statusText: 'Bad Request' },
        );
        await page.settle();

        expect(page.text()).toContain("n'est plus disponible");
        expect(TestBed.inject(CartService).isEmpty()).toBe(false);
        expect(navigate).not.toHaveBeenCalledWith('/checkout/confirmation');
    });

    it("propose de revenir à l'identification pour se connecter", async () => {
        await createComponent();

        const link = page.element().querySelector<HTMLAnchorElement>('a[href="/checkout/identification"]');
        expect(link?.textContent).toContain('Se connecter');
    });

    it('renvoie au panier quand il est vide', async () => {
        localStorage.clear();
        await createComponent();

        expect(navigate).toHaveBeenCalledWith('/panier');
    });
});
