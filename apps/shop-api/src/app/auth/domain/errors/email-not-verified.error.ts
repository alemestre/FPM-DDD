/**
 * Raised at login, once the password is checked, when the account has not
 * verified its email yet. The interface layer answers with HTTP 403.
 */
export class EmailNotVerifiedError extends Error {
  constructor(options?: ErrorOptions) {
    super("Vous devez confirmer votre adresse email avant de vous connecter", options);
    this.name = "EmailNotVerifiedError";
  }
}
