import { CheckoutSessionService } from '../../../services/checkout-session.service';
import type { OrderResponseDto } from '@fpm/contracts';
import { provideRouter, Router } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { LOCALE_ID } from '@angular/core';
import { Confirmation } from './confirmation';

registerLocaleData(localeFr, 'fr-FR');

const order: OrderResponseDto = {
    id: '12345678-1234-4123-8123-123456789abc',
    number: '2026-11-7',
    status: 'REGISTERED',
    createdAt: '2026-11-16T11:00:00.000Z',
    estimatedPickupDate: '2026-11-19',
    contact: {
        firstName: 'Paul',
        lastName: 'Martin',
        email: 'paul@example.fr',
        phone: '+33698765432',
    },
    billingAddress: { line1: '2 quai Est', line2: '', postalCode: '29200', city: 'Brest' },
    items: [
        {
            productId: 'a3bb189e-8bf9-4888-9912-ace4e6543002',
            productName: 'Farine de blé',
            unitPrice: 2.5,
            vatRate: 5.5,
            quantity: 2,
            total: 5.28,
        },
    ],
    subtotal: 5,
    tax: 0.28,
    total: 5.28,
};

describe('Confirmation', () => {
    const createComponent = async (lastOrder: OrderResponseDto | null) => {
        TestBed.configureTestingModule({
            imports: [Confirmation],
            providers: [provideRouter([{ path: '**', children: [] }]), { provide: LOCALE_ID, useValue: 'fr-FR' }],
        });
        if (lastOrder) TestBed.inject(CheckoutSessionService).completeOrder(lastOrder);
        const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
        const fixture = TestBed.createComponent(Confirmation);
        await fixture.whenStable();
        return { navigate, text: (fixture.nativeElement as HTMLElement).textContent ?? '' };
    };

    it('affiche la commande enregistrée, la date de retrait et le paiement en magasin', async () => {
        const { text } = await createComponent(order);

        expect(text).toContain('Commande n° 2026-11-7 enregistrée');
        expect(text).toContain('paul@example.fr');
        expect(text).toContain('Farine de blé × 2');
        expect(text).toContain('5,28');
        expect(text).toContain('jeudi 19 novembre 2026');
        expect(text).toContain('Le paiement se fera en magasin lors du retrait.');
        expect(text).toContain('29200 Brest');
    });

    it("renvoie à l'accueil sans commande en mémoire", async () => {
        const { navigate } = await createComponent(null);

        expect(navigate).toHaveBeenCalledWith('/home');
    });
});
