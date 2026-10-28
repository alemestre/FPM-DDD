import { Name } from "../../shared/domain/value-objects/name.value-object";
import { Uuid } from "../../shared/domain/value-objects/uuid.value-object";

/**
 * A category groups products under a unique identity and a display label.
 */
export class Category {
  private constructor(
    public readonly id: string,
    private _label: Name
  ) {}

  static create(label: string): Category {
    return new Category(new Uuid().getValue(), Name.create(label));
  }

  static reconstitute(id: string, label: string): Category {
    return new Category(id, Name.create(label));
  }

  get label(): string {
    return this._label.toString();
  }

  changeLabel(label: string): void {
    this._label = Name.create(label);
  }
}
