import { DomainValidationError } from "../../../shared/domain/errors/domain-validation.error";

/**
 * Raised when a password reset link is invalid, expired, already used, or points to an
 * account that no longer exists or is deactivated. Mapped to HTTP 400 like other validation errors.
 */
export class InvalidResetPasswordTokenError extends DomainValidationError {
  constructor(options?: ErrorOptions) {
    super("Le lien de réinitialisation est invalide ou a expiré", options);
    this.name = "InvalidResetPasswordTokenError";
  }
}
