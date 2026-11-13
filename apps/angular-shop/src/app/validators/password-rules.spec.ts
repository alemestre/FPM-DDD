import { passwordRuleErrors } from './password-rules';

describe('passwordRuleErrors', () => {
  it.each(['MotDePasse1!', 'Écureuil9?', 'Abcdefg1€'])('accepte %s', (value) => {
    expect(passwordRuleErrors(value)).toEqual([]);
  });

  it('liste chaque règle non respectée', () => {
    expect(passwordRuleErrors('abc').map(({ kind }) => kind)).toEqual(['minLength', 'uppercase', 'digit', 'special']);
  });

  it("ne compte pas un espace comme caractère spécial", () => {
    expect(passwordRuleErrors('Mot DePasse1').map(({ kind }) => kind)).toEqual(['special']);
  });
});
