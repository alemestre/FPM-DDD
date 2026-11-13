/**
 * Raised when registering with an email that another account already uses.
 * The interface layer answers with HTTP 409.
 */
export class EmailAlreadyUsedError extends Error {
  constructor(options?: ErrorOptions) {
    super("Un compte existe déjà avec cette adresse email", options);
    this.name = "EmailAlreadyUsedError";
  }
}
