import { ResendVerificationEmailUseCase } from "../../application/use-cases/resend-verification-email.use-case";
import { ACCESS_TOKEN_COOKIE, ACCESS_TOKEN_COOKIE_OPTIONS, ACCESS_TOKEN_TTL_SECONDS } from "./auth.constants";
import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post, Res, UseGuards } from "@nestjs/common";
import { GetCurrentUserUseCase } from "../../application/use-cases/get-current-user.use-case";
import { ChangePasswordUseCase } from "../../application/use-cases/change-password.use-case";
import { ForgotPasswordUseCase } from '../../application/use-cases/forgot-password.use-case';
import { VerifyEmailUseCase } from "../../application/use-cases/verify-email.use-case";
import { RegisterUseCase } from "../../application/use-cases/register.use-case";
import { LogInUseCase } from "../../application/use-cases/log-in.use-case";
import { AuthenticatedUserId } from "./authenticated-user-id.decorator";
import { toCurrentUserResponse } from "./current-user.response.mapper";
import { ResendVerificationDTO } from "./dto/resend-verification.dto";
import { JwtCookieAuthGuard } from "./guards/jwt-cookie-auth.guard";
import { ChangePasswordDTO } from "./dto/change-password.dto";
import type { CurrentUserResponseDto } from "@fpm/contracts";
import { ForgotPasswordDTO } from "./dto/forgot-password.dto";
import { VerifyEmailDTO } from "./dto/verify-email.dto";
import { RegisterDTO } from "./dto/register.dto";
import { LoginDTO } from "./dto/login.dto";
import type { Response } from "express";

@Controller()
export class AuthController {
  constructor(
    private readonly getCurrentUser: GetCurrentUserUseCase,
    private readonly logIn: LogInUseCase,
    private readonly register: RegisterUseCase,
    private readonly verifyEmail: VerifyEmailUseCase,
    private readonly resendVerificationEmail: ResendVerificationEmailUseCase,
    private readonly changePassword: ChangePasswordUseCase,
    private readonly forgotPassword: ForgotPasswordUseCase
  ) {}

  /**
   * Creates a customer account and emails a verification link. No session is
   * opened: login is refused until the email is verified.
   */
  @Post("register")
  async registerCustomer(@Body() body: RegisterDTO): Promise<CurrentUserResponseDto> {
    const { addressLine1, addressLine2, postalCode, city, email, firstName, lastName, phone, password } = body;
    const account = { email, firstName, lastName, phone, password }
    const address = { line1: addressLine1, line2: addressLine2, postalCode, city };

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

  /**
   * Changes the password of the signed-in user. A wrong current password is a 400,
   * not a 401: the session is valid and must not look expired to the client.
   */
  @Patch("me/password")
  @UseGuards(JwtCookieAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async updatePassword(@AuthenticatedUserId() userId: string, @Body() body: ChangePasswordDTO): Promise<void> {
    await this.changePassword.execute(userId, body);
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

  @Post("forgot-password")
  @HttpCode(HttpStatus.NO_CONTENT)
  async sendForgotPassword(@Body() { email }: ForgotPasswordDTO): Promise<void> {
    await this.forgotPassword.execute(email);
  }
}
