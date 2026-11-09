import { AuthenticationError } from "../../domain/errors/authentication.error";
import { UserRepository } from "../../domain/user.repository";
import type { User } from "../../domain/user.entity";
import { Inject } from "@nestjs/common";

/**
 * Loads the user behind a verified session token. The token may outlive the
 * account, so a missing or deactivated user is treated as unauthenticated.
 */
export class GetCurrentUserUseCase {
  constructor(@Inject(UserRepository) private readonly repository: UserRepository) {}

  async execute(userId: string): Promise<User> {
    const user = await this.repository.findById(userId);

    if (!user || !user.isActive) {
      throw new AuthenticationError();
    }

    return user;
  }
}
