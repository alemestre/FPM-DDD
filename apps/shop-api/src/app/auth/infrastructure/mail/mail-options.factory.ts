import {
    FileMailTransport,
    FileTemplateEngine,
    type MailModuleOptions,
    SmtpTransport,
} from '@nestjs/mail';
import { join } from 'node:path';
import type { ConfigService } from '@nestjs/config';

/**
 * Mail templates, copied from `src/assets` next to the bundled `main.js` by the
 * webpack build (dev server included), so `__dirname` is the bundle's directory.
 */
export const MAIL_TEMPLATES_DIR = join(__dirname, 'assets', 'mail', 'templates');

/** Template that wraps every mail, see `layout.html`. */
export const MAIL_LAYOUT = 'layout';

/** Where development mail is written as `.eml` files when no SMTP server is set. */
export const DEV_MAIL_DIRECTORY = 'var/mail';

/**
 * Builds the @nestjs/mail options from the environment: SMTP when `SMTP_URL`
 * is set, otherwise `.eml` files in DEV_MAIL_DIRECTORY.
 */
export function createMailOptions(config: ConfigService): MailModuleOptions {
    const smtpUrl = config.get<string>('SMTP_URL');

    return {
        transport: smtpUrl
            ? new SmtpTransport({ url: smtpUrl })
            : new FileMailTransport({ directory: DEV_MAIL_DIRECTORY }),
        templates: new FileTemplateEngine({ dir: MAIL_TEMPLATES_DIR, layout: MAIL_LAYOUT }),
        from: config.getOrThrow<string>('MAIL_FROM'),
    };
}
