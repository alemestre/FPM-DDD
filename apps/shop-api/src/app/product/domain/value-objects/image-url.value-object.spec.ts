import { DomainValidationError } from '../../../shared/domain/errors/domain-validation.error';
import { ImageUrl } from './image-url.value-object';

describe('ImageUrl', () => {
  it.each([
    'https://example.com/images/pommes.jpg',
    'http://example.com/pommes.png',
    'http://localhost:4200/images/produits/fake.jpg',
  ])('accepte %s', (url) => {
    expect(ImageUrl.create(url).value).toBe(url);
  });

  it('retire les espaces autour', () => {
    expect(ImageUrl.create('  https://example.com/pommes.jpg ').value).toBe('https://example.com/pommes.jpg');
  });

  it.each(['', '   ', 'pommes.jpg', '/images/pommes.jpg', 'example.com/pommes.jpg', 'ftp://example.com/pommes.jpg', 'pas une url'])(
    'rejette "%s"',
    (url) => {
      expect(() => ImageUrl.create(url)).toThrow(DomainValidationError);
    },
  );

  it('compare par valeur', () => {
    expect(ImageUrl.create('https://example.com/a.jpg').equals(ImageUrl.create('https://example.com/a.jpg'))).toBe(true);
    expect(ImageUrl.create('https://example.com/a.jpg').equals(ImageUrl.create('https://example.com/b.jpg'))).toBe(false);
  });
});
