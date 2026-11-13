import { DomainValidationError } from "../../shared/domain/errors/domain-validation.error";

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

/** Each rule a new password must follow, with the wording shown when it is missing. */
const PASSWORD_RULES: readonly { readonly isMet: (value: string) => boolean; readonly requirement: string }[] = [
  { isMet: (value) => value.length >= PASSWORD_MIN_LENGTH, requirement: `au moins ${PASSWORD_MIN_LENGTH} caractères` },
  { isMet: (value) => value.length <= PASSWORD_MAX_LENGTH, requirement: `au plus ${PASSWORD_MAX_LENGTH} caractères` },
  { isMet: (value) => /\p{Lu}/u.test(value), requirement: "une majuscule" },
  { isMet: (value) => /\p{Nd}/u.test(value), requirement: "un chiffre" },
  // Anything that is neither a letter, a digit nor whitespace: !, ?, @, €, _…
  { isMet: (value) => /[^\p{L}\p{N}\s]/u.test(value), requirement: "un caractère spécial" }
];

/**
 * Password chosen at registration, in clear text: it only lives until it is
 * hashed and is never persisted. Existing passwords are not checked again at login.
 */
export class Password {
  private constructor(public readonly value: string) {}

  static create(raw: string): Password {
    const value = raw ?? "";
    const missing = PASSWORD_RULES.filter(({ isMet }) => !isMet(value)).map(({ requirement }) => requirement);

    if (missing.length > 0) {
      throw new DomainValidationError(`Le mot de passe doit contenir ${missing.join(", ")}`);
    }

    return new Password(value);
  }
}
