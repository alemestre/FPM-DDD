import { DomainValidationError } from '../../shared/domain/errors/domain-validation.error';
import { User } from './user.entity';

const USER_ID = 'b1c2d3e4-5f60-4a7b-8c9d-0e1f2a3b4c5d';

describe('User', () => {
  it('reconstitue un client avec ses données', () => {
    const user = User.reconstitute(USER_ID, 'marie.durand@example.fr', 'Marie', 'Durand', 'CUSTOMER', true);

    expect(user.id).toBe(USER_ID);
    expect(user.email).toBe('marie.durand@example.fr');
    expect(user.firstName).toBe('Marie');
    expect(user.lastName).toBe('Durand');
    expect(user.role).toBe('CUSTOMER');
    expect(user.isActive).toBe(true);
  });

  it('reconstitue un administrateur', () => {
    const user = User.reconstitute(USER_ID, 'admin@example.fr', 'Alex', 'Martin', 'ADMIN', true);

    expect(user.role).toBe('ADMIN');
  });

  it("normalise l'adresse email", () => {
    const user = User.reconstitute(USER_ID, '  Marie.Durand@Example.FR ', 'Marie', 'Durand', 'CUSTOMER', true);

    expect(user.email).toBe('marie.durand@example.fr');
  });

  it('refuse une adresse email invalide', () => {
    expect(() => User.reconstitute(USER_ID, 'pas-un-email', 'Marie', 'Durand', 'CUSTOMER', true)).toThrow(
      DomainValidationError,
    );
  });
});
