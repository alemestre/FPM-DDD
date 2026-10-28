import { Name } from "../../shared/domain/value-objects/name.value-object";
import { Uuid } from "../../shared/domain/value-objects/uuid.value-object";

/**
 * A category groups products under a unique identity and a display name.
 */
export class Category {
  private constructor(
    public readonly id: string,
    private _name: Name
  ) {}

  static create(name: string): Category {
    return new Category(new Uuid().getValue(), Name.create(name));
  }

  static reconstitute(id: string, name: string): Category {
    return new Category(id, Name.create(name));
  }

  get name(): string {
    return this._name.toString();
  }

  changeName(name: string): void {
    this._name = Name.create(name);
  }
}
