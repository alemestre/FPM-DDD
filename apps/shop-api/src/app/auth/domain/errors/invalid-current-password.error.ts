import { DomainValidationError } from "../../../shared/domain/errors/domain-validation.error";

/**
 * The current password given to change it is wrong. It is a 400, not a 401:
 * the session itself is valid, only the confirmation failed.
 */
export class InvalidCurrentPasswordError extends DomainValidationError {
  constructor(options?: ErrorOptions) {
    super("Le mot de passe actuel est incorrect", options);
    this.name = "InvalidCurrentPasswordError";
  }
}
