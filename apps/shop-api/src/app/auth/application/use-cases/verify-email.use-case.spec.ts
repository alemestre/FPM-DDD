import { InvalidVerificationTokenError } from '../../domain/errors/invalid-verification-token.error';
import type { EmailVerificationToken } from '../ports/email-verification-token';
import type { UserRepository } from '../../domain/user.repository';
import { VerifyEmailUseCase } from './verify-email.use-case';
import { User } from '../../domain/user.entity';

const USER_ID = 'b1c2d3e4-5f60-4a7b-8c9d-0e1f2a3b4c5d';

const userWith = (emailVerified: boolean) =>
  User.reconstitute(USER_ID, 'marie.durand@example.fr', 'Marie', 'Durand', 'CUSTOMER', true, emailVerified);

describe('VerifyEmailUseCase', () => {
  let repository: jest.Mocked<UserRepository>;
  let verificationToken: jest.Mocked<EmailVerificationToken>;
  let useCase: VerifyEmailUseCase;

  beforeEach(() => {
    repository = { findById: jest.fn(), findCredentialsByEmail: jest.fn(), register: jest.fn(), save: jest.fn() };
    verificationToken = { issue: jest.fn(), verify: jest.fn().mockResolvedValue(USER_ID) };
    useCase = new VerifyEmailUseCase(repository, verificationToken);
  });

  it("vérifie l'email du compte désigné par le jeton", async () => {
    const user = userWith(false);
    repository.findById.mockResolvedValue(user);

    await useCase.execute('verification.jwt');

    expect(verificationToken.verify).toHaveBeenCalledWith('verification.jwt');
    expect(repository.findById).toHaveBeenCalledWith(USER_ID);
    expect(user.emailVerified).toBe(true);
    expect(repository.save).toHaveBeenCalledWith(user);
  });

  it("ne réécrit rien si l'email est déjà vérifié", async () => {
    repository.findById.mockResolvedValue(userWith(true));

    await useCase.execute('verification.jwt');

    expect(repository.save).not.toHaveBeenCalled();
  });

  it('refuse un jeton invalide', async () => {
    verificationToken.verify.mockRejectedValue(new InvalidVerificationTokenError());

    await expect(useCase.execute('falsifié')).rejects.toThrow(InvalidVerificationTokenError);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it("refuse un jeton dont le compte n'existe plus", async () => {
    repository.findById.mockResolvedValue(null);

    await expect(useCase.execute('verification.jwt')).rejects.toThrow(InvalidVerificationTokenError);
    expect(repository.save).not.toHaveBeenCalled();
  });
});
