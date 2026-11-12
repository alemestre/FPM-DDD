import { ProductResponseSchema, ProductWithProducerResponseSchema } from './product.response.dto';

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
        image: 'https://example.com/images/pomme.jpg',
        unit: 'KG',
        content: null,
        referencePrice: { amount: 2.5, unit: 'kg' },
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

    it('rejects a product without image', () => {
        const { image, ...withoutImage } = validProduct;

        expect(image).toBeDefined();
        expect(ProductResponseSchema.safeParse(withoutImage).success).toBe(false);
    });

    it('rejects an image that is not a URL', () => {
        expect(ProductResponseSchema.safeParse({ ...validProduct, image: 'pomme.jpg' }).success).toBe(false);
    });

    it.each(['KG', 'BOTTE', 'PIECE', 'DOUZAINE', 'BOUTEILLE', 'LOT'])('accepts the unit %s', (unit) => {
        expect(ProductResponseSchema.safeParse({ ...validProduct, unit }).success).toBe(true);
    });

    it.each(['LITRE', 'CONDITIONNEMENT'])('rejects the removed %s unit', (unit) => {
        const result = ProductResponseSchema.safeParse({ ...validProduct, unit });

        expect(result.success).toBe(false);
    });

    it('rejects an unknown unit', () => {
        const result = ProductResponseSchema.safeParse({ ...validProduct, unit: 'GRAMME' });

        expect(result.success).toBe(false);
    });

    it.each([
        ['4 × 125 g', { itemCount: 4, itemSize: { amount: 125, unit: 'g' } }],
        ['1 × 0.75 l', { itemCount: 1, itemSize: { amount: 0.75, unit: 'l' } }],
        ['12 items without size', { itemCount: 12, itemSize: null }],
    ])('accepts the content %s', (_label, content) => {
        expect(ProductResponseSchema.safeParse({ ...validProduct, content }).success).toBe(true);
    });

    it.each(['g', 'kg', 'ml', 'l'])('accepts the measure unit %s', (unit) => {
        const content = { itemCount: 1, itemSize: { amount: 1, unit } };

        expect(ProductResponseSchema.safeParse({ ...validProduct, content }).success).toBe(true);
    });

    it.each([
        ['an item count of 0', { itemCount: 0, itemSize: null }],
        ['a decimal item count', { itemCount: 1.5, itemSize: null }],
        ['a measure of 0', { itemCount: 1, itemSize: { amount: 0, unit: 'g' } }],
        ['the removed pcs unit', { itemCount: 1, itemSize: { amount: 1, unit: 'pcs' } }],
        ['an unknown measure unit', { itemCount: 1, itemSize: { amount: 1, unit: 'cl' } }],
        ['a missing item size (null is required when there is none)', { itemCount: 12 }],
    ])('rejects a content with %s', (_label, content) => {
        expect(ProductResponseSchema.safeParse({ ...validProduct, content }).success).toBe(false);
    });

    it.each([
        { amount: 6, unit: 'kg' },
        { amount: 12, unit: 'l' },
        null,
    ])('accepts the reference price %p', (referencePrice) => {
        expect(ProductResponseSchema.safeParse({ ...validProduct, referencePrice }).success).toBe(true);
    });

    it.each([
        ['an unknown unit', { amount: 6, unit: 'g' }],
        ['a negative amount', { amount: -1, unit: 'kg' }],
        ['a missing value (null is required when there is none)', undefined],
    ])('rejects a reference price with %s', (_label, referencePrice) => {
        expect(ProductResponseSchema.safeParse({ ...validProduct, referencePrice }).success).toBe(false);
    });

    it('rejects the removed contentQuantity / quantityUnit fields as a replacement for content', () => {
        const { content, ...withoutContent } = validProduct;

        expect(content).toBeNull();
        expect(
            ProductResponseSchema.safeParse({ ...withoutContent, contentQuantity: 500, quantityUnit: 'g' }).success,
        ).toBe(false);
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

describe('ProductWithProducerResponseSchema', () => {
    const { producerId, ...productFields } = {
        id: '3f0c9a52-8a6e-4c1b-9d57-2b1e7f4a6c10',
        name: 'Pomme',
        price: 2.5,
        vatRate: 5.5,
        stock: 10,
        minStock: 2,
        producerId: '8b2d4e16-1c7a-4f3e-a0b9-6d5c3e2f1a70',
        categoryId: 'c4e7a1d3-5f2b-4a86-b1c9-0e3d7f6a2b54',
        image: 'https://example.com/images/pomme.jpg',
        unit: 'KG',
        content: null,
        referencePrice: { amount: 2.5, unit: 'kg' },
    };
    const validProduct = { ...productFields, producer: { id: producerId, name: 'Ferme des Lilas' } };

    it('accepts a product with its producer', () => {
        expect(ProductWithProducerResponseSchema.safeParse(validProduct).success).toBe(true);
    });

    it('strips the producer id field, which is replaced by the producer', () => {
        const result = ProductWithProducerResponseSchema.safeParse({ ...validProduct, producerId });

        expect(result.success && 'producerId' in result.data).toBe(false);
    });

    it('rejects a missing producer', () => {
        const result = ProductWithProducerResponseSchema.safeParse({ ...validProduct, producer: undefined });

        expect(result.success).toBe(false);
    });

    it('rejects a producer id that is not a UUID', () => {
        const result = ProductWithProducerResponseSchema.safeParse({
            ...validProduct,
            producer: { id: 'not-a-uuid', name: 'Ferme des Lilas' },
        });

        expect(result.success).toBe(false);
    });

    it('rejects a producer without a name', () => {
        const result = ProductWithProducerResponseSchema.safeParse({
            ...validProduct,
            producer: { id: producerId },
        });

        expect(result.success).toBe(false);
    });
});
