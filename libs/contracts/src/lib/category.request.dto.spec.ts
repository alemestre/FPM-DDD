import { CategoryRequestSchema } from './category.request.dto';

describe('CategoryRequestSchema', () => {
    it('accepts a name', () => {
        expect(CategoryRequestSchema.safeParse({ name: 'Fruits' }).success).toBe(true);
    });

    it.each([{}, { name: 3 }, { label: 'Fruits' }])('rejects %p', (body) => {
        expect(CategoryRequestSchema.safeParse(body).success).toBe(false);
    });
});
