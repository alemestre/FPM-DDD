/**
 * Raised when a value breaks a domain invariant (invalid email, VAT number, …).
 * The interface layer maps it to an HTTP 400 response.
 */
export class DomainValidationError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'DomainValidationError';
  }
}
