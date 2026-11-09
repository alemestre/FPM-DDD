import { AuthenticationError } from '../../domain/errors/authentication.error';
import type { UserRepository } from '../../domain/user.repository';
import { GetCurrentUserUseCase } from './get-current-user.use-case';
import { User } from '../../domain/user.entity';

const USER_ID = 'b1c2d3e4-5f60-4a7b-8c9d-0e1f2a3b4c5d';

const existingUser = (isActive = true): User =>
  User.reconstitute(USER_ID, 'marie.durand@example.fr', 'Marie', 'Durand', 'CUSTOMER', isActive);

describe('GetCurrentUserUseCase', () => {
  let repository: jest.Mocked<UserRepository>;
  let useCase: GetCurrentUserUseCase;

  beforeEach(() => {
    repository = { findById: jest.fn(), findCredentialsByEmail: jest.fn() };
    useCase = new GetCurrentUserUseCase(repository);
  });

  it("retourne l'utilisateur actif lié à la session", async () => {
    const user = existingUser();
    repository.findById.mockResolvedValue(user);

    await expect(useCase.execute(USER_ID)).resolves.toBe(user);
    expect(repository.findById).toHaveBeenCalledWith(USER_ID);
  });

  it("refuse la session si l'utilisateur n'existe plus", async () => {
    repository.findById.mockResolvedValue(null);

    await expect(useCase.execute(USER_ID)).rejects.toBeInstanceOf(AuthenticationError);
  });

  it('refuse la session si le compte est désactivé', async () => {
    repository.findById.mockResolvedValue(existingUser(false));

    await expect(useCase.execute(USER_ID)).rejects.toBeInstanceOf(AuthenticationError);
  });
});
