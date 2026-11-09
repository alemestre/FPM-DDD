/**
 * Raised when a request has no valid session: unknown or deactivated account.
 * The interface layer maps it to an HTTP 401 response.
 */
export class AuthenticationError extends Error {
  constructor(message = "Authentification requise", options?: ErrorOptions) {
    super(message, options);
    this.name = "AuthenticationError";
  }
}
