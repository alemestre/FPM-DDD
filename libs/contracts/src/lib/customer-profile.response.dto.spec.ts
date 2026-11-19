import { CustomerProfileResponseSchema } from './customer-profile.response.dto';

describe('CustomerProfileResponseSchema', () => {
    const validProfile = {
        id: '3f0c9a52-8a6e-4c1b-9d57-2b1e7f4a6c10',
        email: 'marie.durand@example.fr',
        firstName: 'Marie',
        lastName: 'Durand',
        phone: '+33612345678',
        address: { line1: '1 rue des Lilas', line2: '', postalCode: '29000', city: 'Quimper' },
    };

    it('accepts a valid payload', () => {
        expect(CustomerProfileResponseSchema.safeParse(validProfile).success).toBe(true);
    });

    it('rejects a profile without address', () => {
        expect(CustomerProfileResponseSchema.safeParse({ ...validProfile, address: null }).success).toBe(false);
    });

    it('rejects an incomplete address', () => {
        const address = { line1: '1 rue des Lilas', line2: '', city: 'Quimper' };
        expect(CustomerProfileResponseSchema.safeParse({ ...validProfile, address }).success).toBe(false);
    });

    it('rejects an id that is not a UUID', () => {
        expect(CustomerProfileResponseSchema.safeParse({ ...validProfile, id: 'not-a-uuid' }).success).toBe(false);
    });
});
