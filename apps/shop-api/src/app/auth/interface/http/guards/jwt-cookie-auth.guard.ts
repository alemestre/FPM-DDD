import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import type { AuthenticatedRequest } from "../authenticated-request";
import { ACCESS_TOKEN_COOKIE } from "../auth.constants";
import { JwtService } from "@nestjs/jwt";

interface AccessTokenPayload {
  sub?: unknown;
}

/**
 * Lets the request through only with a valid access token in the HTTP-only
 * cookie, and exposes the user id it was issued for (`sub` claim).
 * Requires cookie-parser (registered in main.ts).
 */
@Injectable()
export class JwtCookieAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token: unknown = request.cookies?.[ACCESS_TOKEN_COOKIE];

    if (typeof token !== "string" || token === "") {
      throw new UnauthorizedException();
    }

    let payload: AccessTokenPayload;
    try {
      // Checks the signature and the expiry (exp).
      payload = await this.jwtService.verifyAsync<AccessTokenPayload>(token);
    } catch {
      throw new UnauthorizedException();
    }

    if (typeof payload.sub !== "string" || payload.sub === "") {
      throw new UnauthorizedException();
    }

    request.authenticatedUserId = payload.sub;
    return true;
  }
}
