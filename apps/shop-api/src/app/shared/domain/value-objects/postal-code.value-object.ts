import { DomainValidationError } from '../errors/domain-validation.error';
import isPostalCode from 'validator/lib/isPostalCode';

/**
 * Code postal français : 5 chiffres (métropole, Corse, DOM).
 */
export class PostalCode {
  private constructor(public readonly value: string) {}

  static create(raw: string): PostalCode {
    const value = (raw ?? '').trim().replace(/\s+/g, '');

    if (!value || !isPostalCode(value, 'FR')) {
      throw new DomainValidationError(`Le code postal "${raw}" n'est pas valide`);
    }

    return new PostalCode(value);
  }

  equals(other: PostalCode): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
