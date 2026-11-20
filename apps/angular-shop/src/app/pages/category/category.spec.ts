import type { CategoryResponseDto } from '@fpm/contracts';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, type ParamMap } from '@angular/router';
import { NotificationService } from '../../services/notification.service';
import { environment } from '../../../environments/environment';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { Category } from './category';

const FRUITS: CategoryResponseDto = {
    id: 'cat-1',
    name: 'Fruits & Légumes',
    slug: 'fruits-legumes',
};
const VIANDES: CategoryResponseDto = { id: 'cat-2', name: 'Viandes', slug: 'viandes' };

describe('Category', () => {
    let paramMap: BehaviorSubject<ParamMap>;
    let http: HttpTestingController;
    const categories = [FRUITS, VIANDES];
    const notificationService = { showError: vi.fn() };

    const categoryUrl = (slug: string) => `${environment.apiUrl}/categories/slug/${slug}`;
    const isProductsOf = (categoryId: string) => (req: { url: string; params: { get(name: string): string | null } }) =>
        req.url === `${environment.apiUrl}/products` && req.params.get('categoryId') === categoryId;

    /** Répond comme l'API : la catégorie si le slug existe, 404 sinon. */
    const flushCategory = (slug: string) => {
        const category = categories.find((c) => c.slug === slug);
        const request = http.expectOne(categoryUrl(slug));
        if (category) {
            request.flush({ success: true, data: category });
        } else {
            request.flush({ success: false }, { status: 404, statusText: 'Not Found' });
        }
    };

    const createComponent = async (slug: string | null) => {
        paramMap = new BehaviorSubject(convertToParamMap(slug ? { slug } : {}));
        TestBed.configureTestingModule({
            imports: [Category],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                { provide: ActivatedRoute, useValue: { paramMap } },
                { provide: NotificationService, useValue: notificationService },
            ],
        });
        http = TestBed.inject(HttpTestingController);
        const fixture = TestBed.createComponent(Category);
        fixture.detectChanges();
        return fixture;
    };

    /**
     * Laisse la ressource traiter la réponse, puis Products lancer sa requête.
     * Pas de `whenStable()` : il attendrait la requête des produits, laissée en attente exprès.
     */
    const settle = async (fixture: { detectChanges(): void }) => {
        await new Promise((resolve) => setTimeout(resolve));
        fixture.detectChanges();
        TestBed.tick();
    };

    beforeEach(() => notificationService.showError.mockClear());

    afterEach(() => http.verify());

    it("résout le slug de l'URL en catégorie et la passe à Products", async () => {
        const fixture = await createComponent('fruits-legumes');
        expect(fixture.componentInstance.isLoading()).toBe(true);

        flushCategory('fruits-legumes');
        await settle(fixture);

        expect(fixture.componentInstance.category()).toEqual(FRUITS);
        http.expectOne(isProductsOf('cat-1'));
    });

    it('recharge la catégorie quand le slug change', async () => {
        const fixture = await createComponent('fruits-legumes');
        flushCategory('fruits-legumes');
        await settle(fixture);
        http.expectOne(isProductsOf('cat-1')).flush({ success: true, data: [] });

        paramMap.next(convertToParamMap({ slug: 'viandes' }));
        await settle(fixture);
        flushCategory('viandes');
        await settle(fixture);

        expect(fixture.componentInstance.category()).toEqual(VIANDES);
        http.expectOne(isProductsOf('cat-2'));
    });

    it("n'affiche aucune catégorie si le slug est inconnu", async () => {
        const fixture = await createComponent('inconnue');

        flushCategory('inconnue');
        await settle(fixture);

        expect(fixture.componentInstance.category()).toBeNull();
        expect(fixture.componentInstance.error()).toBe('Une erreur est survenue.');
        expect(notificationService.showError).toHaveBeenCalledWith('Une erreur est survenue.');
        http.expectNone((req) => req.url === `${environment.apiUrl}/products`);
    });

    it("n'appelle pas l'API sans slug", async () => {
        const fixture = await createComponent(null);
        await settle(fixture);

        http.expectNone(() => true);
        expect(fixture.componentInstance.category()).toBeNull();
    });
});
