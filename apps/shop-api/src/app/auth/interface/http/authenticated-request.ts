import type { Request } from "express";

/** Request once JwtCookieAuthGuard has verified the access token: Passport sets `user` to the user id. */
export interface AuthenticatedRequest extends Request {
  user: string;
}
