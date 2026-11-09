import { AccessTokenIssuer } from "../application/ports/access-token-issuer";
import type { User } from "../domain/user.entity";
import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

/**
 * The token only carries the user id (`sub`): its payload is readable by anyone,
 * and profile data would go stale. GET /me reads the profile from the database.
 * The expiry comes from the JwtModule signOptions.
 */
@Injectable()
export class JwtAccessTokenIssuer implements AccessTokenIssuer {
  constructor(private readonly jwtService: JwtService) {}

  issue(user: User): Promise<string> {
    return this.jwtService.signAsync({ sub: user.id });
  }
}
