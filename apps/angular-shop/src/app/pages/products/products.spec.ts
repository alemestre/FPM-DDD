import type { CategoryResponseDto, ProductWithProducerResponseDto } from '@fpm/contracts';
import { CategoriesService } from '../../services/categories.service';
import { ProductsService } from '../../services/products.service';
import { ActivatedRoute, convertToParamMap, type ParamMap } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { Products } from './products';

const FRUITS: CategoryResponseDto = {
    id: 'cat-1',
    name: 'Fruits & Légumes',
    slug: 'fruits-legumes',
};
const VIANDES: CategoryResponseDto = { id: 'cat-2', name: 'Viandes', slug: 'viandes' };

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
});

describe('Products', () => {
    let paramMap: BehaviorSubject<ParamMap>;
    const categories = [FRUITS, VIANDES];
    const productsByCategory: Record<string, ProductWithProducerResponseDto[]> = {
        'cat-1': [product('p-1', 'cat-1'), product('p-2', 'cat-1')],
        'cat-2': [product('p-3', 'cat-2')],
    };
    const categoriesService = {
        getCategoryBySlug: vi.fn((slug: string) => {
            const category = categories.find((c) => c.slug === slug);
            return category ? of(category) : throwError(() => new Error('404'));
        }),
    };
    const productsService = {
        getProductsByCategoryId: vi.fn((categoryId: string) =>
            of(productsByCategory[categoryId] ?? []),
        ),
    };

    const createComponent = async (slug: string | null) => {
        paramMap = new BehaviorSubject(convertToParamMap(slug ? { slug } : {}));
        TestBed.configureTestingModule({
            imports: [Products],
            providers: [
                { provide: ActivatedRoute, useValue: { paramMap } },
                { provide: CategoriesService, useValue: categoriesService },
                { provide: ProductsService, useValue: productsService },
            ],
        });
        const fixture = TestBed.createComponent(Products);
        await fixture.whenStable();
        return fixture.componentInstance;
    };

    beforeEach(() => {
        categoriesService.getCategoryBySlug.mockClear();
        productsService.getProductsByCategoryId.mockClear();
    });

    it("résout le slug de l'URL en catégorie, puis charge ses produits par id", async () => {
        const component = await createComponent('fruits-legumes');

        expect(categoriesService.getCategoryBySlug).toHaveBeenCalledWith('fruits-legumes');
        expect(productsService.getProductsByCategoryId).toHaveBeenCalledWith('cat-1');
        expect(component.category()).toEqual(FRUITS);
        expect(component.products().map((p) => p.id)).toEqual(['p-1', 'p-2']);
        expect(component.hasProducts()).toBe(true);
    });

    it('recharge les produits quand le slug change', async () => {
        const component = await createComponent('fruits-legumes');

        paramMap.next(convertToParamMap({ slug: 'viandes' }));

        expect(productsService.getProductsByCategoryId).toHaveBeenLastCalledWith('cat-2');
        expect(component.category()).toEqual(VIANDES);
        expect(component.products().map((p) => p.id)).toEqual(['p-3']);
    });

    it("n'affiche aucune catégorie ni produit si le slug est inconnu", async () => {
        const component = await createComponent('inconnue');

        expect(productsService.getProductsByCategoryId).not.toHaveBeenCalled();
        expect(component.category()).toBeNull();
        expect(component.products()).toEqual([]);
        expect(component.hasProducts()).toBe(false);
    });

    it("n'appelle pas l'API sans slug", async () => {
        const component = await createComponent(null);

        expect(categoriesService.getCategoryBySlug).not.toHaveBeenCalled();
        expect(component.products()).toEqual([]);
    });
});
