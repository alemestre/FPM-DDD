import type { ProductWithProducerResponseDto } from '@fpm/contracts';
import { TestBed } from '@angular/core/testing';
import { ProductCard } from './product-card';

const product = (
    overrides: Partial<ProductWithProducerResponseDto> = {},
): ProductWithProducerResponseDto => ({
    id: 'p-1',
    name: 'Pommes',
    price: 3.2,
    vatRate: 5.5,
    stock: 10,
    minStock: 1,
    producer: { id: 'producer-1', name: 'Ferme des Lilas' },
    categoryId: 'cat-1',
    image: 'https://example.com/pommes.jpg',
    unit: 'KG',
    content: null,
    referencePrice: { amount: 3.2, unit: 'kg' },
    ...overrides,
});

// Intl sépare les milliers et la devise par des espaces insécables : on les normalise.
const text = (element: HTMLElement) => (element.textContent ?? '').replace(/\s+/g, ' ').trim();

describe('ProductCard', () => {
    const render = (value: ProductWithProducerResponseDto) => {
        const fixture = TestBed.createComponent(ProductCard);
        fixture.componentRef.setInput('product', value);
        fixture.detectChanges();
        return text(fixture.nativeElement as HTMLElement);
    };

    it('affiche le prix au kilo sans le répéter en prix de référence', () => {
        const rendered = render(product());

        expect(rendered).toContain('3,20 € / kg');
        expect(rendered).not.toContain('soit');
    });

    it('affiche le contenu et le prix au kilo d’un lot de 4 pots', () => {
        const rendered = render(
            product({
                price: 3,
                unit: 'LOT',
                content: { itemCount: 4, itemSize: { amount: 125, unit: 'g' } },
                referencePrice: { amount: 6, unit: 'kg' },
            }),
        );

        expect(rendered).toContain('4 × 125 g');
        expect(rendered).toContain('3,00 € / lot');
        expect(rendered).toContain('soit 6,00 €/kg');
    });

    it('affiche une bouteille avec sa contenance seule', () => {
        const rendered = render(
            product({
                price: 9,
                unit: 'BOUTEILLE',
                content: { itemCount: 1, itemSize: { amount: 0.75, unit: 'l' } },
                referencePrice: { amount: 12, unit: 'l' },
            }),
        );

        expect(rendered).toContain('0,75 l');
        expect(rendered).not.toContain('1 ×');
        expect(rendered).toContain('soit 12,00 €/l');
    });

    it("n'affiche pas les 12 articles d'une douzaine, l'unité le dit déjà", () => {
        const rendered = render(
            product({
                price: 4.8,
                unit: 'DOUZAINE',
                content: { itemCount: 12, itemSize: null },
                referencePrice: null,
            }),
        );

        expect(rendered).toContain('4,80 € / douzaine');
        expect(rendered).not.toContain('12 pièces');
        expect(rendered).not.toContain('soit');
    });

    it('affiche le nombre d’articles d’un lot sans mesure', () => {
        const rendered = render(
            product({
                unit: 'LOT',
                content: { itemCount: 6, itemSize: null },
                referencePrice: null,
            }),
        );

        expect(rendered).toContain('6 pièces');
    });
});
