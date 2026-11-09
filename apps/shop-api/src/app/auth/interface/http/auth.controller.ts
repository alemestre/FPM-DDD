import { ACCESS_TOKEN_COOKIE, ACCESS_TOKEN_COOKIE_OPTIONS, ACCESS_TOKEN_TTL_SECONDS } from "./auth.constants";
import { Body, Controller, Get, HttpCode, HttpStatus, Post, Res, UseGuards } from "@nestjs/common";
import { GetCurrentUserUseCase } from "../../application/use-cases/get-current-user.use-case";
import { LogInUseCase } from "../../application/use-cases/log-in.use-case";
import { AuthenticatedUserId } from "./authenticated-user-id.decorator";
import { toCurrentUserResponse } from "./current-user.response.mapper";
import { JwtCookieAuthGuard } from "./guards/jwt-cookie-auth.guard";
import type { CurrentUserResponseDto } from "@fpm/contracts";
import { LoginDTO } from "./dto/login.dto";
import type { Response } from "express";

@Controller()
export class AuthController {
  constructor(
    private readonly getCurrentUser: GetCurrentUserUseCase,
    private readonly logIn: LogInUseCase
  ) {}

  /** Profile of the user behind the session cookie; 401 when there is none. */
  @Get("me")
  @UseGuards(JwtCookieAuthGuard)
  async me(@AuthenticatedUserId() userId: string): Promise<CurrentUserResponseDto> {
    return toCurrentUserResponse(await this.getCurrentUser.execute(userId));
  }

  /** Sets the access token cookie and returns the profile, like GET /me. */
  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() credentials: LoginDTO,
    @Res({ passthrough: true }) response: Response
  ): Promise<CurrentUserResponseDto> {
    const { accessToken, user } = await this.logIn.execute(credentials);
    response.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
      ...ACCESS_TOKEN_COOKIE_OPTIONS,
      maxAge: ACCESS_TOKEN_TTL_SECONDS * 1000
    });
    return toCurrentUserResponse(user);
  }

  /**
   * Removes the cookie. No guard: an expired session must still be able to log out.
   * The token itself stays valid until it expires (no revocation list yet).
   */
  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Res({ passthrough: true }) response: Response): void {
    response.clearCookie(ACCESS_TOKEN_COOKIE, ACCESS_TOKEN_COOKIE_OPTIONS);
  }
}
