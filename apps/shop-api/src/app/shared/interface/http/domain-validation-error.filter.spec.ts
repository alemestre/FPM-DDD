import { DomainValidationError } from '../../domain/errors/domain-validation.error';
import { DomainValidationErrorFilter } from './domain-validation-error.filter';
import type { ArgumentsHost } from '@nestjs/common';

describe('DomainValidationErrorFilter', () => {
  it('renvoie une réponse 400 avec le message de l’erreur de domaine', () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const host = {
      switchToHttp: () => ({ getResponse: () => ({ status }) }),
    } as unknown as ArgumentsHost;

    new DomainValidationErrorFilter().catch(
      new DomainValidationError('La clé du numéro de TVA "FR41303265045" est invalide'),
      host,
    );

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      statusCode: 400,
      error: 'Bad Request',
      message: 'La clé du numéro de TVA "FR41303265045" est invalide',
    });
  });
});
