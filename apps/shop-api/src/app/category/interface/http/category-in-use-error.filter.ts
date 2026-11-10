import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from "@nestjs/common";
import { CategoryInUseError } from "../../domain/errors/category-in-use.error";
import type { Response } from "express";

/**
 * Maps the deletion of a category still used by products to HTTP 409.
 */
@Catch(CategoryInUseError)
export class CategoryInUseErrorFilter implements ExceptionFilter<CategoryInUseError> {
  catch(error: CategoryInUseError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    response.status(HttpStatus.CONFLICT).json({
      statusCode: HttpStatus.CONFLICT,
      error: "Conflict",
      message: error.message
    });
  }
}
