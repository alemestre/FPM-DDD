import type { CategoryResponseDto } from '@fpm/contracts';
import { CategoriesService } from '../../services/categories.service';
import { ProductsService } from '../../services/products.service';
import { ActivatedRoute, convertToParamMap, type ParamMap } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { Category } from './category';

const FRUITS: CategoryResponseDto = {
    id: 'cat-1',
    name: 'Fruits & Légumes',
    slug: 'fruits-legumes',
};
const VIANDES: CategoryResponseDto = { id: 'cat-2', name: 'Viandes', slug: 'viandes' };

describe('Category', () => {
    let paramMap: BehaviorSubject<ParamMap>;
    const categories = [FRUITS, VIANDES];
    const categoriesService = {
        getCategoryBySlug: vi.fn((slug: string) => {
            const category = categories.find((c) => c.slug === slug);
            return category ? of(category) : throwError(() => new Error('404'));
        }),
    };
    const productsService = {
        getProductsByCategoryId: vi.fn(() => of([])),
    };

    const createComponent = async (slug: string | null) => {
        paramMap = new BehaviorSubject(convertToParamMap(slug ? { slug } : {}));
        TestBed.configureTestingModule({
            imports: [Category],
            providers: [
                { provide: ActivatedRoute, useValue: { paramMap } },
                { provide: CategoriesService, useValue: categoriesService },
                { provide: ProductsService, useValue: productsService },
            ],
        });
        const fixture = TestBed.createComponent(Category);
        await fixture.whenStable();
        return fixture;
    };

    beforeEach(() => {
        categoriesService.getCategoryBySlug.mockClear();
        productsService.getProductsByCategoryId.mockClear();
    });

    it("résout le slug de l'URL en catégorie et la passe à Products", async () => {
        const fixture = await createComponent('fruits-legumes');

        expect(categoriesService.getCategoryBySlug).toHaveBeenCalledWith('fruits-legumes');
        expect(fixture.componentInstance.category()).toEqual(FRUITS);
        expect(productsService.getProductsByCategoryId).toHaveBeenCalledWith('cat-1');
    });

    it('recharge la catégorie quand le slug change', async () => {
        const fixture = await createComponent('fruits-legumes');

        paramMap.next(convertToParamMap({ slug: 'viandes' }));
        await fixture.whenStable();

        expect(fixture.componentInstance.category()).toEqual(VIANDES);
        expect(productsService.getProductsByCategoryId).toHaveBeenLastCalledWith('cat-2');
    });

    it("n'affiche aucune catégorie si le slug est inconnu", async () => {
        const fixture = await createComponent('inconnue');

        expect(fixture.componentInstance.category()).toBeNull();
        expect(fixture.componentInstance.error()).toBe('404');
        expect(productsService.getProductsByCategoryId).not.toHaveBeenCalled();
    });

    it("n'appelle pas l'API sans slug", async () => {
        const fixture = await createComponent(null);

        expect(categoriesService.getCategoryBySlug).not.toHaveBeenCalled();
        expect(fixture.componentInstance.category()).toBeNull();
    });
});
