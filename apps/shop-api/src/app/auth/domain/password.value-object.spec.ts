import { DomainValidationError } from '../../shared/domain/errors/domain-validation.error';
import { Password } from './password.value-object';

describe('Password', () => {
  it.each([['MotDePasse1!'], ['Écureuil9?'], ['Abcdefg1€'], ['Pass word 1_']])('accepte %s', (raw) => {
    expect(Password.create(raw).value).toBe(raw);
  });

  it.each([
    ['trop court', 'Ab1!', 'au moins 8 caractères'],
    ['sans majuscule', 'motdepasse1!', 'une majuscule'],
    ['sans chiffre', 'MotDePasse!', 'un chiffre'],
    ['sans caractère spécial', 'MotDePasse1', 'un caractère spécial'],
    ['avec seulement un espace comme caractère spécial', 'Mot DePasse1', 'un caractère spécial'],
    ['trop long', `Aa1!${'x'.repeat(125)}`, 'au plus 128 caractères'],
  ])('refuse un mot de passe %s', (_case, raw, requirement) => {
    expect(() => Password.create(raw)).toThrow(DomainValidationError);
    expect(() => Password.create(raw)).toThrow(requirement);
  });

  it('liste toutes les règles non respectées', () => {
    expect(() => Password.create('abc')).toThrow(
      'Le mot de passe doit contenir au moins 8 caractères, une majuscule, un chiffre, un caractère spécial',
    );
  });
});
