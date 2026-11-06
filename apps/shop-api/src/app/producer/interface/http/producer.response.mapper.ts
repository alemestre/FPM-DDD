import type { ProducerResponseDto } from "@fpm/contracts";
import type { Producer } from "../../domain/producer.entity";

/**
 * Maps the aggregate to its public HTTP representation. Serializing the entity
 * directly would expose its private value objects instead of its getters.
 */
export function toProducerResponse(producer: Producer): ProducerResponseDto {
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
