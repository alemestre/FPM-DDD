import { Email } from './email.value-object';

describe('Email', () => {
  it('crée un email valide', () => {
    expect(Email.create('jean.dupont@example.com').value).toBe('jean.dupont@example.com');
  });

  it('supprime les espaces au début et à la fin et met en minuscules', () => {
    expect(Email.create('  Jean.Dupont@Example.COM  ').value).toBe('jean.dupont@example.com');
  });

  it.each([
    ['vide', ''],
    ['uniquement des espaces', '   '],
    ['sans @', 'jean.dupont.example.com'],
    ['sans partie locale', '@example.com'],
    ['sans domaine', 'jean@'],
    ['sans extension de domaine', 'jean@example'],
    ['avec des points consécutifs', 'jean..dupont@example.com'],
    ['avec un espace interne', 'jean dupont@example.com'],
    ['null', null as unknown as string],
    ['undefined', undefined as unknown as string],
  ])('rejette un email %s', (_label, raw) => {
    expect(() => Email.create(raw)).toThrow("n'est pas valide");
  });

  it('compare par valeur', () => {
    expect(Email.create('a@example.com').equals(Email.create(' A@EXAMPLE.com '))).toBe(true);
    expect(Email.create('a@example.com').equals(Email.create('b@example.com'))).toBe(false);
  });

  it('expose sa valeur via toString', () => {
    expect(`${Email.create('a@example.com')}`).toBe('a@example.com');
  });
});
