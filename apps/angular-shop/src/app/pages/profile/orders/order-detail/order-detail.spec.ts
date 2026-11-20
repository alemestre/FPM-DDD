import type { OrderResponseDto, OrderStatusDto } from '@fpm/contracts';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { environment } from '../../../../../environments/environment';
import { OrderAgainService } from '../../../../services/order-again.service';
import { OrderDetail } from './order-detail';

registerLocaleData(localeFr, 'fr-FR');

const ORDER_ID = '12345678-1234-4123-8123-123456789abc';

const order = (status: OrderStatusDto): OrderResponseDto => ({
    id: ORDER_ID,
    number: '2026-11-7',
    status,
    isModified: false,
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
            confirmedQuantity: 2,
            total: 5.28,
        },
    ],
    subtotal: 5,
    tax: 0.28,
    total: 5.28,
});

describe('OrderDetail', () => {
    const orderAgain = vi.fn().mockResolvedValue(undefined);

    const render = async (status: OrderStatusDto) => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                provideRouter([{ path: 'profil/commandes/:id', component: OrderDetail }]),
                { provide: LOCALE_ID, useValue: 'fr-FR' },
                { provide: OrderAgainService, useValue: { orderAgain } },
            ],
        });
        const harness = await RouterTestingHarness.create(`/profil/commandes/${ORDER_ID}`);
        TestBed.inject(HttpTestingController)
            .expectOne(`${environment.apiUrl}/orders/${ORDER_ID}`)
            .flush({ success: true, data: order(status) });
        await harness.fixture.whenStable();
        harness.detectChanges();
        const element = harness.routeNativeElement as HTMLElement;
        const button = () =>
            [...element.querySelectorAll('button')].find((candidate) =>
                candidate.textContent?.includes('Commander à'),
            );
        return { harness, button };
    };

    afterEach(() => orderAgain.mockClear());

    it('ne propose pas de commander à nouveau une commande en cours', async () => {
        const { button } = await render('READY');

        expect(button()).toBeUndefined();
    });

    it('propose de commander à nouveau une commande retirée et la remet dans le panier au clic', async () => {
        const { button, harness } = await render('COMPLETED');

        button()?.click();
        await harness.fixture.whenStable();

        expect(orderAgain).toHaveBeenCalledWith(expect.objectContaining({ id: ORDER_ID }));
    });
});
