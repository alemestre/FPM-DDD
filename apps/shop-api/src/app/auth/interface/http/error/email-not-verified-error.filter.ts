import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from "@nestjs/common";
import { EmailNotVerifiedError } from "../../../domain/errors/email-not-verified.error";
import type { Response } from "express";

/**
 * Maps a login on an account whose email is not verified yet to HTTP 403:
 * the credentials are right, but the account may not sign in yet.
 */
@Catch(EmailNotVerifiedError)
export class EmailNotVerifiedErrorFilter implements ExceptionFilter<EmailNotVerifiedError> {
  catch(error: EmailNotVerifiedError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    response.status(HttpStatus.FORBIDDEN).json({
      statusCode: HttpStatus.FORBIDDEN,
      error: "Forbidden",
      message: error.message
    });
  }
}
