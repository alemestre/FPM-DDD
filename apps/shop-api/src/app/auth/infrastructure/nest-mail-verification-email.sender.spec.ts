import { NestMailVerificationEmailSender } from './nest-mail-verification-email.sender';
import { VerifyEmailMail } from './mail/verify-email.mail';
import type { ConfigService } from '@nestjs/config';
import { MailError, type Mailer } from '@nestjs/mail';
import { User } from '../domain/user.entity';
import { Logger } from '@nestjs/common';

jest.mock('@nestjs/config', () => ({ ConfigService: class ConfigService {} }));

const USER_ID = 'b1c2d3e4-5f60-4a7b-8c9d-0e1f2a3b4c5d';

describe('NestMailVerificationEmailSender', () => {
  const user = User.reconstitute(USER_ID, 'marie.durand@example.fr', 'Marie', 'Durand', 'CUSTOMER', true, false);
  let mailer: { send: jest.Mock };
  let sender: NestMailVerificationEmailSender;

  beforeEach(() => {
    mailer = { send: jest.fn().mockResolvedValue({}) };
    const config = { getOrThrow: () => 'http://localhost:4200' } as unknown as ConfigService;
    sender = new NestMailVerificationEmailSender(mailer as unknown as Mailer, config);
  });

  afterEach(() => jest.restoreAllMocks());

  it("envoie l'email de vérification avec un lien vers le frontend", async () => {
    await sender.send(user, 'a.b+c/d');

    expect(mailer.send).toHaveBeenCalledWith(VerifyEmailMail, {
      to: { name: 'Marie Durand', address: 'marie.durand@example.fr' },
      data: { firstName: 'Marie', url: 'http://localhost:4200/verifier-email?token=a.b%2Bc%2Fd' },
    });
  });

  it("journalise un échec d'envoi sans le propager : le compte peut demander un nouveau lien", async () => {
    const logError = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    mailer.send.mockRejectedValue(new MailError('SMTP indisponible', { permanent: false }));

    await expect(sender.send(user, 'token')).resolves.toBeUndefined();
    expect(logError).toHaveBeenCalledWith(expect.stringContaining(USER_ID), expect.any(String));
  });

  it('propage les erreurs qui ne viennent pas du mailer', async () => {
    const bug = new TypeError('bug');
    mailer.send.mockRejectedValue(bug);

    await expect(sender.send(user, 'token')).rejects.toBe(bug);
  });
});
