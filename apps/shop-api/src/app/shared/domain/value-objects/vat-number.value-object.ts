import { DomainValidationError } from '../errors/domain-validation.error';
import isVAT from 'validator/lib/isVAT';

const FR_VAT_LENGTH = 13;

/**
 * Numéro de TVA intracommunautaire français : FR + clé (2 chiffres) + SIREN (9 chiffres).
 * Clé = (12 + 3 × (SIREN mod 97)) mod 97.
 */
export class VatNumber {
  private constructor(public readonly value: string) {}

  static create(raw: string): VatNumber {
    const value = (raw ?? '').trim().replace(/\s+/g, '').toUpperCase();

    if (value.length !== FR_VAT_LENGTH) {
      throw new DomainValidationError(
        `Le numéro de TVA "${raw}" doit contenir ${FR_VAT_LENGTH} caractères`,
      );
    }

    if (!isVAT(value, 'FR') || !/^FR\d{11}$/.test(value)) {
      throw new DomainValidationError(
        `Le numéro de TVA "${raw}" doit respecter le format FR + 2 chiffres + SIREN (9 chiffres)`,
      );
    }

    const key = Number(value.slice(2, 4));
    const siren = Number(value.slice(4));
    if (key !== (12 + 3 * (siren % 97)) % 97) {
      throw new DomainValidationError(`La clé du numéro de TVA "${raw}" est invalide`);
    }

    return new VatNumber(value);
  }

  get siren(): string {
    return this.value.slice(4);
  }

  equals(other: VatNumber): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
