import { DomainValidationError } from '../../shared/domain/errors/domain-validation.error';
import { Category } from './category.entity';

jest.mock('uuid', () => ({
  v4: jest.fn(() => '12345678-1234-4123-8123-123456789abc'),
  validate: jest.fn((value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value),
  ),
}));

describe('Category', () => {
  it('crée une catégorie avec un nouvel id et un nom normalisé', () => {
    const category = Category.create('  Fruits  ');

    expect(category.id).toBe('12345678-1234-4123-8123-123456789abc');
    expect(category.name).toBe('Fruits');
  });

  it.each(['', '  ', 'ab'])('rejette le nom %p', (name) => {
    expect(() => Category.create(name)).toThrow(DomainValidationError);
  });

  it('renomme la catégorie', () => {
    const category = Category.create('Fruits');

    category.changeName('Légumes');

    expect(category.name).toBe('Légumes');
  });

  it('rejette un nom invalide et conserve le précédent', () => {
    const category = Category.create('Fruits');

    expect(() => category.changeName('ab')).toThrow(DomainValidationError);
    expect(category.name).toBe('Fruits');
  });

  it("reconstitue une catégorie en gardant son id", () => {
    const category = Category.reconstitute('b3bb189e-8bf9-4888-9912-ace4e6543002', 'Fruits');

    expect(category.id).toBe('b3bb189e-8bf9-4888-9912-ace4e6543002');
    expect(category.name).toBe('Fruits');
  });
});
