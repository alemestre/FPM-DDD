import { RESET_PASSWORD_TTL_SECONDS } from '../jwt-email-forgot-password.token';
import type { Mailable, MailTemplateContent } from '@nestjs/mail';
import { Injectable } from '@nestjs/common';

export interface ForgotPasswordMailData {
  readonly firstName: string;
  /** Link to the page where the user chooses a new password, with its token. */
  readonly url: string;
}

/**
 * Email sent on request with the link to choose a new password.
 * Rendered from `assets/mail/templates/forgot-password.html` (and `.txt`), which
 * escape every value they insert.
 */
@Injectable()
export class ForgotPasswordEmail implements Mailable<ForgotPasswordMailData> {
  render({ firstName, url }: ForgotPasswordMailData): MailTemplateContent {
    return {
      subject: 'Réinitialisation de votre mot de passe',
      template: 'forgot-password',
      context: { firstName, url, validityMinutes: RESET_PASSWORD_TTL_SECONDS / 60 },
    };
  }
}
