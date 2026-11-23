import { CartResponseSchema } from './cart.response.dto';

describe('CartResponseSchema', () => {
    const product = {
        id: '3f0c9a52-8a6e-4c1b-9d57-2b1e7f4a6c10',
        name: 'Carottes',
        price: 2.5,
        vatRate: 5.5,
        stock: 4,
        minStock: 0,
        producer: { id: 'a3bb189e-8bf9-4888-9912-ace4e6543002', name: 'Ferme des Lilas' },
        categoryId: 'b3bb189e-8bf9-4888-9912-ace4e6543002',
        image: 'https://example.com/carottes.jpg',
        unit: 'KG',
        content: null,
        referencePrice: null,
        isAvailable: true,
    };

    it('accepts a cart with its products', () => {
        expect(CartResponseSchema.safeParse({ items: [{ product, quantity: 2 }] }).success).toBe(true);
    });

    it('accepts an empty cart', () => {
        expect(CartResponseSchema.safeParse({ items: [] }).success).toBe(true);
    });

    it.each([0, 1.5])('rejects the quantity %p', (quantity) => {
        expect(CartResponseSchema.safeParse({ items: [{ product, quantity }] }).success).toBe(false);
    });

    it('rejects a line without its product', () => {
        expect(CartResponseSchema.safeParse({ items: [{ quantity: 1 }] }).success).toBe(false);
    });
});
