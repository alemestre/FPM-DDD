/** Longueur minimale d'un nouveau mot de passe (mêmes règles que l'API). */
export const PASSWORD_MIN_LENGTH = 8;

export interface PasswordRuleError {
  readonly kind: 'minLength' | 'uppercase' | 'digit' | 'special';
  readonly message: string;
}

const PASSWORD_RULES: readonly (PasswordRuleError & { readonly isMet: (value: string) => boolean })[] = [
  {
    kind: 'minLength',
    message: `Au moins ${PASSWORD_MIN_LENGTH} caractères.`,
    isMet: (value) => value.length >= PASSWORD_MIN_LENGTH
  },
  { kind: 'uppercase', message: 'Au moins une majuscule.', isMet: (value) => /\p{Lu}/u.test(value) },
  { kind: 'digit', message: 'Au moins un chiffre.', isMet: (value) => /\p{Nd}/u.test(value) },
  {
    kind: 'special',
    message: 'Au moins un caractère spécial (!, ?, @, #…).',
    // Ni lettre, ni chiffre, ni espace : même définition que l'API.
    isMet: (value) => /[^\p{L}\p{N}\s]/u.test(value)
  }
];

/** Règles non respectées par un nouveau mot de passe (aucune si le tableau est vide). */
export function passwordRuleErrors(value: string): PasswordRuleError[] {
  return PASSWORD_RULES.filter(({ isMet }) => !isMet(value)).map(({ kind, message }) => ({ kind, message }));
}
