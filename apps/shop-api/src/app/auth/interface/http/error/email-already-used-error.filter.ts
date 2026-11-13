import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from "@nestjs/common";
import { EmailAlreadyUsedError } from "../../../domain/errors/email-already-used.error";
import type { Response } from "express";

/** Maps a registration with an email already in use to HTTP 409. */
@Catch(EmailAlreadyUsedError)
export class EmailAlreadyUsedErrorFilter implements ExceptionFilter<EmailAlreadyUsedError> {
  catch(error: EmailAlreadyUsedError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    response.status(HttpStatus.CONFLICT).json({
      statusCode: HttpStatus.CONFLICT,
      error: "Conflict",
      message: error.message
    });
  }
}
