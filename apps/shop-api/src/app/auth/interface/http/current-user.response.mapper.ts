import type { CurrentUserResponseDto } from "@fpm/contracts";
import type { User } from "../../domain/user.entity";

/**
 * Maps the aggregate to its public HTTP representation. Serializing the entity
 * directly would expose its private value objects instead of its getters.
 */
export function toCurrentUserResponse(user: User): CurrentUserResponseDto {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role
  };
}
