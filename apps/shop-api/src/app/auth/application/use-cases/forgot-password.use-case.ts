import { Email } from "../../../shared/domain/value-objects/email.value-object";
import { ForgotPasswordEmailSender } from "../ports/forgot-password-email-sender";
import { ForgotPasswordToken } from "../ports/forgot-password-token";
import { UserRepository } from "../../domain/user.repository";
import { Inject } from "@nestjs/common";

/**
 * Sends a link to choose a new password.
 *
 * It sends only to an active account and otherwise does nothing: the caller
 * gets the same answer either way, so it cannot learn which emails have an account.
 */
export class ForgotPasswordUseCase {
  constructor(
    @Inject(UserRepository) private readonly repository: UserRepository,
    @Inject(ForgotPasswordToken) private readonly forgotPasswordToken: ForgotPasswordToken,
    @Inject(ForgotPasswordEmailSender) private readonly emailSender: ForgotPasswordEmailSender
  ) {}

  async execute(email: string): Promise<void> {
    const credentials = await this.repository.findCredentialsByEmail(Email.create(email).toString());
    if (!credentials || !credentials.user.isActive) {
      return;
    }

    const token = await this.forgotPasswordToken.issue(credentials);
    await this.emailSender.send(credentials.user, token);
  }
}
