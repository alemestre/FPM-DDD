/**
 * Prisma error codes (`PrismaClientKnownRequestError.code`) that repositories translate into domain errors.
 * See https://www.prisma.io/docs/orm/reference/error-reference
 */

/** Unique constraint violation: the value is already used by another row. */
export const UNIQUE_CONSTRAINT_VIOLATION = "P2002";

/** Foreign key violation: the row points to a missing one, or is still referenced by another. */
export const FOREIGN_KEY_VIOLATION = "P2003";
