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
        unit: 'KG',
        quantity: null,
        quantityUnit: null,
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

    it.each(['KG', 'BOTTE', 'PIECE', 'CONDITIONNEMENT', 'BOUTEILLE'])('accepts the unit %s', (unit) => {
        expect(ProductResponseSchema.safeParse({ ...validProduct, unit }).success).toBe(true);
    });

    it('rejects the removed LITRE unit', () => {
        const result = ProductResponseSchema.safeParse({ ...validProduct, unit: 'LITRE' });

        expect(result.success).toBe(false);
    });

    it('rejects an unknown unit', () => {
        const result = ProductResponseSchema.safeParse({ ...validProduct, unit: 'GRAMME' });

        expect(result.success).toBe(false);
    });

    it.each(['pcs', 'g', 'ml', 'kg', 'l'])('accepts the quantity unit %s', (quantityUnit) => {
        expect(ProductResponseSchema.safeParse({ ...validProduct, quantityUnit }).success).toBe(true);
    });

    it('accepts a decimal quantity', () => {
        expect(ProductResponseSchema.safeParse({ ...validProduct, quantity: 0.75, quantityUnit: 'l' }).success).toBe(true);
    });

    it.each([0, -1])('rejects a quantity of %p', (quantity) => {
        expect(ProductResponseSchema.safeParse({ ...validProduct, quantity }).success).toBe(false);
    });

    it('rejects an unknown quantity unit', () => {
        const result = ProductResponseSchema.safeParse({ ...validProduct, quantityUnit: 'cl' });

        expect(result.success).toBe(false);
    });

    it('rejects a missing quantity unit (null is required when there is none)', () => {
        const result = ProductResponseSchema.safeParse({ ...validProduct, quantityUnit: undefined });

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
