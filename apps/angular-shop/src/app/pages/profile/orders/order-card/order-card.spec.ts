import type { OrderResponseDto, OrderStatusDto } from '@fpm/contracts';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { OrderAgainService } from '../../../../services/order-again.service';
import { OrderCard } from './order-card';

registerLocaleData(localeFr, 'fr-FR');

const order = (status: OrderStatusDto): OrderResponseDto => ({
    id: '12345678-1234-4123-8123-123456789abc',
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
    items: [],
    subtotal: 0,
    tax: 0,
    total: 0,
});

describe('OrderCard', () => {
    const orderAgain = vi.fn().mockResolvedValue(undefined);

    const render = async (status: OrderStatusDto) => {
        TestBed.configureTestingModule({
            imports: [OrderCard],
            providers: [
                provideRouter([{ path: '**', children: [] }]),
                { provide: LOCALE_ID, useValue: 'fr-FR' },
                { provide: OrderAgainService, useValue: { orderAgain } },
            ],
        });
        const fixture = TestBed.createComponent(OrderCard);
        fixture.componentRef.setInput('order', order(status));
        await fixture.whenStable();
        const element = fixture.nativeElement as HTMLElement;
        const button = () =>
            [...element.querySelectorAll('button')].find((candidate) =>
                candidate.textContent?.includes('Commander à nouveau'),
            );
        return { fixture, button };
    };

    afterEach(() => orderAgain.mockClear());

    it.each<OrderStatusDto>(['PENDING', 'PREPARING', 'READY'])(
        'ne propose pas de commander à nouveau une commande %s, encore en cours',
        async (status) => {
            const { button } = await render(status);

            expect(button()).toBeUndefined();
        },
    );

    it.each<OrderStatusDto>(['COMPLETED', 'CANCELLED'])(
        'propose de commander à nouveau une commande %s, sous « Consulter »',
        async (status) => {
            const { button } = await render(status);

            expect(button()).toBeDefined();
            expect(button()?.getAttribute('aria-label')).toBe(
                'Commander à nouveau la commande n° 2026-11-7',
            );
        },
    );

    it('remet la commande dans le panier au clic', async () => {
        const { button, fixture } = await render('COMPLETED');

        button()?.click();
        await fixture.whenStable();

        expect(orderAgain).toHaveBeenCalledWith(
            expect.objectContaining({ id: order('COMPLETED').id }),
        );
    });

    it('désactive le bouton pendant la reprise de la commande', async () => {
        let finish!: () => void;
        orderAgain.mockReturnValueOnce(new Promise<void>((resolve) => (finish = resolve)));
        const { button, fixture } = await render('COMPLETED');

        button()?.click();
        fixture.detectChanges();
        expect(button()?.disabled).toBe(true);

        finish();
        await fixture.whenStable();
        fixture.detectChanges();
        expect(button()?.disabled).toBe(false);
    });
});
