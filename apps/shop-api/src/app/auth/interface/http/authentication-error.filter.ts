import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from "@nestjs/common";
import { AuthenticationError } from "../../domain/errors/authentication.error";
import type { Response } from "express";

/**
 * Maps authentication failures detected by the use cases to HTTP 401,
 * with the same body as Nest's UnauthorizedException.
 */
@Catch(AuthenticationError)
export class AuthenticationErrorFilter implements ExceptionFilter<AuthenticationError> {
  catch(error: AuthenticationError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    response.status(HttpStatus.UNAUTHORIZED).json({
      statusCode: HttpStatus.UNAUTHORIZED,
      error: "Unauthorized",
      message: error.message
    });
  }
}
