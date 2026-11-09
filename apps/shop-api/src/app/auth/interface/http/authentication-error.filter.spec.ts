import { AuthenticationError } from '../../domain/errors/authentication.error';
import { AuthenticationErrorFilter } from './authentication-error.filter';
import type { ArgumentsHost } from '@nestjs/common';

describe('AuthenticationErrorFilter', () => {
  it("renvoie une réponse 401 avec le message de l'erreur", () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const host = {
      switchToHttp: () => ({ getResponse: () => ({ status }) }),
    } as unknown as ArgumentsHost;

    new AuthenticationErrorFilter().catch(new AuthenticationError(), host);

    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Authentification requise',
    });
  });
});
