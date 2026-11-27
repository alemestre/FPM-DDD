import { z } from 'zod';

/**
 * Corps de création et de modification d'un producteur : les champs de CreateProducerSchema (shop-api).
 * `isActive` est modifiable ici comme par POST /producers/:id/activate et /deactivate.
 * Les formats (téléphone, n° de TVA, code postal) sont vérifiés par les value objects de l'API.
 */
export const ProducerRequestSchema = z.object({
    name: z.string(),
    email: z.email(),
    phone: z.string(),
    vatNumber: z.string(),
    addressLine1: z.string(),
    addressLine2: z.string(),
    postalCode: z.string(),
    city: z.string(),
    isActive: z.boolean()
});

export type ProducerRequestDto = z.infer<typeof ProducerRequestSchema>;
