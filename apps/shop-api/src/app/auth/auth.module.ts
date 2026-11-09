import { GetCurrentUserUseCase } from "./application/use-cases/get-current-user.use-case";
import { AuthenticationErrorFilter } from "./interface/http/authentication-error.filter";
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
    })
  ],
  controllers: [AuthController],
  providers: [
    LogInUseCase,
    JwtCookieAuthGuard,
    GetCurrentUserUseCase,
    { provide: UserRepository, useClass: PrismaUserRepository },
    { provide: APP_FILTER, useClass: AuthenticationErrorFilter },
    { provide: PasswordHasher, useClass: Argon2PasswordHasher },
    { provide: AccessTokenIssuer, useClass: JwtAccessTokenIssuer }
  ],
  // Lets other contexts protect their routes with the same guard.
  exports: [JwtModule, JwtCookieAuthGuard]
})
export class AuthModule {}
