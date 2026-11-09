import type { PrismaService } from '../../../prisma/prisma.service';
import { PrismaUserRepository } from './prisma-user.repository';

jest.mock('../../../prisma/prisma.service', () => ({ PrismaService: class {} }));

const USER_ID = 'b1c2d3e4-5f60-4a7b-8c9d-0e1f2a3b4c5d';

const userRow = (overrides: Record<string, unknown> = {}) => ({
  uid: 1,
  id: USER_ID,
  email: 'marie.durand@example.fr',
  passwordHash: '$argon2id$hash',
  firstName: 'Marie',
  lastName: 'Durand',
  role: 'CUSTOMER',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const expectedUser = {
  id: USER_ID,
  email: 'marie.durand@example.fr',
  firstName: 'Marie',
  lastName: 'Durand',
  role: 'CUSTOMER',
  isActive: true,
};

describe('PrismaUserRepository', () => {
  let prisma: { user: { findUnique: jest.Mock } };
  let repository: PrismaUserRepository;

  beforeEach(() => {
    prisma = { user: { findUnique: jest.fn() } };
    repository = new PrismaUserRepository(prisma as unknown as PrismaService);
  });

  describe('findById', () => {
    it("reconstitue l'utilisateur à partir de la ligne", async () => {
      prisma.user.findUnique.mockResolvedValue(userRow());

      const user = await repository.findById(USER_ID);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: USER_ID } });
      expect(user).toMatchObject(expectedUser);
    });

    it('reconstitue un administrateur', async () => {
      prisma.user.findUnique.mockResolvedValue(userRow({ role: 'ADMIN' }));

      expect((await repository.findById(USER_ID))?.role).toBe('ADMIN');
    });

    it("retourne null si l'utilisateur n'existe pas", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(repository.findById(USER_ID)).resolves.toBeNull();
    });
  });

  describe('findCredentialsByEmail', () => {
    it("retourne l'utilisateur et le hash de son mot de passe", async () => {
      prisma.user.findUnique.mockResolvedValue(userRow());

      const credentials = await repository.findCredentialsByEmail('marie.durand@example.fr');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'marie.durand@example.fr' } });
      expect(credentials?.passwordHash).toBe('$argon2id$hash');
      expect(credentials?.user).toMatchObject(expectedUser);
    });

    it("retourne null si aucun compte n'a cet email", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(repository.findCredentialsByEmail('inconnu@example.fr')).resolves.toBeNull();
    });
  });
});
