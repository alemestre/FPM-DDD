import { DomainValidationError } from '../errors/domain-validation.error';
import { PhoneNumber } from './phone-number.value-object';

describe('PhoneNumber', () => {
  it.each([
    ['mobile national', '0612345678', '+33612345678'],
    ['mobile 07', '0712345678', '+33712345678'],
    ['fixe', '0145678910', '+33145678910'],
    ['numéro 09', '0912345678', '+33912345678'],
    ['international +33', '+33612345678', '+33612345678'],
    ['international 0033', '0033612345678', '+33612345678'],
  ])('crée un numéro valide (%s)', (_label, raw, expected) => {
    expect(PhoneNumber.create(raw).value).toBe(expected);
  });

  it('supprime les espaces au début et à la fin', () => {
    expect(PhoneNumber.create('  0612345678  ').value).toBe('+33612345678');
  });

  it.each([
    ['espaces', '06 12 34 56 78'],
    ['points', '06.12.34.56.78'],
    ['tirets', '06-12-34-56-78'],
    ['(0) international', '+33 (0)6 12 34 56 78'],
  ])('accepte les séparateurs usuels (%s)', (_label, raw) => {
    expect(PhoneNumber.create(raw).value).toBe('+33612345678');
  });

  it.each([
    ['vide', ''],
    ['uniquement des espaces', '   '],
    ['trop court', '061234567'],
    ['trop long', '06123456789'],
    ['commençant par 00 après le 0', '0012345678'],
    ['+33 suivi de 0', '+330612345678'],
    ['indicatif étranger', '+32612345678'],
    ['avec une lettre', '06123456A8'],
    ['null', null as unknown as string],
  ])('rejette un numéro %s', (_label, raw) => {
    expect(() => PhoneNumber.create(raw)).toThrow("n'est pas valide");
  });

  it.each([
    ['fixe Réunion', '0262 12 34 56', '+262262123456'],
    ['mobile Réunion', '0692 12 34 56', '+262692123456'],
    ['fixe Mayotte', '0269 12 34 56', '+262269123456'],
    ['mobile Mayotte', '0639 12 34 56', '+262639123456'],
    ['fixe Guadeloupe', '0590 12 34 56', '+590590123456'],
    ['mobile Guadeloupe', '0690 12 34 56', '+590690123456'],
    ['fixe Martinique', '0596 12 34 56', '+596596123456'],
    ['mobile Martinique', '0696 12 34 56', '+596696123456'],
    ['fixe Guyane', '0594 12 34 56', '+594594123456'],
    ['mobile Guyane', '0694 12 34 56', '+594694123456'],
  ])('convertit un numéro national des DOM avec le bon indicatif (%s)', (_label, raw, expected) => {
    expect(PhoneNumber.create(raw).value).toBe(expected);
  });

  it.each([
    ['+262', '+262 692 12 34 56', '+262692123456'],
    ['00262', '00262 262 12 34 56', '+262262123456'],
    ['+262 (0)', '+262 (0)692 12 34 56', '+262692123456'],
    ['+590', '+590 690 12 34 56', '+590690123456'],
    ['+594', '+594 594 12 34 56', '+594594123456'],
    ['+596', '+596 696 12 34 56', '+596696123456'],
  ])('accepte un numéro des DOM au format international (%s)', (_label, raw, expected) => {
    expect(PhoneNumber.create(raw).value).toBe(expected);
  });

  it.each([
    ['DOM saisi avec +33', '+33 262 12 34 56'],
    ['métropole saisi avec +262', '+262 6 12 34 56 78'],
    ['Réunion saisi avec +590', '+590 692 12 34 56'],
  ])("rejette un indicatif qui ne correspond pas au territoire (%s)", (_label, raw) => {
    expect(() => PhoneNumber.create(raw)).toThrow('ne correspond pas à son territoire');
  });

  it.each([
    ['Saint-Pierre-et-Miquelon', '+508 41 23 45'],
    ['Polynésie', '+689 87 12 34 56'],
    ['Nouvelle-Calédonie', '+687 12 34 56'],
  ])("rejette un numéro de COM/TOM (%s)", (_label, raw) => {
    expect(() => PhoneNumber.create(raw)).toThrow("n'est pas valide");
  });

  it('accepte un fixe métropolitain dont le préfixe ressemble à un DOM', () => {
    // 02 61 : Bretagne / Pays de la Loire, pas la Réunion (02 62)
    expect(PhoneNumber.create('02 61 12 34 56').value).toBe('+33261123456');
  });

  it('lève une DomainValidationError', () => {
    expect(() => PhoneNumber.create('12345')).toThrow(DomainValidationError);
  });

  it('compare par valeur après normalisation', () => {
    expect(PhoneNumber.create('06 12 34 56 78').equals(PhoneNumber.create('+33612345678'))).toBe(true);
    expect(PhoneNumber.create('0612345678').equals(PhoneNumber.create('0612345679'))).toBe(false);
  });

  it('expose sa valeur via toString', () => {
    expect(`${PhoneNumber.create('0612345678')}`).toBe('+33612345678');
  });
});
