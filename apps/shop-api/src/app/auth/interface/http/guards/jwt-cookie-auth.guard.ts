import { JWT_COOKIE_STRATEGY } from "../strategies/jwt-cookie.strategy";
import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

/**
 * Lets the request through only with a valid access token in the HTTP-only
 * cookie (checked by JwtCookieStrategy), and exposes the user id it was issued
 * for through `request.user`.
 */
@Injectable()
export class JwtCookieAuthGuard extends AuthGuard(JWT_COOKIE_STRATEGY) {}
