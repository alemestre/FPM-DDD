import { PhoneNumber } from '../../shared/domain/value-objects/phone-number.value-object';
import { PostalCode } from '../../shared/domain/value-objects/postal-code.value-object';
import { EmailAlreadyUsedError } from '../domain/errors/email-already-used.error';
import type { PrismaService } from '../../../prisma/prisma.service';
import { Prisma } from '../../../generated/prisma/client';
import { User } from '../domain/user.entity';
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
  emailVerified: true,
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
  emailVerified: true,
};

describe('PrismaUserRepository', () => {
  let prisma: { user: { findUnique: jest.Mock; create: jest.Mock; update: jest.Mock } };
  let repository: PrismaUserRepository;

  beforeEach(() => {
    prisma = { user: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() } };
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

  describe('register', () => {
    const newUser = () =>
      User.reconstitute(USER_ID, 'marie.durand@example.fr', 'Marie', 'Durand', 'CUSTOMER', true, false);

    it('crée le compte et son profil client sans adresse', async () => {
      await repository.register({
        user: newUser(),
        passwordHash: '$argon2id$hash',
        phone: PhoneNumber.create('0612345678'),
      });

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          id: USER_ID,
          email: 'marie.durand@example.fr',
          passwordHash: '$argon2id$hash',
          firstName: 'Marie',
          lastName: 'Durand',
          role: 'CUSTOMER',
          isActive: true,
          emailVerified: false,
          customerProfile: {
            create: { phone: '+33612345678', addressLine1: null, addressLine2: '', postalCode: null, city: null },
          },
        },
      });
    });

    it("enregistre l'adresse quand elle est fournie", async () => {
      await repository.register({
        user: newUser(),
        passwordHash: '$argon2id$hash',
        phone: PhoneNumber.create('0612345678'),
        address: { line1: '1 rue des Lilas', line2: 'Bât. B', postalCode: PostalCode.create('75001'), city: 'Paris' },
      });

      expect(prisma.user.create.mock.calls[0][0].data.customerProfile.create).toEqual({
        phone: '+33612345678',
        addressLine1: '1 rue des Lilas',
        addressLine2: 'Bât. B',
        postalCode: '75001',
        city: 'Paris',
      });
    });

    it("lève EmailAlreadyUsedError si l'email est déjà pris (P2002)", async () => {
      const cause = new Prisma.PrismaClientKnownRequestError('Unique violation', { code: 'P2002', clientVersion: 'test' });
      prisma.user.create.mockRejectedValue(cause);

      const registration = { user: newUser(), passwordHash: 'h', phone: PhoneNumber.create('0612345678') };
      await expect(repository.register(registration)).rejects.toThrow(EmailAlreadyUsedError);
    });

    it('laisse passer les autres erreurs', async () => {
      const failure = new Error('connexion perdue');
      prisma.user.create.mockRejectedValue(failure);

      const registration = { user: newUser(), passwordHash: 'h', phone: PhoneNumber.create('0612345678') };
      await expect(repository.register(registration)).rejects.toBe(failure);
    });
  });

  describe('save', () => {
    it("enregistre l'état de vérification de l'email", async () => {
      const user = User.reconstitute(USER_ID, 'marie.durand@example.fr', 'Marie', 'Durand', 'CUSTOMER', true, false);
      user.verifyEmail();

      await repository.save(user);

      expect(prisma.user.update).toHaveBeenCalledWith({ where: { id: USER_ID }, data: { emailVerified: true } });
    });
  });
});
