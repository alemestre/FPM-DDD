import { Email } from "../../../shared/domain/value-objects/email.value-object";
import { AuthenticationError } from "../../domain/errors/authentication.error";
import { AccessTokenIssuer } from "../ports/access-token-issuer";
import { UserRepository } from "../../domain/user.repository";
import { PasswordHasher } from "../ports/password-hasher";
import type { LoginOutput } from "../login.output";
import type { LoginInput } from "../login.input";
import { Inject } from "@nestjs/common";

const INVALID_CREDENTIALS = "Email ou mot de passe incorrect";

/**
 * Checks the credentials and issues an access token for the account.
 *
 * Every failure (unknown email, wrong password, deactivated account) raises the
 * same error after the same amount of work, so the response does not reveal
 * which accounts exist.
 */
export class LogInUseCase {
  constructor(
    @Inject(UserRepository) private readonly repository: UserRepository,
    @Inject(AccessTokenIssuer) private readonly accessTokenIssuer: AccessTokenIssuer,
    @Inject(PasswordHasher) private readonly passwordHasher: PasswordHasher
  ) {}

  async execute({ email, password }: LoginInput): Promise<LoginOutput> {
    const credentials = await this.repository.findCredentialsByEmail(Email.create(email).toString());

    // Always verify, even without an account, before looking at isActive.
    const passwordMatches = await this.passwordHasher.verify(password, credentials?.passwordHash ?? null);

    if (!credentials || !passwordMatches || !credentials.user.isActive) {
      throw new AuthenticationError(INVALID_CREDENTIALS);
    }

    const accessToken = await this.accessTokenIssuer.issue(credentials.user);

    return { user: credentials.user, accessToken };
  }
}
