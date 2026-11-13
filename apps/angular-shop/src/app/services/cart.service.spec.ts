import type { ProductWithProducerResponseDto } from '@fpm/contracts';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CART_STORAGE_KEY, CartService } from './cart.service';

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
