import type { Role, User as UserRow } from "../../../generated/prisma/client";
import { UserRepository } from "../domain/user.repository";
import { PrismaService } from "../../../prisma/prisma.service";
import { User, type UserRole } from "../domain/user.entity";
import { Injectable } from "@nestjs/common";
import type { UserCredentials } from '../domain/user.credentials';


const ROLE_TO_DOMAIN = {
  ADMIN: 'ADMIN',
  CUSTOMER: 'CUSTOMER'
} as const satisfies Record<Role, UserRole>;

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findCredentialsByEmail(email: string): Promise<UserCredentials | null> {
    const row = await this.prisma.user.findUnique({
      where: { email }
    });

    return row ? { user: this.toDomain(row), passwordHash: row.passwordHash } : null;
  }

  async findById(id: string) {
    const row = await this.prisma.user.findUnique({
      where: { id }
    });

    return row ? this.toDomain(row) : null;
  }

  /**
   * Reconstructs a User aggregate from a Prisma row. The phone number lives on
   * the customer profile, so admins have none.
   */
  private toDomain(row: UserRow) {
    return User.reconstitute(
      row.id,
      row.email,
      row.firstName,
      row.lastName,
      ROLE_TO_DOMAIN[row.role],
      row.isActive
    );
  }
}
