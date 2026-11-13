import type { CategoryResponseDto, ProductWithProducerResponseDto } from '@fpm/contracts';
import { ProductsService } from '../../../services/products.service';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Products } from './products';

const FRUITS: CategoryResponseDto = {
    id: 'cat-1',
    name: 'Fruits & Légumes',
    slug: 'fruits-legumes',
};
const VIANDES: CategoryResponseDto = { id: 'cat-2', name: 'Viandes', slug: 'viandes' };
const VIDE: CategoryResponseDto = { id: 'cat-3', name: 'Vide', slug: 'vide' };

const product = (id: string, categoryId: string): ProductWithProducerResponseDto => ({
    id,
    name: `Produit ${id}`,
    price: 2.5,
    vatRate: 5.5,
    stock: 10,
    minStock: 1,
    producer: { id: 'producer-1', name: 'Ferme des Lilas' },
    categoryId,
    unit: 'KG',
    content: null,
    referencePrice: { amount: 2.5, unit: 'kg' },
    image: 'https://example.com/produit.jpg',
});

describe('Products', () => {
    const productsByCategory: Record<string, ProductWithProducerResponseDto[]> = {
        'cat-1': [product('p-1', 'cat-1'), product('p-2', 'cat-1')],
        'cat-2': [product('p-3', 'cat-2')],
    };
    const productsService = {
        getProductsByCategoryId: vi.fn((categoryId: string) =>
            of(productsByCategory[categoryId] ?? []),
        ),
    };

    const createComponent = async (category: CategoryResponseDto) => {
        TestBed.configureTestingModule({
            imports: [Products],
            providers: [{ provide: ProductsService, useValue: productsService }],
        });
        const fixture = TestBed.createComponent(Products);
        fixture.componentRef.setInput('category', category);
        await fixture.whenStable();
        return fixture;
    };

    beforeEach(() => {
        productsService.getProductsByCategoryId.mockClear();
    });

    it('charge les produits de la catégorie reçue en input', async () => {
        const fixture = await createComponent(FRUITS);
        const component = fixture.componentInstance;

        expect(productsService.getProductsByCategoryId).toHaveBeenCalledWith('cat-1');
        expect(component.products().map((p) => p.id)).toEqual(['p-1', 'p-2']);
        expect(component.hasProducts()).toBe(true);
        expect(component.isLoading()).toBe(false);
    });

    it('recharge les produits quand la catégorie change', async () => {
        const fixture = await createComponent(FRUITS);

        fixture.componentRef.setInput('category', VIANDES);
        await fixture.whenStable();

        expect(productsService.getProductsByCategoryId).toHaveBeenLastCalledWith('cat-2');
        expect(fixture.componentInstance.products().map((p) => p.id)).toEqual(['p-3']);
    });

    it("n'a aucun produit si la catégorie est vide", async () => {
        const fixture = await createComponent(VIDE);

        expect(fixture.componentInstance.products()).toEqual([]);
        expect(fixture.componentInstance.hasProducts()).toBe(false);
    });
});
