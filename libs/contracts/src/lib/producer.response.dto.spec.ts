import { ProducerResponseSchema } from './producer.response.dto';

describe('ProducerResponseSchema', () => {
    const validProducer = {
        id: '3f0c9a52-8a6e-4c1b-9d57-2b1e7f4a6c10',
        name: 'Ferme du Val',
        contactEmail: 'contact@ferme-du-val.example',
        phoneNumber: '+33123456789',
        vatNumber: 'FR12345678901',
        addressLine1: '1 chemin des Vergers',
        addressLine2: '',
        postalCode: '35000',
        city: 'Rennes',
        isActive: true,
    };

    it('accepts a valid payload', () => {
        expect(ProducerResponseSchema.safeParse(validProducer).success).toBe(true);
    });

    it('rejects an id that is not a UUID', () => {
        const result = ProducerResponseSchema.safeParse({ ...validProducer, id: 'not-a-uuid' });

        expect(result.success).toBe(false);
    });

    it('rejects a payload with a missing field', () => {
        const result = ProducerResponseSchema.safeParse({ ...validProducer, isActive: undefined });

        expect(result.success).toBe(false);
    });
});
