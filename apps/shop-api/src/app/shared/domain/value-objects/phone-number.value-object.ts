import { DomainValidationError } from '../errors/domain-validation.error';

/**
 * Numéro de téléphone français (métropole ou DOM, fixe ou mobile), stocké au format E.164.
 *
 * - Métropole : +33XXXXXXXXX
 * - DOM : indicatif du territoire, ex. 0262 12 34 56 (Réunion) → +262262123456
 *
 * Formats acceptés : national (0…), international (+CC… ou 00CC…), avec espaces, points,
 * tirets ou « (0) ». Un numéro DOM saisi avec +33 est rejeté : ce n'est pas son indicatif.
 *
 * validator.js n'est pas utilisé ici : sa règle `isMobilePhone(…, 'fr-FR')`
 * n'accepte que les mobiles métropolitains (06/07).
 */
const METROPOLITAN_COUNTRY_CODE = '33';

/**
 * Préfixes nationaux des DOM (numéro sans le 0 initial) → indicatif international.
 */
const OVERSEAS_COUNTRY_CODE_BY_PREFIX: Readonly<Record<string, string>> = {
  // Guadeloupe, Saint-Martin, Saint-Barthélemy
  '590': '590',
  '690': '590',
  '691': '590',
  // Guyane
  '594': '594',
  '694': '594',
  // Martinique
  '596': '596',
  '696': '596',
  '697': '596',
  // Réunion
  '262': '262',
  '263': '262',
  '692': '262',
  '693': '262',
  // Mayotte
  '269': '262',
  '639': '262',
};

const NATIONAL_FORMAT = /^0([1-9]\d{8})$/;
const INTERNATIONAL_FORMAT = /^(?:\+|00)(33|262|590|594|596)([1-9]\d{8})$/;

export class PhoneNumber {
  private constructor(public readonly value: string) {}

  static create(raw: string): PhoneNumber {
    const compact = (raw ?? '')
      .trim()
      .replace(/\(0\)/g, '')
      .replace(/[\s.\-()]/g, '');

    const national = NATIONAL_FORMAT.exec(compact);
    if (national) {
      const subscriberNumber = national[1];
      return new PhoneNumber(`+${PhoneNumber.countryCodeOf(subscriberNumber)}${subscriberNumber}`);
    }

    const international = INTERNATIONAL_FORMAT.exec(compact);
    if (international) {
      const [, countryCode, subscriberNumber] = international;
      if (PhoneNumber.countryCodeOf(subscriberNumber) !== countryCode) {
        throw new DomainValidationError(
          `L'indicatif du numéro de téléphone "${raw}" ne correspond pas à son territoire`,
        );
      }
      return new PhoneNumber(`+${countryCode}${subscriberNumber}`);
    }

    throw new DomainValidationError(`Le numéro de téléphone "${raw}" n'est pas valide`);
  }

  /**
   * Indicatif international attendu pour un numéro national (sans le 0 initial).
   */
  private static countryCodeOf(subscriberNumber: string): string {
    return OVERSEAS_COUNTRY_CODE_BY_PREFIX[subscriberNumber.slice(0, 3)] ?? METROPOLITAN_COUNTRY_CODE;
  }

  equals(other: PhoneNumber): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
