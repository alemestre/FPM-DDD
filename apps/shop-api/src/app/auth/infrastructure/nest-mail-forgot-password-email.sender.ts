import { Injectable, Logger } from "@nestjs/common";
import type { User } from "../domain/user.entity";
import { ConfigService } from "@nestjs/config";
import { MailError, Mailer } from "@nestjs/mail";
import { ForgotPasswordEmailSender } from '../application/ports/forgot-password-email-sender';
import { ForgotPasswordEmail } from './mail/forgot-password.mail';

/**
 * Sends the forgotten-password email through @nestjs/mail, which already retries
 * transient failures. A failed send is logged, not rethrown: the response must
 * not reveal whether the account exists, and the user can ask for a new link.
 */
@Injectable()
export class NestForgotPasswordEmailSender implements ForgotPasswordEmailSender {
  private readonly logger = new Logger(NestForgotPasswordEmailSender.name);

  private RESET_PASSWORD_PATH = "/reinitialiser-mot-de-passe";

  constructor(
    private readonly mailer: Mailer,
    private readonly config: ConfigService
  ) {}

  async send(user: User, token: string) {
    const url = new URL(this.RESET_PASSWORD_PATH, this.config.getOrThrow<string>("FRONTEND_URL"));
    url.searchParams.set("token", token);

    try {
      await this.mailer.send(ForgotPasswordEmail, {
        to: { name: `${user.firstName} ${user.lastName}`, address: user.email },
        data: { firstName: user.firstName, url: url.toString() }
      });
    } catch (error) {
      if (!(error instanceof MailError)) {
        throw error;
      }
      this.logger.error(`Échec de l'envoi de l'email de réinitialisation de mot de passe ${user.id}`, error.stack);
    }
  }
}
