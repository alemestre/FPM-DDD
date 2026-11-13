import { ACCESS_TOKEN_COOKIE, ACCESS_TOKEN_COOKIE_OPTIONS, ACCESS_TOKEN_TTL_SECONDS } from "./auth.constants";
import { Body, Controller, Get, HttpCode, HttpStatus, Post, Res, UseGuards } from "@nestjs/common";
import { GetCurrentUserUseCase } from "../../application/use-cases/get-current-user.use-case";
import { ResendVerificationEmailUseCase } from "../../application/use-cases/resend-verification-email.use-case";
import { VerifyEmailUseCase } from "../../application/use-cases/verify-email.use-case";
import { RegisterUseCase } from "../../application/use-cases/register.use-case";
import { LogInUseCase } from "../../application/use-cases/log-in.use-case";
import { ResendVerificationDTO } from "./dto/resend-verification.dto";
import { VerifyEmailDTO } from "./dto/verify-email.dto";
import { RegisterDTO } from "./dto/register.dto";
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
    private readonly logIn: LogInUseCase,
    private readonly register: RegisterUseCase,
    private readonly verifyEmail: VerifyEmailUseCase,
    private readonly resendVerificationEmail: ResendVerificationEmailUseCase
  ) {}

  /**
   * Creates a customer account and emails a verification link. No session is
   * opened: login is refused until the email is verified.
   */
  @Post("register")
  async registerCustomer(@Body() body: RegisterDTO): Promise<CurrentUserResponseDto> {
    const { addressLine1, addressLine2, postalCode, city, email, firstName, lastName, phone, password } = body;
    const account = { email, firstName, lastName, phone, password }
    const address =
      addressLine1 !== undefined && postalCode !== undefined && city !== undefined
        ? { line1: addressLine1, line2: addressLine2, postalCode, city }
        : undefined;

    return toCurrentUserResponse(await this.register.execute({ ...account, address }));
  }

  /** Confirms the email with the token from the verification link. */
  @Post("verify-email")
  @HttpCode(HttpStatus.NO_CONTENT)
  async confirmEmail(@Body() { token }: VerifyEmailDTO): Promise<void> {
    await this.verifyEmail.execute(token);
  }

  /** Always 204, whether or not an email was sent, so accounts cannot be probed. */
  @Post("resend-verification")
  @HttpCode(HttpStatus.NO_CONTENT)
  async resendVerification(@Body() { email }: ResendVerificationDTO): Promise<void> {
    await this.resendVerificationEmail.execute(email);
  }

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
