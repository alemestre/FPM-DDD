import { PostalCode } from './postal-code.value-object';

describe('PostalCode', () => {
  it.each([
    ['Paris', '75001'],
    ['Ain', '01000'],
    ['Corse', '20000'],
    ['DOM (Réunion)', '97400'],
  ])('crée un code postal valide (%s)', (_label, raw) => {
    expect(PostalCode.create(raw).value).toBe(raw);
  });

  it('supprime les espaces au début et à la fin', () => {
    expect(PostalCode.create('  75001  ').value).toBe('75001');
  });

  it('supprime les espaces internes', () => {
    expect(PostalCode.create(' 75 001 ').value).toBe('75001');
  });

  it.each([
    ['vide', ''],
    ['uniquement des espaces', '   '],
    ['trop court', '7500'],
    ['trop long', '750011'],
    ['avec une lettre', '7500A'],
    ['département 00', '00100'],
    ['département 96', '96000'],
    ['avec un tiret', '75-001'],
    ['null', null as unknown as string],
  ])('rejette un code postal %s', (_label, raw) => {
    expect(() => PostalCode.create(raw)).toThrow("n'est pas valide");
  });

  it('compare par valeur', () => {
    expect(PostalCode.create('75001').equals(PostalCode.create(' 75 001'))).toBe(true);
    expect(PostalCode.create('75001').equals(PostalCode.create('75002'))).toBe(false);
  });

  it('expose sa valeur via toString', () => {
    expect(`${PostalCode.create('75001')}`).toBe('75001');
  });
});
