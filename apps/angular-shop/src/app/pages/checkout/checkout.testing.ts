import type { OrderResponseDto, ProductWithProducerResponseDto } from '@fpm/contracts';
import type { ComponentFixture } from '@angular/core/testing';

/** Données et aides partagées par les tests des deux checkouts. */
export const PRODUCT: ProductWithProducerResponseDto = {
    id: 'a3bb189e-8bf9-4888-9912-ace4e6543002',
    name: 'Farine de blé',
    image: 'https://example.com/farine.jpg',
    price: 2.5,
    vatRate: 5.5,
    stock: 10,
    minStock: 1,
    producer: { id: 'producer-1', name: 'Moulin des Lilas' },
    categoryId: 'cat-1',
    unit: 'KG',
    content: null,
    referencePrice: { amount: 2.5, unit: 'kg' },
    isAvailable: true,
};

export const ORDER = { id: 'o-1', number: '2026-11-1' } as OrderResponseDto;

/** Panier enregistré avant la création du composant : il est restauré au premier rendu. */
export function saveCart(quantity = 2): void {
    localStorage.setItem('fpm_cart', JSON.stringify([{ product: PRODUCT, quantity }]));
}

export function checkoutHarness<T>(fixture: () => ComponentFixture<T>) {
    const element = () => fixture().nativeElement as HTMLElement;
    const settle = async () => {
        await fixture().whenStable();
        fixture().detectChanges();
    };

    return {
        element,
        text: () => element().textContent ?? '',
        settle,
        async fill(values: Record<string, string>) {
            for (const [key, value] of Object.entries(values)) {
                const input = element().querySelector<HTMLInputElement>(`#checkout-${key}`);
                if (!input) throw new Error(`Champ ${key} absent`);
                input.value = value;
                input.dispatchEvent(new Event('input'));
            }
            await settle();
        },
        async submit() {
            element().querySelector('form')?.dispatchEvent(new Event('submit'));
            await settle();
        },
        button: (label: string) =>
            [...element().querySelectorAll('button')].find((button) =>
                button.textContent?.includes(label),
            ),
    };
}
