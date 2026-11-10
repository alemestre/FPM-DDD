/**
 * Raised when deleting a category that is still used by at least one product.
 * The interface layer answers with HTTP 409.
 */
export class CategoryInUseError extends Error {
  constructor(options?: ErrorOptions) {
    super("La catégorie est utilisée par au moins un produit et ne peut pas être supprimée", options);
    this.name = "CategoryInUseError";
  }
}
