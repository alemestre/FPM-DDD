import { ProductResponseSchema } from './product.response.dto';

describe('ProductResponseSchema', () => {
    const validProduct = {
        id: '3f0c9a52-8a6e-4c1b-9d57-2b1e7f4a6c10',
        name: 'Pomme',
        price: 2.5,
        vatRate: 5.5,
        stock: 10,
        minStock: 2,
        producerId: '8b2d4e16-1c7a-4f3e-a0b9-6d5c3e2f1a70',
        categoryId: 'c4e7a1d3-5f2b-4a86-b1c9-0e3d7f6a2b54',
    };

    it('accepts a valid payload', () => {
        expect(ProductResponseSchema.safeParse(validProduct).success).toBe(true);
    });

    it('rejects an id that is not a UUID', () => {
        const result = ProductResponseSchema.safeParse({ ...validProduct, id: 'not-a-uuid' });

        expect(result.success).toBe(false);
    });

    it('rejects a category id that is not a UUID', () => {
        const result = ProductResponseSchema.safeParse({
            ...validProduct,
            categoryId: 'not-a-uuid',
        });

        expect(result.success).toBe(false);
    });

    it('rejects a stock that is not an integer', () => {
        const result = ProductResponseSchema.safeParse({ ...validProduct, stock: 1.5 });

        expect(result.success).toBe(false);
    });

    it('rejects a payload with a missing field', () => {
        const result = ProductResponseSchema.safeParse({ ...validProduct, price: undefined });

        expect(result.success).toBe(false);
    });
});
