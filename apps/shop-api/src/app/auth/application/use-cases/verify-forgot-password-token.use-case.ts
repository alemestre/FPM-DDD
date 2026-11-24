import { InvalidResetPasswordTokenError } from '../../domain/errors/invalid-reset-password-token.error';
import { ForgotPasswordToken } from '../ports/forgot-password-token';
import { UserRepository } from "../../domain/user.repository";
import { Inject } from "@nestjs/common";

/** Verify the forgot password token. */
export class VerifyForgotPasswordTokenUseCase {
  constructor(
    @Inject(UserRepository) private readonly repository: UserRepository,
    @Inject(ForgotPasswordToken) private readonly verificationToken: ForgotPasswordToken
  ) {}

  async execute(token: string): Promise<void> {
    const { user } = await this.verificationToken.verify(token, (id: string) => this.repository.findCredentialsById(id));

    // Same rule as ResetPasswordUseCase: never show a form that the submission would refuse.
    if (!user.isActive) {
      throw new InvalidResetPasswordTokenError();
    }
  }
}
