import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { AuthenticatedRequest } from "./authenticated-request";

/**
 * Id of the authenticated user. Only usable on routes protected by JwtCookieAuthGuard.
 */
export const AuthenticatedUserId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().authenticatedUserId
);
