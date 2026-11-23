import type { ProductWithProducerResponseDto } from '@fpm/contracts';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { PLATFORM_ID, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { NotificationService } from './notification.service';
import { CART_STORAGE_KEY, CartService } from './cart.service';
import { AuthService } from './auth.service';

const product = (id: string): ProductWithProducerResponseDto => ({
    id,
    name: `Produit ${id}`,
    image: 'https://example.com/produit.jpg',
    price: 2.5,
    vatRate: 5.5,
    stock: 10,
    minStock: 1,
    producer: { id: 'producer-1', name: 'Ferme des Lilas' },
    categoryId: 'cat-1',
    unit: 'KG',
    content: null,
    referencePrice: { amount: 2.5, unit: 'kg' },
    isAvailable: true,
});

const savedCart = () => JSON.parse(localStorage.getItem(CART_STORAGE_KEY) ?? 'null');

describe('CartService persistence', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    const createService = (platform: 'browser' | 'server' = 'browser') => {
        TestBed.configureTestingModule({
            providers: [{ provide: PLATFORM_ID, useValue: platform }],
        });
        return TestBed.inject(CartService);
    };

    it('restores the saved cart after the first render', () => {
        localStorage.setItem(
            CART_STORAGE_KEY,
            JSON.stringify([{ product: product('p-1'), quantity: 3 }]),
        );
        const service = createService();

        TestBed.tick();

        expect(service.items()).toEqual([{ product: product('p-1'), quantity: 3 }]);
        expect(service.totalItems()).toBe(3);
    });

    it('is marked as restored only after the first render', () => {
        const service = createService();
        expect(service.restored()).toBe(false);

        TestBed.tick();

        expect(service.restored()).toBe(true);
    });

    it('does not overwrite the saved cart before restoring it', () => {
        const stored = JSON.stringify([{ product: product('p-1'), quantity: 2 }]);
        localStorage.setItem(CART_STORAGE_KEY, stored);
        createService();

        TestBed.tick();

        expect(localStorage.getItem(CART_STORAGE_KEY)).toBe(stored);
    });

    it('saves the cart on every change', () => {
        const service = createService();
        TestBed.tick();

        service.addToCart(product('p-1'), 2);
        TestBed.tick();
        expect(savedCart()).toEqual([{ product: product('p-1'), quantity: 2 }]);

        service.updateQuantity('p-1', 5);
        TestBed.tick();
        expect(savedCart()).toEqual([{ product: product('p-1'), quantity: 5 }]);

        service.clearCart();
        TestBed.tick();
        expect(savedCart()).toEqual([]);
    });

    it('starts with an empty cart when the stored value is not valid JSON', () => {
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
        localStorage.setItem(CART_STORAGE_KEY, '{not json');
        const service = createService();

        TestBed.tick();

        expect(service.items()).toEqual([]);
    });

    it('drops invalid stored items and keeps the valid ones', () => {
        localStorage.setItem(
            CART_STORAGE_KEY,
            JSON.stringify([
                { product: product('p-1'), quantity: 1 },
                { product: product('p-2'), quantity: 0 },
                { product: product('p-3'), quantity: 100 },
                { product: product('p-4'), quantity: 1.5 },
                { product: { name: 'sans id' }, quantity: 1 },
                null,
            ]),
        );
        const service = createService();

        TestBed.tick();

        expect(service.items()).toEqual([{ product: product('p-1'), quantity: 1 }]);
    });

    it('ignores a stored value that is not an array', () => {
        localStorage.setItem(
            CART_STORAGE_KEY,
            JSON.stringify({ product: product('p-1'), quantity: 1 }),
        );
        const service = createService();

        TestBed.tick();

        expect(service.items()).toEqual([]);
    });

    it('ignores a cart saved as a double-encoded JSON string', () => {
        const items = [{ product: product('p-1'), quantity: 1 }];
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(JSON.stringify(items)));
        const service = createService();

        TestBed.tick();

        expect(service.items()).toEqual([]);
        expect(service.totalItems()).toBe(0);
    });

    it('never touches localStorage on the server', () => {
        localStorage.setItem(
            CART_STORAGE_KEY,
            JSON.stringify([{ product: product('p-1'), quantity: 1 }]),
        );
        const getItem = vi.spyOn(Storage.prototype, 'getItem');
        const setItem = vi.spyOn(Storage.prototype, 'setItem');
        const service = createService('server');

        TestBed.tick();
        service.addToCart(product('p-2'));
        TestBed.tick();

        expect(getItem).not.toHaveBeenCalled();
        expect(setItem).not.toHaveBeenCalled();
        expect(service.items()).toEqual([{ product: product('p-2'), quantity: 1 }]);
    });
});

describe('CartService totals', () => {
    beforeEach(() => localStorage.clear());

    it("applique la règle d'arrondi unique : la somme des lignes est égale au total", () => {
        const service = TestBed.inject(CartService);

        service.addToCart(product('p-1'), 2);
        service.addToCart(product('p-2'), 1);

        // Lignes : 5,00 + 0,28 = 5,28 et 2,50 + 0,14 = 2,64
        expect(service.lineAmounts(service.items()[0])).toEqual({ subtotal: 5, tax: 0.28, total: 5.28 });
        expect(service.lineAmounts(service.items()[1])).toEqual({ subtotal: 2.5, tax: 0.14, total: 2.64 });
        expect(service.subtotal()).toBe(7.5);
        expect(service.tax()).toBe(0.42);
        expect(service.total()).toBe(7.92);
    });
});

describe('CartService limits', () => {
    beforeEach(() => localStorage.clear());

    it('refuse plus de 10 unités du même produit', () => {
        const service = TestBed.inject(CartService);
        TestBed.tick();

        expect(service.addToCart(product('p-1'), 11).success).toBe(false);
        service.addToCart(product('p-1'), 6);
        expect(service.addToCart(product('p-1'), 5).success).toBe(false);
        expect(service.updateQuantity('p-1', 11).success).toBe(false);
        expect(service.items()).toEqual([{ product: product('p-1'), quantity: 6 }]);
    });

    it('ignore une ligne sauvegardée au-delà de 10 unités', () => {
        localStorage.setItem(
            CART_STORAGE_KEY,
            JSON.stringify([
                { product: product('p-1'), quantity: 10 },
                { product: product('p-2'), quantity: 11 },
            ]),
        );
        const service = TestBed.inject(CartService);

        TestBed.tick();

        expect(service.items()).toEqual([{ product: product('p-1'), quantity: 10 }]);
    });
});

describe('CartService client connecté', () => {
    const CART_URL = `${environment.apiUrl}/cart`;
    const ITEMS_URL = `${environment.apiUrl}/cart/items`;
    const cart = (...items: [string, number][]) => ({
        success: true,
        data: { items: items.map(([id, quantity]) => ({ product: product(id), quantity })) },
    });
    const badRequest = (message: string) => ({ status: 400, statusText: 'Bad Request', body: { message } });

    let isConnected: ReturnType<typeof signal<boolean>>;
    let http: HttpTestingController;
    let notifications: NotificationService;

    const messages = () => notifications.notifications().map((notification) => notification.message);

    /** Crée le service et lance la restauration (après le premier rendu). */
    const createService = (connected: boolean) => {
        isConnected = signal(connected);
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                { provide: AuthService, useValue: { isConnected } },
            ],
        });
        const service = TestBed.inject(CartService);
        http = TestBed.inject(HttpTestingController);
        notifications = TestBed.inject(NotificationService);
        TestBed.tick();
        return service;
    };

    /** Client connecté dont le panier en base contient `items`. */
    const connectedService = (...items: [string, number][]) => {
        const service = createService(true);
        http.expectOne(CART_URL).flush(cart(...items));
        return service;
    };

    beforeEach(() => localStorage.clear());
    afterEach(() => http.verify());

    describe('à la restauration', () => {
        it('charge le panier du compte et ne marque le panier restauré qu’à la réponse', () => {
            const service = createService(true);
            expect(service.restored()).toBe(false);

            const request = http.expectOne(CART_URL);
            expect(request.request.method).toBe('GET');
            request.flush(cart(['p-1', 2]));

            expect(service.restored()).toBe(true);
            expect(service.items()).toEqual([{ product: product('p-1'), quantity: 2 }]);
        });

        it('fusionne le panier local dans le compte, puis vide le localStorage', () => {
            localStorage.setItem(
                CART_STORAGE_KEY,
                JSON.stringify([
                    { product: product('p-1'), quantity: 2 },
                    { product: product('p-2'), quantity: 1 },
                ]),
            );
            const service = createService(true);

            const first = http.expectOne(ITEMS_URL);
            expect(first.request.method).toBe('POST');
            expect(first.request.body).toEqual({ productId: 'p-1', quantity: 2 });
            first.flush(cart(['p-1', 2]));
            const second = http.expectOne(ITEMS_URL);
            expect(second.request.body).toEqual({ productId: 'p-2', quantity: 1 });
            second.flush(cart(['p-1', 2], ['p-2', 1]));
            http.expectOne(CART_URL).flush(cart(['p-3', 4], ['p-1', 2], ['p-2', 1]));
            TestBed.tick();

            expect(service.items().map(({ product, quantity }) => [product.id, quantity])).toEqual([
                ['p-3', 4],
                ['p-1', 2],
                ['p-2', 1],
            ]);
            expect(localStorage.getItem(CART_STORAGE_KEY)).toBeNull();
            expect(messages()).toEqual([]);
        });

        it('signale un produit refusé à la fusion sans bloquer les autres', () => {
            localStorage.setItem(
                CART_STORAGE_KEY,
                JSON.stringify([
                    { product: product('p-1'), quantity: 9 },
                    { product: product('p-2'), quantity: 1 },
                ]),
            );
            const service = createService(true);

            const { status, statusText, body } = badRequest('Stock insuffisant');
            http.expectOne(ITEMS_URL).flush(body, { status, statusText });
            http.expectOne(ITEMS_URL).flush(cart(['p-2', 1]));
            http.expectOne(CART_URL).flush(cart(['p-2', 1]));

            expect(service.items()).toEqual([{ product: product('p-2'), quantity: 1 }]);
            expect(messages()).toEqual([
                '1 produit(s) de votre panier n’ont pas pu être ajoutés à votre compte (stock ou quantité maximale atteints)',
            ]);
        });

        it('affiche un panier vide et prévient si le panier du compte ne peut pas être chargé', () => {
            const service = createService(true);

            http.expectOne(CART_URL).flush(null, { status: 500, statusText: 'Server Error' });

            expect(service.restored()).toBe(true);
            expect(service.items()).toEqual([]);
            expect(messages()).toEqual([
                'Impossible de charger votre panier pour le moment. Veuillez réessayer.',
            ]);
        });
    });

    describe('modifications', () => {
        it('envoie l’ajout à l’API et affiche le panier qu’elle renvoie', () => {
            const service = connectedService();

            expect(service.addToCart(product('p-1'), 2).success).toBe(true);
            expect(service.items()).toEqual([]);

            const request = http.expectOne(ITEMS_URL);
            expect(request.request.method).toBe('POST');
            expect(request.request.body).toEqual({ productId: 'p-1', quantity: 2 });
            request.flush(cart(['p-1', 3]));

            expect(service.items()).toEqual([{ product: product('p-1'), quantity: 3 }]);
        });

        it('retire un produit avec DELETE /cart/items/:productId', () => {
            const service = connectedService(['p-1', 1], ['p-2', 1]);

            service.removeFromCart('p-1');

            const request = http.expectOne(`${ITEMS_URL}/p-1`);
            expect(request.request.method).toBe('DELETE');
            request.flush(cart(['p-2', 1]));
            expect(service.items()).toEqual([{ product: product('p-2'), quantity: 1 }]);
        });

        it('vide le panier avec DELETE /cart/items', () => {
            const service = connectedService(['p-1', 1]);

            service.clearCart();

            const request = http.expectOne(ITEMS_URL);
            expect(request.request.method).toBe('DELETE');
            request.flush(null, { status: 204, statusText: 'No Content' });
            expect(service.items()).toEqual([]);
        });

        it('change la quantité avec PATCH /cart/items/:productId', () => {
            const service = connectedService(['p-1', 1]);

            service.updateQuantity('p-1', 4);

            const request = http.expectOne(`${ITEMS_URL}/p-1`);
            expect(request.request.method).toBe('PATCH');
            expect(request.request.body).toEqual({ quantity: 4 });
            request.flush(cart(['p-1', 4]));
            expect(service.items()).toEqual([{ product: product('p-1'), quantity: 4 }]);
        });

        it('affiche le message de l’API et garde le panier quand une modification est refusée', () => {
            const service = connectedService(['p-1', 1]);

            service.updateQuantity('p-1', 8);

            const { status, statusText, body } = badRequest('Stock insuffisant pour "Produit p-1" : 4 disponible(s)');
            http.expectOne(`${ITEMS_URL}/p-1`).flush(body, { status, statusText });

            expect(service.items()).toEqual([{ product: product('p-1'), quantity: 1 }]);
            expect(messages()).toEqual(['Stock insuffisant pour "Produit p-1" : 4 disponible(s)']);
        });

        it('affiche un message générique pour une autre erreur', () => {
            const service = connectedService();

            service.addToCart(product('p-1'), 1);
            http.expectOne(ITEMS_URL).flush(null, { status: 500, statusText: 'Server Error' });

            expect(service.items()).toEqual([]);
            expect(messages()).toEqual(['Votre panier n’a pas pu être mis à jour. Veuillez réessayer.']);
        });

        it('n’écrit jamais le panier du compte dans le localStorage', () => {
            const service = connectedService(['p-1', 1]);

            service.addToCart(product('p-2'), 1);
            TestBed.tick();
            http.expectOne(ITEMS_URL).flush(cart(['p-1', 1], ['p-2', 1]));
            TestBed.tick();

            expect(localStorage.getItem(CART_STORAGE_KEY)).toBeNull();
        });
    });

    describe('connexion et déconnexion', () => {
        it('n’appelle pas l’API pour un invité', () => {
            const service = createService(false);

            service.addToCart(product('p-1'), 1);
            TestBed.tick();

            expect(savedCart()).toEqual([{ product: product('p-1'), quantity: 1 }]);
        });

        it('fusionne le panier de l’invité quand il se connecte', () => {
            const service = createService(false);
            service.addToCart(product('p-1'), 2);
            TestBed.tick();

            isConnected.set(true);
            TestBed.tick();

            const request = http.expectOne(ITEMS_URL);
            expect(request.request.body).toEqual({ productId: 'p-1', quantity: 2 });
            request.flush(cart(['p-1', 2]));
            http.expectOne(CART_URL).flush(cart(['p-4', 1], ['p-1', 2]));
            TestBed.tick();

            expect(service.items().map(({ product }) => product.id)).toEqual(['p-4', 'p-1']);
            expect(localStorage.getItem(CART_STORAGE_KEY)).toBeNull();
        });

        it('vide le panier affiché à la déconnexion, sans le recopier en local', () => {
            const service = connectedService(['p-1', 1]);

            isConnected.set(false);
            TestBed.tick();

            expect(service.items()).toEqual([]);
            expect(savedCart()).toEqual([]);
        });

        it('ignore une réponse de l’API arrivée après la déconnexion', () => {
            const service = connectedService();
            service.addToCart(product('p-1'), 1);
            const pending = http.expectOne(ITEMS_URL);

            isConnected.set(false);
            TestBed.tick();
            pending.flush(cart(['p-1', 1]));

            expect(service.items()).toEqual([]);
        });
    });
});
