import { DomainValidationError } from "../../../shared/domain/errors/domain-validation.error";

/**
 * Raised when an email verification link is invalid, expired, or points to an
 * account that no longer exists. Mapped to HTTP 400 like other validation errors.
 */
export class InvalidVerificationTokenError extends DomainValidationError {
  constructor(options?: ErrorOptions) {
    super("Le lien de vérification est invalide ou a expiré", options);
    this.name = "InvalidVerificationTokenError";
  }
}
