import { DomainValidationError } from '../../shared/domain/errors/domain-validation.error';
import { User } from './user.entity';

const USER_ID = 'b1c2d3e4-5f60-4a7b-8c9d-0e1f2a3b4c5d';

describe('User', () => {
  it('reconstitue un client avec ses données', () => {
    const user = User.reconstitute(USER_ID, 'marie.durand@example.fr', 'Marie', 'Durand', 'CUSTOMER', true, true);

    expect(user.id).toBe(USER_ID);
    expect(user.email).toBe('marie.durand@example.fr');
    expect(user.firstName).toBe('Marie');
    expect(user.lastName).toBe('Durand');
    expect(user.role).toBe('CUSTOMER');
    expect(user.isActive).toBe(true);
  });

  it('reconstitue un administrateur', () => {
    const user = User.reconstitute(USER_ID, 'admin@example.fr', 'Alex', 'Martin', 'ADMIN', true, true);

    expect(user.role).toBe('ADMIN');
  });

  it("normalise l'adresse email", () => {
    const user = User.reconstitute(USER_ID, '  Marie.Durand@Example.FR ', 'Marie', 'Durand', 'CUSTOMER', true, true);

    expect(user.email).toBe('marie.durand@example.fr');
  });

  it('refuse une adresse email invalide', () => {
    expect(() => User.reconstitute(USER_ID, 'pas-un-email', 'Marie', 'Durand', 'CUSTOMER', true, true)).toThrow(
      DomainValidationError,
    );
  });

  it("reconstitue l'état de vérification de l'email", () => {
    expect(User.reconstitute(USER_ID, 'a@example.fr', 'Marie', 'Durand', 'CUSTOMER', true, false).emailVerified).toBe(
      false,
    );
  });

  describe('register', () => {
    const props = { email: ' Marie.Durand@Example.FR ', firstName: ' Marie ', lastName: ' Durand ' };

    it('crée un client actif, avec un email non vérifié et un nouvel identifiant', () => {
      const user = User.register(props);

      expect(user.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
      expect(user).toMatchObject({
        email: 'marie.durand@example.fr',
        firstName: 'Marie',
        lastName: 'Durand',
        role: 'CUSTOMER',
        isActive: true,
        emailVerified: false,
      });
      expect(User.register(props).id).not.toBe(user.id);
    });

    it.each([
      ['un prénom vide', { ...props, firstName: '   ' }],
      ['un nom vide', { ...props, lastName: '' }],
      ['un email invalide', { ...props, email: 'pas-un-email' }],
    ])('refuse %s', (_case, invalid) => {
      expect(() => User.register(invalid)).toThrow(DomainValidationError);
    });
  });

  describe('verifyEmail', () => {
    it("marque l'email comme vérifié, et peut être rappelé sans effet", () => {
      const user = User.register({ email: 'marie@example.fr', firstName: 'Marie', lastName: 'Durand' });

      user.verifyEmail();
      user.verifyEmail();

      expect(user.emailVerified).toBe(true);
    });
  });
});
