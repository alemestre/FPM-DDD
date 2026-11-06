import { CategoryResponseSchema } from './category.response.dto';

describe('CategoryResponseSchema', () => {
    const validCategory = {
        id: '3f0c9a52-8a6e-4c1b-9d57-2b1e7f4a6c10',
        name: 'Fruits',
    };

    it('accepts a valid payload', () => {
        expect(CategoryResponseSchema.safeParse(validCategory).success).toBe(true);
    });

    it('rejects an id that is not a UUID', () => {
        const result = CategoryResponseSchema.safeParse({ ...validCategory, id: 'not-a-uuid' });

        expect(result.success).toBe(false);
    });

    it('rejects a payload with a missing field', () => {
        const result = CategoryResponseSchema.safeParse({ id: validCategory.id });

        expect(result.success).toBe(false);
    });
});
