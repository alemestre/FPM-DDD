import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { ACCESS_TOKEN_COOKIE } from "../auth.constants";
import { ConfigService } from "@nestjs/config";
import type { Request } from "express";

/** Name under which the strategy is registered with Passport (see JwtCookieAuthGuard). */
export const JWT_COOKIE_STRATEGY = "jwt-cookie";

interface AccessTokenPayload {
  sub?: unknown;
  purpose?: unknown;
}

const extractAccessTokenFromCookie = (request: Request): string | null => {
  const token: unknown = request.cookies?.[ACCESS_TOKEN_COOKIE];
  return typeof token === "string" && token !== "" ? token : null;
};

/**
 * Reads the access token from the HTTP-only cookie, checks its signature and
 * expiry (exp), and returns the user id it was issued for (`sub` claim).
 * Passport stores that id in `request.user`.
 * Requires cookie-parser (registered in main.ts).
 */
@Injectable()
export class JwtCookieStrategy extends PassportStrategy(Strategy, JWT_COOKIE_STRATEGY) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([extractAccessTokenFromCookie]),
      secretOrKey: config.getOrThrow<string>("JWT_SECRET"),
      algorithms: ["HS256"],
      ignoreExpiration: false
    });
  }

  validate(payload: AccessTokenPayload): string {
    // Access tokens carry no `purpose`: tokens signed for another use, such as
    // the email verification link, must not open a session.
    if (payload.purpose !== undefined || typeof payload.sub !== "string" || payload.sub === "") {
      throw new UnauthorizedException();
    }
    return payload.sub;
  }
}
