import type { Request } from "express";

/** Request once JwtCookieAuthGuard has verified the access token. */
export interface AuthenticatedRequest extends Request {
  authenticatedUserId: string;
}
