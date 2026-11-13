import { Email } from "../../../shared/domain/value-objects/email.value-object";
import { VerificationEmailSender } from "../ports/verification-email-sender";
import { EmailVerificationToken } from "../ports/email-verification-token";
import { UserRepository } from "../../domain/user.repository";
import { Inject } from "@nestjs/common";

/**
 * Sends a new verification link (the previous one expired or got lost).
 *
 * It sends only to an active, unverified account and otherwise does nothing:
 * the caller gets the same answer either way, so it cannot learn which emails
 * have an account.
 */
export class ResendVerificationEmailUseCase {
  constructor(
    @Inject(UserRepository) private readonly repository: UserRepository,
    @Inject(EmailVerificationToken) private readonly verificationToken: EmailVerificationToken,
    @Inject(VerificationEmailSender) private readonly emailSender: VerificationEmailSender
  ) {}

  async execute(email: string): Promise<void> {
    const credentials = await this.repository.findCredentialsByEmail(Email.create(email).toString());
    const user = credentials?.user;

    if (!user || !user.isActive || user.emailVerified) {
      return;
    }

    const token = await this.verificationToken.issue(user);
    await this.emailSender.send(user, token);
  }
}
