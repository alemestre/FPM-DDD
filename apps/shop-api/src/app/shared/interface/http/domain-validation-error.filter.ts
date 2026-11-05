import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { DomainValidationError } from '../../domain/errors/domain-validation.error';
import type { Response } from 'express';

/**
 * Maps domain invariant violations to HTTP 400 instead of letting them surface as 500.
 */
@Catch(DomainValidationError)
export class DomainValidationErrorFilter implements ExceptionFilter<DomainValidationError> {
  catch(error: DomainValidationError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    response.status(HttpStatus.BAD_REQUEST).json({
      statusCode: HttpStatus.BAD_REQUEST,
      error: 'Bad Request',
      message: error.message,
    });
  }
}
