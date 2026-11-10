import { DomainValidationError } from '../errors/domain-validation.error';
import { Slug } from './slug.value-object';

describe('Slug', () => {
  describe('fromText', () => {
    it.each([
      ['Fruits', 'fruits'],
      ['  Fruits  ', 'fruits'],
      ['Fruits & Légumes', 'fruits-legumes'],
      ['Crèmerie / Fromagerie', 'cremerie-fromagerie'],
      ['Œufs frais', 'oeufs-frais'],
      ['Vins--rouges__2024', 'vins-rouges-2024'],
      ["Pain d'épices", 'pain-d-epices'],
      ['ÇA VA', 'ca-va'],
    ])('transforme %p en %p', (text, expected) => {
      expect(Slug.fromText(text).toString()).toBe(expected);
    });

    it.each(['', '   ', '!!!', '—'])('rejette %p qui ne contient ni lettre ni chiffre', (text) => {
      expect(() => Slug.fromText(text)).toThrow(DomainValidationError);
    });
  });

  describe('create', () => {
    it('accepte un slug déjà normalisé', () => {
      expect(Slug.create('fruits-legumes').toString()).toBe('fruits-legumes');
    });

    it.each(['', 'Fruits', 'fruits legumes', '-fruits', 'fruits-', 'fruits--legumes', 'légumes'])(
      'rejette %p',
      (raw) => {
        expect(() => Slug.create(raw)).toThrow(DomainValidationError);
      },
    );
  });

  it('compare par valeur', () => {
    expect(Slug.fromText('Fruits & Légumes').equals(Slug.create('fruits-legumes'))).toBe(true);
    expect(Slug.create('fruits').equals(Slug.create('legumes'))).toBe(false);
  });
});
