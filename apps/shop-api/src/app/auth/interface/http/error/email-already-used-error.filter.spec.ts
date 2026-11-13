import { EmailAlreadyUsedError } from '../../../domain/errors/email-already-used.error';
import { EmailAlreadyUsedErrorFilter } from './email-already-used-error.filter';
import type { ArgumentsHost } from '@nestjs/common';

describe('EmailAlreadyUsedErrorFilter', () => {
  it("renvoie une réponse 409 avec le message de l'erreur", () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const host = {
      switchToHttp: () => ({ getResponse: () => ({ status }) }),
    } as unknown as ArgumentsHost;
    const error = new EmailAlreadyUsedError();

    new EmailAlreadyUsedErrorFilter().catch(error, host);

    expect(status).toHaveBeenCalledWith(409);
    expect(json).toHaveBeenCalledWith({ statusCode: 409, error: 'Conflict', message: error.message });
  });
});
