import { CurrentUserResponseSchema } from './current-user.response.dto';

describe('CurrentUserResponseSchema', () => {
    const validUser = {
        id: '3f0c9a52-8a6e-4c1b-9d57-2b1e7f4a6c10',
        email: 'marie.durand@example.fr',
        firstName: 'Marie',
        lastName: 'Durand',
        role: 'CUSTOMER',
        phone: '+33612345678',
    };

    it('accepts a valid payload', () => {
        expect(CurrentUserResponseSchema.safeParse(validUser).success).toBe(true);
    });

    it('accepts a user without phone', () => {
        expect(CurrentUserResponseSchema.safeParse({ ...validUser, role: 'ADMIN', phone: null }).success).toBe(true);
    });

    it('rejects an unknown role', () => {
        expect(CurrentUserResponseSchema.safeParse({ ...validUser, role: 'PRODUCER' }).success).toBe(false);
    });

    it('rejects an id that is not a UUID', () => {
        expect(CurrentUserResponseSchema.safeParse({ ...validUser, id: 'not-a-uuid' }).success).toBe(false);
    });
});
