/**
 * Raised when saving a category whose slug, derived from its name, is already
 * used by another category. The interface layer answers with HTTP 409.
 */
export class CategorySlugAlreadyUsedError extends Error {
  constructor(options?: ErrorOptions) {
    super("Une catégorie avec un nom équivalent existe déjà", options);
    this.name = "CategorySlugAlreadyUsedError";
  }
}
