import { Prisma, type Role, type User as UserRow } from "../../../generated/prisma/client";
import { EmailAlreadyUsedError } from "../domain/errors/email-already-used.error";
import type { CustomerRegistration } from "../domain/customer-registration";
import type { UserCredentials } from "../domain/user.credentials";
import { UserRepository } from "../domain/user.repository";
import { PrismaService } from "../../../prisma/prisma.service";
import { User, type UserRole } from "../domain/user.entity";
import { Injectable } from "@nestjs/common";

/** Prisma error code of a unique constraint violation. */
const UNIQUE_CONSTRAINT_VIOLATION = "P2002";

const ROLE_TO_DOMAIN = {
  ADMIN: "ADMIN",
  CUSTOMER: "CUSTOMER"
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

  async findById(id: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({
      where: { id }
    });

    return row ? this.toDomain(row) : null;
  }

  /**
   * The nested create writes the user and its customer profile in one
   * transaction. The unique email index also catches concurrent sign-ups.
   */
  async register({ user, passwordHash, phone, address }: CustomerRegistration): Promise<void> {
    try {
      await this.prisma.user.create({
        data: {
          id: user.id,
          email: user.email,
          passwordHash,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isActive: user.isActive,
          emailVerified: user.emailVerified,
          customerProfile: {
            create: {
              phone: phone.toString(),
              addressLine1: address?.line1 ?? null,
              addressLine2: address?.line2 ?? "",
              postalCode: address?.postalCode.toString() ?? null,
              city: address?.city ?? null
            }
          }
        }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === UNIQUE_CONSTRAINT_VIOLATION) {
        throw new EmailAlreadyUsedError({ cause: error });
      }
      throw error;
    }
  }

  async save(user: User): Promise<void> {
    await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: user.emailVerified }
    });
  }

  /** Reconstructs a User aggregate from a Prisma row. */
  private toDomain(row: UserRow): User {
    return User.reconstitute(
      row.id,
      row.email,
      row.firstName,
      row.lastName,
      ROLE_TO_DOMAIN[row.role],
      row.isActive,
      row.emailVerified
    );
  }
}
