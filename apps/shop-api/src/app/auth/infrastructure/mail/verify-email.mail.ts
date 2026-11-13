import { EMAIL_VERIFICATION_TTL_SECONDS } from '../jwt-email-verification.token';
import type { Mailable, MailTemplateContent } from '@nestjs/mail';
import { Injectable } from '@nestjs/common';

export interface VerifyEmailMailData {
  readonly firstName: string;
  /** Verification link, with its token. */
  readonly url: string;
}

/**
 * Email sent at registration (and on request) with the verification link.
 * Rendered from `assets/mail/templates/verify-email.html` (and `.txt`), which
 * escape every value they insert.
 */
@Injectable()
export class VerifyEmailMail implements Mailable<VerifyEmailMailData> {
  render({ firstName, url }: VerifyEmailMailData): MailTemplateContent {
    return {
      subject: 'Confirmez votre adresse email',
      template: 'verify-email',
      context: { firstName, url, validityHours: EMAIL_VERIFICATION_TTL_SECONDS / 3600 },
    };
  }
}
