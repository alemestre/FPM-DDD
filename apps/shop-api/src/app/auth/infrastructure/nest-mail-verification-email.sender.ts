import { VerificationEmailSender } from "../application/ports/verification-email-sender";
import { Injectable, Logger } from "@nestjs/common";
import { VerifyEmailMail } from "./mail/verify-email.mail";
import type { User } from "../domain/user.entity";
import { ConfigService } from "@nestjs/config";
import { MailError, Mailer } from "@nestjs/mail";

/** Frontend page that reads the token and calls POST /api/verify-email. */
export const VERIFY_EMAIL_PATH = "/verifier-email";

/**
 * Sends the verification email through @nestjs/mail, which already retries
 * transient failures. A failed send is logged, not rethrown: the account is
 * already created and the user can ask for a new link.
 */
@Injectable()
export class NestMailVerificationEmailSender implements VerificationEmailSender {
  private readonly logger = new Logger(NestMailVerificationEmailSender.name);

  constructor(
    private readonly mailer: Mailer,
    private readonly config: ConfigService
  ) {}

  async send(user: User, token: string) {
    const url = new URL(VERIFY_EMAIL_PATH, this.config.getOrThrow<string>("FRONTEND_URL"));
    url.searchParams.set("token", token);

    try {
      await this.mailer.send(VerifyEmailMail, {
        to: { name: `${user.firstName} ${user.lastName}`, address: user.email },
        data: { firstName: user.firstName, url: url.toString() }
      });
    } catch (error) {
      if (!(error instanceof MailError)) {
        throw error;
      }
      this.logger.error(`Échec de l'envoi de l'email de vérification au compte ${user.id}`, error.stack);
    }
  }
}
