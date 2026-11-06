import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import type { ApiResponseDto } from '@fpm/contracts';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';

/**
 * Wraps every successful handler result in the API response envelope. Handlers that
 * return nothing, such as 204 deletions, keep an empty body. Errors never reach this
 * interceptor's mapping: they are serialized by the exception filters.
 */
@Injectable()
export class ApiResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiResponseDto<T> | undefined
> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponseDto<T> | undefined> {
    return next
      .handle()
      .pipe(map((data) => (data === undefined ? undefined : { success: true, data })));
  }
}
