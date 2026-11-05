import { DomainValidationError } from '../../../shared/domain/errors/domain-validation.error';

/**
 * Raised when a product points to a producer or a category that does not exist.
 * Extends DomainValidationError so the interface layer answers with HTTP 400.
 */
export class ProductReferenceNotFoundError extends DomainValidationError {
  constructor(options?: ErrorOptions) {
    super("Le producteur ou l'une des catégories du produit n'existe pas", options);
    this.name = 'ProductReferenceNotFoundError';
  }
}
