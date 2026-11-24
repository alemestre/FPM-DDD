import { Email } from "../../../shared/domain/value-objects/email.value-object";
import { AuthenticationError } from "../../domain/errors/authentication.error";
import { EmailNotVerifiedError } from "../../domain/errors/email-not-verified.error";
import { AccessTokenIssuer } from "../ports/access-token-issuer";
import { UserRepository } from "../../domain/user.repository";
import { PasswordHasher } from "../ports/password-hasher";
import type { LoginOutput } from "../login.output";
import type { UserRole } from "../../domain/user.entity";
import type { LoginInput } from "../login.input";
import { Inject } from "@nestjs/common";

const INVALID_CREDENTIALS = "Email ou mot de passe incorrect";

/**
 * Checks the credentials and issues an access token for the account.
 *
 * Every failure (unknown email, wrong password, deactivated account, or an
 * account without the required role) raises the same error after the same
 * amount of work, so the response does not reveal which accounts exist. Only someone who knows the password learns that the
 * email still has to be verified.
 */
export class LogInUseCase {
  constructor(
    @Inject(UserRepository) private readonly repository: UserRepository,
    @Inject(AccessTokenIssuer) private readonly accessTokenIssuer: AccessTokenIssuer,
    @Inject(PasswordHasher) private readonly passwordHasher: PasswordHasher
  ) {}

  /** @param requiredRole When given, only an account with this role may log in (admin login). */
  async execute({ email, password }: LoginInput, requiredRole?: UserRole): Promise<LoginOutput> {
    const credentials = await this.repository.findCredentialsByEmail(Email.create(email).toString());

    // Always verify, even without an account, before looking at isActive.
    const passwordMatches = await this.passwordHasher.verify(password, credentials?.passwordHash ?? null);

    if (
      !credentials ||
      !passwordMatches ||
      !credentials.user.isActive ||
      (requiredRole !== undefined && credentials.user.role !== requiredRole)
    ) {
      throw new AuthenticationError(INVALID_CREDENTIALS);
    }

    if (!credentials.user.emailVerified) {
      throw new EmailNotVerifiedError();
    }

    const accessToken = await this.accessTokenIssuer.issue(credentials.user);

    return { user: credentials.user, accessToken };
  }
}
