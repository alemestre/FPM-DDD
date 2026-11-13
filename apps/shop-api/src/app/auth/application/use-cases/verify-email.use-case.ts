import { InvalidVerificationTokenError } from "../../domain/errors/invalid-verification-token.error";
import { EmailVerificationToken } from "../ports/email-verification-token";
import { UserRepository } from "../../domain/user.repository";
import { Inject } from "@nestjs/common";

/** Marks the account's email as verified, from the token sent by email. */
export class VerifyEmailUseCase {
  constructor(
    @Inject(UserRepository) private readonly repository: UserRepository,
    @Inject(EmailVerificationToken) private readonly verificationToken: EmailVerificationToken
  ) {}

  async execute(token: string): Promise<void> {
    const userId = await this.verificationToken.verify(token);
    const user = await this.repository.findById(userId);

    if (!user) {
      throw new InvalidVerificationTokenError();
    }

    if (user.emailVerified) {
      return;
    }

    user.verifyEmail();
    await this.repository.save(user);
  }
}
