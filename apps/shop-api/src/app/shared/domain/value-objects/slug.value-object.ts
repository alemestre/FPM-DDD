import { DomainValidationError } from '../errors/domain-validation.error';

/**
 * Lowercase ASCII words separated by single hyphens, e.g. `fruits-legumes`.
 */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Ligatures that Unicode NFD does not split into base letters.
 */
const LIGATURES: Record<string, string> = { œ: 'oe', æ: 'ae', ß: 'ss' };

/**
 * URL-safe identifier derived from a display name.
 */
export class Slug {
  private constructor(private readonly _value: string) {}

  /**
   * Derives a slug from free text: removes accents, lowercases, and turns
   * every run of other characters into one hyphen.
   *
   * @throws {DomainValidationError} If the text has no letter or digit.
   */
  static fromText(text: string): Slug {
    const value = (text ?? '')
      .toLowerCase()
      .replace(/[œæß]/g, (ligature) => LIGATURES[ligature])
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!value) {
      throw new DomainValidationError(`Impossible de créer un slug à partir de "${text}" : aucune lettre ni chiffre`);
    }
    return new Slug(value);
  }

  /**
   * Rebuilds a slug that is already normalized (from persistence or a URL).
   *
   * @throws {DomainValidationError} If the value does not match {@link SLUG_PATTERN}.
   */
  static create(raw: string): Slug {
    if (!SLUG_PATTERN.test(raw ?? '')) {
      throw new DomainValidationError(`Le slug "${raw}" n'est pas valide`);
    }
    return new Slug(raw);
  }

  equals(other: Slug): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
