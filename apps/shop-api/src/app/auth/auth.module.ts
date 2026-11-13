import { ResendVerificationEmailUseCase } from "./application/use-cases/resend-verification-email.use-case";
import { NestMailVerificationEmailSender } from "./infrastructure/nest-mail-verification-email.sender";
import { EmailNotVerifiedErrorFilter } from "./interface/http/error/email-not-verified-error.filter";
import { EmailAlreadyUsedErrorFilter } from "./interface/http/error/email-already-used-error.filter";
import { JwtEmailVerificationToken } from "./infrastructure/jwt-email-verification.token";
import { VerificationEmailSender } from "./application/ports/verification-email-sender";
import { EmailVerificationToken } from "./application/ports/email-verification-token";
import { VerifyEmailUseCase } from "./application/use-cases/verify-email.use-case";
import { RegisterUseCase } from "./application/use-cases/register.use-case";
import { createMailOptions } from "./infrastructure/mail/mail-options.factory";
import { VerifyEmailMail } from "./infrastructure/mail/verify-email.mail";
import { MailModule } from "@nestjs/mail";
import { GetCurrentUserUseCase } from "./application/use-cases/get-current-user.use-case";
import { AuthenticationErrorFilter } from "./interface/http/error/authentication-error.filter";
import { JwtCookieAuthGuard } from "./interface/http/guards/jwt-cookie-auth.guard";
import { JwtAccessTokenIssuer } from './infrastructure/jwt-access-token.issuer';
import { PrismaUserRepository } from "./infrastructure/prisma-user.repository";
import { Argon2PasswordHasher } from './infrastructure/argon2-password-hasher';
import { AccessTokenIssuer } from './application/ports/access-token-issuer';
import { LogInUseCase } from './application/use-cases/log-in.use-case';
import { PasswordHasher } from './application/ports/password-hasher';
import { AuthController } from "./interface/http/auth.controller";
import { ACCESS_TOKEN_TTL_SECONDS } from "./interface/http/auth.constants";
import { UserRepository } from "./domain/user.repository";
import { ConfigService } from "@nestjs/config";
import { APP_FILTER } from "@nestjs/core";
import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

@Module({
  imports: [
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
    JwtCookieAuthGuard,
    GetCurrentUserUseCase,
    RegisterUseCase,
    VerifyEmailUseCase,
    ResendVerificationEmailUseCase,
    VerifyEmailMail,
    { provide: UserRepository, useClass: PrismaUserRepository },
    { provide: APP_FILTER, useClass: AuthenticationErrorFilter },
    { provide: PasswordHasher, useClass: Argon2PasswordHasher },
    { provide: APP_FILTER, useClass: EmailAlreadyUsedErrorFilter },
    { provide: APP_FILTER, useClass: EmailNotVerifiedErrorFilter },
    { provide: AccessTokenIssuer, useClass: JwtAccessTokenIssuer },
    { provide: EmailVerificationToken, useClass: JwtEmailVerificationToken },
    { provide: VerificationEmailSender, useClass: NestMailVerificationEmailSender }
  ],
  // Lets other contexts protect their routes with the same guard.
  exports: [JwtModule, JwtCookieAuthGuard]
})
export class AuthModule {}
