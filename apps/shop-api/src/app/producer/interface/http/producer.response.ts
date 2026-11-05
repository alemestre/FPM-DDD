import type { Producer } from "../../domain/producer.entity";
import { z } from "zod";

export const ProducerResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  contactEmail: z.string(),
  phoneNumber: z.string(),
  vatNumber: z.string(),
  addressLine1: z.string(),
  addressLine2: z.string(),
  postalCode: z.string(),
  city: z.string(),
  isActive: z.boolean()
});

export type ProducerResponse = z.infer<typeof ProducerResponseSchema>;

/**
 * Maps the aggregate to its public HTTP representation. Serializing the entity
 * directly would expose its private value objects instead of its getters.
 */
export function toProducerResponse(producer: Producer): ProducerResponse {
  return {
    id: producer.id,
    name: producer.name,
    contactEmail: producer.contactEmail,
    phoneNumber: producer.phoneNumber,
    vatNumber: producer.vatNumber,
    addressLine1: producer.addressLine1,
    addressLine2: producer.addressLine2,
    postalCode: producer.postalCode,
    city: producer.city,
    isActive: producer.isActive
  };
}
