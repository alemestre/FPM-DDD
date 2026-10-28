/**
 * Persistence port for the Entity aggregate.
 *
 * Infrastructure adapters implement this abstract class. Application use cases
 * depend on it so the domain stays independent of Prisma or HTTP.
 */
export abstract class GenericEntityRepository<T> {
  /**
   * Persists a new entity.
   *
   * @param entity - Entity aggregate to create.
   * @returns The created entity.
   */
  abstract save(entity: T): Promise<T>;

  /**
   * Loads a product by identifier.
   *
   * @param id - Entity identity.
   * @returns The entity when it exists, otherwise `null`.
   */
  abstract findById(id: string): Promise<T | null>;

  /**
   * Loads every entity.
   *
   * @returns All persisted entities.
   */
  abstract findAll(): Promise<T[]>;

  /**
   * Persists changes to an existing entity.
   *
   * @param T - Entity aggregate with updated state.
   * @returns The updated entity.
   */
  abstract update(id: string, dataToUpdate: Partial<T>): Promise<T>;

  /**
   * Removes a entity by identifier.
   *
   * @param id - Entity identity.
   * @returns A promise that resolves when the entity is deleted.
   */
  abstract delete(id: string): Promise<void>;
}
