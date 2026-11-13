import { EmailNotVerifiedError } from '../../../domain/errors/email-not-verified.error';
import { EmailNotVerifiedErrorFilter } from './email-not-verified-error.filter';
import type { ArgumentsHost } from '@nestjs/common';

describe('EmailNotVerifiedErrorFilter', () => {
  it("renvoie une réponse 403 avec le message de l'erreur", () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const host = {
      switchToHttp: () => ({ getResponse: () => ({ status }) }),
    } as unknown as ArgumentsHost;
    const error = new EmailNotVerifiedError();

    new EmailNotVerifiedErrorFilter().catch(error, host);

    expect(status).toHaveBeenCalledWith(403);
    expect(json).toHaveBeenCalledWith({ statusCode: 403, error: 'Forbidden', message: error.message });
  });
});
