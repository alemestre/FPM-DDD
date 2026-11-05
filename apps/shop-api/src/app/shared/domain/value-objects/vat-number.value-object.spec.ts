import { VatNumber } from './vat-number.value-object';

describe('VatNumber', () => {
  // SIREN 303265045 → clé = (12 + 3 × (303265045 mod 97)) mod 97 = 40
  const VALID = 'FR40303265045';

  it('crée un numéro de TVA valide', () => {
    expect(VatNumber.create(VALID).value).toBe(VALID);
  });

  it('accepte une clé à un chiffre préfixée par 0', () => {
    // SIREN 000000029 → clé = (12 + 3 × 29) mod 97 = 2 → "02"
    expect(VatNumber.create('FR02000000029').value).toBe('FR02000000029');
  });

  it('supprime les espaces au début et à la fin', () => {
    expect(VatNumber.create(`  ${VALID}  `).value).toBe(VALID);
  });

  it('supprime les espaces internes et met en majuscules', () => {
    expect(VatNumber.create(' fr 40 303 265 045 ').value).toBe(VALID);
  });

  it('expose le SIREN', () => {
    expect(VatNumber.create(VALID).siren).toBe('303265045');
  });

  it.each([
    ['vide', ''],
    ['uniquement des espaces', '   '],
    ['trop court', 'FR4030326504'],
    ['trop long', 'FR403032650451'],
    ['SIREN seul', '303265045'],
    ['null', null as unknown as string],
  ])('rejette un numéro %s (longueur)', (_label, raw) => {
    expect(() => VatNumber.create(raw)).toThrow('doit contenir 13 caractères');
  });

  it.each([
    ['avec un autre préfixe pays', 'XX40303265045'],
    ['sans préfixe FR', '4030326504512'],
    ['avec une lettre dans le SIREN', 'FR4030326504A'],
    ['avec une clé alphanumérique', 'FRA0303265045'],
    ['avec un caractère spécial', 'FR40-30326504'],
  ])('rejette un numéro %s (format)', (_label, raw) => {
    expect(() => VatNumber.create(raw)).toThrow('doit respecter le format');
  });

  it('rejette un numéro dont la clé est erronée', () => {
    expect(() => VatNumber.create('FR41303265045')).toThrow('clé du numéro de TVA');
  });

  it('compare par valeur', () => {
    expect(VatNumber.create(VALID).equals(VatNumber.create('fr40 303265045'))).toBe(true);
    expect(VatNumber.create(VALID).equals(VatNumber.create('FR02000000029'))).toBe(false);
  });
});
