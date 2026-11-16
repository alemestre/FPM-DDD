import type { ProductWithProducerResponseDto } from '@fpm/contracts';
import { ProductsService } from '../../services/products.service';
import { TestBed } from '@angular/core/testing';
import { Home, SEARCH_DEBOUNCE_MS } from './home';
import { of } from 'rxjs';

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
    isAvailable: true,
    ...overrides,
});

const products = [
    product({ id: 'p-1', name: 'Pommes' }),
    product({ id: 'p-2', name: 'Légumes de saison' }),
    product({ id: 'p-3', name: 'Œufs frais' }),
];

describe('Home', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        TestBed.configureTestingModule({
            imports: [Home],
            providers: [
                {
                    provide: ProductsService,
                    useValue: { getAvailableProducts: () => of(products) },
                },
            ],
        });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    const setup = () => {
        const fixture = TestBed.createComponent(Home);
        fixture.detectChanges();
        return fixture.componentInstance;
    };

    const search = (home: Home, term: string, wait = SEARCH_DEBOUNCE_MS) => {
        home.searchTerm.set(term);
        TestBed.tick();
        vi.advanceTimersByTime(wait);
        TestBed.tick();
    };

    const names = (home: Home) => home.filteredProducts().map((p) => p.name);

    it('affiche tous les produits sans recherche', () => {
        const home = setup();

        expect(names(home)).toEqual(['Pommes', 'Légumes de saison', 'Œufs frais']);
    });

    it('ne filtre pas avant 3 secondes après la dernière frappe', () => {
        const home = setup();

        search(home, 'pom', SEARCH_DEBOUNCE_MS - 1);

        expect(names(home)).toHaveLength(3);
    });

    it('filtre 3 secondes après la dernière frappe', () => {
        const home = setup();

        search(home, 'pom');

        expect(names(home)).toEqual(['Pommes']);
    });

    it('relance le délai à chaque frappe', () => {
        const home = setup();

        search(home, 'p', SEARCH_DEBOUNCE_MS - 1);
        search(home, 'po', SEARCH_DEBOUNCE_MS - 1);

        expect(names(home)).toHaveLength(3);

        vi.advanceTimersByTime(1);
        TestBed.tick();

        expect(names(home)).toEqual(['Pommes']);
    });

    it('ignore la casse et les accents', () => {
        const home = setup();

        search(home, 'LEGUME');

        expect(names(home)).toEqual(['Légumes de saison']);
    });

    it('réaffiche tous les produits quand la recherche est vidée', () => {
        const home = setup();

        search(home, 'pom');
        search(home, '   ');

        expect(names(home)).toHaveLength(3);
    });

    it('ne renvoie rien quand aucun nom ne correspond', () => {
        const home = setup();

        search(home, 'fromage');

        expect(names(home)).toEqual([]);
    });
});
