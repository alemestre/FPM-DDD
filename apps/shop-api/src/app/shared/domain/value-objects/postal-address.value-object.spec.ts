import { DomainValidationError } from '../errors/domain-validation.error';
import { PostalAddress } from './postal-address.value-object';

describe('PostalAddress', () => {
  const valid = { line1: ' 1 rue des Lilas ', line2: ' Bât. B ', postalCode: '29 000', city: ' Quimper ' };

  it('normalise les valeurs', () => {
    const address = PostalAddress.create(valid);

    expect(address.line1).toBe('1 rue des Lilas');
    expect(address.line2).toBe('Bât. B');
    expect(address.postalCode).toBe('29000');
    expect(address.city).toBe('Quimper');
  });

  it('utilise un complément vide par défaut', () => {
    expect(PostalAddress.create({ ...valid, line2: undefined }).line2).toBe('');
  });

  it.each([
    ['line1', { ...valid, line1: '  ' }, "L'adresse est obligatoire"],
    ['city', { ...valid, city: '' }, 'La ville est obligatoire'],
    ['postalCode', { ...valid, postalCode: '2900' }, 'Le code postal "2900" n\'est pas valide']
  ])('refuse une adresse dont %s est invalide', (_field, props, message) => {
    expect(() => PostalAddress.create(props)).toThrow(new DomainValidationError(message));
  });

  it('compare par valeur', () => {
    expect(PostalAddress.create(valid).equals(PostalAddress.create(valid))).toBe(true);
    expect(PostalAddress.create(valid).equals(PostalAddress.create({ ...valid, city: 'Brest' }))).toBe(false);
  });
});
