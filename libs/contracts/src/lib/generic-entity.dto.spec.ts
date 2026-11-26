import { GenericEntitySchema } from './generic-entity.dto';

describe('GenericEntitySchema', () => {
    it('accepts a UUID id', () => {
        expect(GenericEntitySchema.safeParse({ id: '3f0c9a52-8a6e-4c1b-9d57-2b1e7f4a6c10' }).success).toBe(true);
    });

    it.each([{ id: 'not-a-uuid' }, {}])('rejects %p', (payload) => {
        expect(GenericEntitySchema.safeParse(payload).success).toBe(false);
    });

    it('lets entity schemas add their own fields', () => {
        const ItemSchema = GenericEntitySchema.extend({ name: GenericEntitySchema.shape.id });

        expect(Object.keys(ItemSchema.shape)).toEqual(['id', 'name']);
    });
});
