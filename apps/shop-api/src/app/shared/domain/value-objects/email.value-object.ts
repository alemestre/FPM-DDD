import { DomainValidationError } from '../errors/domain-validation.error';
import isEmail from 'validator/lib/isEmail';

export class Email {
  private constructor(public readonly value: string) {}

  static create(raw: string): Email {
    const value = raw?.trim().toLowerCase() ?? '';

    if (!value || !isEmail(value)) {
      throw new DomainValidationError(`L'adresse email "${raw}" n'est pas valide`);
    }

    return new Email(value);
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
