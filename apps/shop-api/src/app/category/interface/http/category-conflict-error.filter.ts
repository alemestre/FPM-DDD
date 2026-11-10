import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from "@nestjs/common";
import { CategorySlugAlreadyUsedError } from "../../domain/errors/category-slug-already-used.error";
import { CategoryInUseError } from "../../domain/errors/category-in-use.error";
import type { Response } from "express";

type CategoryConflictError = CategoryInUseError | CategorySlugAlreadyUsedError;

/**
 * Maps category conflicts to HTTP 409: deleting a category still used by
 * products, or saving one whose slug is already taken.
 */
@Catch(CategoryInUseError, CategorySlugAlreadyUsedError)
export class CategoryConflictErrorFilter implements ExceptionFilter<CategoryConflictError> {
  catch(error: CategoryConflictError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    response.status(HttpStatus.CONFLICT).json({
      statusCode: HttpStatus.CONFLICT,
      error: "Conflict",
      message: error.message
    });
  }
}
