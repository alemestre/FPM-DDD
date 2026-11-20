import type { CategoryResponseDto, ProductWithProducerResponseDto } from '@fpm/contracts';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { NotificationService } from '../../../services/notification.service';
import { environment } from '../../../../environments/environment';
import { CategoryProducts } from './category-products.component';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

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
    isAvailable: true,
    image: 'https://example.com/produit.jpg',
});

describe('Products', () => {
    const productsByCategory: Record<string, ProductWithProducerResponseDto[]> = {
        'cat-1': [product('p-1', 'cat-1'), product('p-2', 'cat-1')],
        'cat-2': [product('p-3', 'cat-2')],
    };
    const notificationService = { showError: vi.fn() };
    let http: HttpTestingController;

    /** Répond à la requête des produits de `categoryId` avec les produits de cette catégorie. */
    const flushProducts = (categoryId: string) =>
        http
            .expectOne(
                (req) =>
                    req.url === `${environment.apiUrl}/products` &&
                    req.params.get('categoryId') === categoryId,
            )
            .flush({ success: true, data: productsByCategory[categoryId] ?? [] });

    const createComponent = (category: CategoryResponseDto) => {
        TestBed.configureTestingModule({
            imports: [CategoryProducts],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                { provide: NotificationService, useValue: notificationService },
            ],
        });
        http = TestBed.inject(HttpTestingController);
        const fixture = TestBed.createComponent(CategoryProducts);
        fixture.componentRef.setInput('category', category);
        fixture.detectChanges();
        return fixture;
    };

    beforeEach(() => notificationService.showError.mockClear());

    afterEach(() => http.verify());

    it('charge les produits de la catégorie reçue en input', async () => {
        const fixture = createComponent(FRUITS);
        const component = fixture.componentInstance;
        expect(component.isLoading()).toBe(true);

        flushProducts('cat-1');
        await fixture.whenStable();

        expect(component.products().map((p) => p.id)).toEqual(['p-1', 'p-2']);
        expect(component.hasProducts()).toBe(true);
        expect(component.isLoading()).toBe(false);
    });

    it('recharge les produits quand la catégorie change', async () => {
        const fixture = createComponent(FRUITS);
        flushProducts('cat-1');
        await fixture.whenStable();

        fixture.componentRef.setInput('category', VIANDES);
        fixture.detectChanges();
        flushProducts('cat-2');
        await fixture.whenStable();

        expect(fixture.componentInstance.products().map((p) => p.id)).toEqual(['p-3']);
    });

    it("n'a aucun produit si la catégorie est vide", async () => {
        const fixture = createComponent(VIDE);
        flushProducts('cat-3');
        await fixture.whenStable();

        expect(fixture.componentInstance.products()).toEqual([]);
        expect(fixture.componentInstance.hasProducts()).toBe(false);
    });

    it("affiche une erreur si l'API échoue", async () => {
        const fixture = createComponent(FRUITS);
        http
            .expectOne((req) => req.url === `${environment.apiUrl}/products`)
            .flush('boom', { status: 500, statusText: 'Server Error' });
        await fixture.whenStable();

        expect(fixture.componentInstance.products()).toEqual([]);
        expect(fixture.componentInstance.error()).toBe('Une erreur est survenue.');
        expect(notificationService.showError).toHaveBeenCalledWith('Une erreur est survenue.');
    });
});
