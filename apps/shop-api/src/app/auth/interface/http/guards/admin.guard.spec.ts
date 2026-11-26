import type { ExecutionContext } from '@nestjs/common';
import { GetCurrentUserUseCase } from '../../../application/use-cases/get-current-user.use-case';
import { AuthenticationError } from '../../../domain/errors/authentication.error';
import type { UserRepository } from '../../../domain/user.repository';
import { User, type UserRole } from '../../../domain/user.entity';
import { AdminGuard } from './admin.guard';

const USER_ID = 'b1c2d3e4-5f60-4a7b-8c9d-0e1f2a3b4c5d';

const existingUser = (role: UserRole, isActive = true): User =>
  User.reconstitute(USER_ID, 'marie.durand@example.fr', 'Marie', 'Durand', role, isActive, true);

/** Context as left by JwtCookieAuthGuard: `request.user` holds the user id. */
const contextFor = (userId: string) =>
  ({ switchToHttp: () => ({ getRequest: () => ({ user: userId }) }) }) as unknown as ExecutionContext;

describe('AdminGuard', () => {
  let repository: jest.Mocked<UserRepository>;
  let guard: AdminGuard;

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
      findCredentialsByEmail: jest.fn(),
      findCredentialsById: jest.fn(),
      register: jest.fn(),
      save: jest.fn(),
      savePasswordHash: jest.fn(),
    };
    guard = new AdminGuard(new GetCurrentUserUseCase(repository));
  });

  it('laisse passer un admin actif', async () => {
    repository.findById.mockResolvedValue(existingUser('ADMIN'));

    await expect(guard.canActivate(contextFor(USER_ID))).resolves.toBe(true);
    expect(repository.findById).toHaveBeenCalledWith(USER_ID);
  });

  it("refuse un client connecté (403)", async () => {
    repository.findById.mockResolvedValue(existingUser('CUSTOMER'));

    await expect(guard.canActivate(contextFor(USER_ID))).resolves.toBe(false);
  });

  it('refuse un admin désactivé dont le jeton est encore valide (401)', async () => {
    repository.findById.mockResolvedValue(existingUser('ADMIN', false));

    await expect(guard.canActivate(contextFor(USER_ID))).rejects.toBeInstanceOf(AuthenticationError);
  });

  it("refuse un jeton dont le compte n'existe plus (401)", async () => {
    repository.findById.mockResolvedValue(null);

    await expect(guard.canActivate(contextFor(USER_ID))).rejects.toBeInstanceOf(AuthenticationError);
  });
});
