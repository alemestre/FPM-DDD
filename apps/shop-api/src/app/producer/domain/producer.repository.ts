import { GenericEntityRepository } from "../../shared/domain/generic-entity.repository";
import type { Producer } from "./producer.entity";

/**
 * Persistence port for the Producer aggregate.
 *
 * Infrastructure adapters implement this abstract class. Application use cases
 * depend on it so the domain stays independent of Prisma or HTTP.
 */
export abstract class ProducerRepository extends GenericEntityRepository<Producer> {}
