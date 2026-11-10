import { Name } from "../../shared/domain/value-objects/name.value-object";
import { Slug } from "../../shared/domain/value-objects/slug.value-object";
import { Uuid } from "../../shared/domain/value-objects/uuid.value-object";

/**
 * A category groups products under a unique identity and a display name.
 * Its slug, derived from the name, identifies it in URLs and is unique.
 */
export class Category {
  private constructor(
    public readonly id: string,
    private _name: Name,
    private _slug: Slug
  ) {}

  static create(name: string): Category {
    const validName = Name.create(name);
    return new Category(new Uuid().getValue(), validName, Slug.fromText(validName.toString()));
  }

  static reconstitute(id: string, name: string, slug: string): Category {
    return new Category(id, Name.create(name), Slug.create(slug));
  }

  get name(): string {
    return this._name.toString();
  }

  get slug(): string {
    return this._slug.toString();
  }

  /**
   * Renames the category. The slug follows the new name, so the old URL stops working.
   */
  changeName(name: string): void {
    const validName = Name.create(name);
    const slug = Slug.fromText(validName.toString());
    this._name = validName;
    this._slug = slug;
  }
}
