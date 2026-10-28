import { Label } from "./value-objects/label";

/**
 * Category aggregate root.
 *
 * A category groups products under a unique identity and a display label.
 */
export class Category {
  /**
   * Builds a category. Callers use {@link Category.create} instead of this
   * constructor so invariants are checked first.
   *
   * @param id - Category identity.
   * @param _label - Display name. Must not be empty.
   */
  constructor(
    readonly id: string,
    private _label: Label,
  ) {}

  get label() {
    return this._label.toString();
  }

  /**
   * Updates the label after validating the same invariants as create.
   *
   * @param label - Display name. Must not be empty.
   * @throws Error when an invariant fails.
   */
  changeLabel(label: Label): void {
    this._label = label;
  }
}
