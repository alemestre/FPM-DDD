import { ForgotPasswordUseCase } from "./application/use-cases/forgot-password.use-case";
import { ForgotPasswordEmail } from "./infrastructure/mail/forgot-password.mail";
import { ResendVerificationEmailUseCase } from "./application/use-cases/resend-verification-email.use-case";
import { NestForgotPasswordEmailSender } from './infrastructure/nest-mail-forgot-password-email.sender';
import { NestMailVerificationEmailSender } from "./infrastructure/nest-mail-verification-email.sender";
import { EmailNotVerifiedErrorFilter } from "./interface/http/error/email-not-verified-error.filter";
import { EmailAlreadyUsedErrorFilter } from "./interface/http/error/email-already-used-error.filter";
import { AuthenticationErrorFilter } from "./interface/http/error/authentication-error.filter";
import { ForgotPasswordEmailSender } from './application/ports/forgot-password-email-sender';
import { JwtEmailVerificationToken } from "./infrastructure/jwt-email-verification.token";
import { GetCurrentUserUseCase } from "./application/use-cases/get-current-user.use-case";
import { JwtForgotPasswordToken } from './infrastructure/jwt-email-forgot-password.token';
import { ChangePasswordUseCase } from "./application/use-cases/change-password.use-case";
import { VerificationEmailSender } from "./application/ports/verification-email-sender";
import { EmailVerificationToken } from "./application/ports/email-verification-token";
import { JwtCookieStrategy } from "./interface/http/strategies/jwt-cookie.strategy";
import { VerifyEmailUseCase } from "./application/use-cases/verify-email.use-case";
import { JwtCookieAuthGuard } from "./interface/http/guards/jwt-cookie-auth.guard";
import { JwtAccessTokenIssuer } from './infrastructure/jwt-access-token.issuer';
import { ForgotPasswordToken } from './application/ports/forgot-password-token';
import { createMailOptions } from "./infrastructure/mail/mail-options.factory";
import { PrismaUserRepository } from "./infrastructure/prisma-user.repository";
import { Argon2PasswordHasher } from './infrastructure/argon2-password-hasher';
import { RegisterUseCase } from "./application/use-cases/register.use-case";
import { AccessTokenIssuer } from './application/ports/access-token-issuer';
import { ACCESS_TOKEN_TTL_SECONDS } from "./interface/http/auth.constants";
import { VerifyEmailMail } from "./infrastructure/mail/verify-email.mail";
import { LogInUseCase } from './application/use-cases/log-in.use-case';
import { PasswordHasher } from './application/ports/password-hasher';
import { AuthController } from "./interface/http/auth.controller";
import { UserRepository } from "./domain/user.repository";
import { PassportModule } from "@nestjs/passport";
import { ConfigService } from "@nestjs/config";
import { MailModule } from "@nestjs/mail";
import { APP_FILTER } from "@nestjs/core";
import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>("JWT_SECRET"),
        signOptions: { expiresIn: ACCESS_TOKEN_TTL_SECONDS }
      })
    }),
    MailModule.forRootAsync({
      inject: [ConfigService],
      useFactory: createMailOptions
    })
  ],
  controllers: [AuthController],
  providers: [
    LogInUseCase,
    RegisterUseCase,
    VerifyEmailMail,
    JwtCookieStrategy,
    VerifyEmailUseCase,
    JwtCookieAuthGuard,
    ChangePasswordUseCase,
    GetCurrentUserUseCase,
    ResendVerificationEmailUseCase,
    ForgotPasswordUseCase,
    ForgotPasswordEmail,
    { provide: UserRepository, useClass: PrismaUserRepository },
    { provide: APP_FILTER, useClass: AuthenticationErrorFilter },
    { provide: PasswordHasher, useClass: Argon2PasswordHasher },
    { provide: APP_FILTER, useClass: EmailAlreadyUsedErrorFilter },
    { provide: APP_FILTER, useClass: EmailNotVerifiedErrorFilter },
    { provide: AccessTokenIssuer, useClass: JwtAccessTokenIssuer },
    { provide: ForgotPasswordToken, useClass: JwtForgotPasswordToken },
    { provide: EmailVerificationToken, useClass: JwtEmailVerificationToken },
    { provide: VerificationEmailSender, useClass: NestMailVerificationEmailSender },
    { provide: ForgotPasswordEmailSender, useClass: NestForgotPasswordEmailSender }
  ],
  // Lets other contexts protect their routes with the same guard.
  exports: [JwtModule, JwtCookieAuthGuard]
})
export class AuthModule {}
