import { CategoryRepository } from "./port/category.repository";
import { Category } from "../domain/category.entity";
import { Inject } from "@nestjs/common";
import { Uuid } from "../../core/domain/value-objects/uuid.value-object";
import { Label } from "../domain/value-objects/label";

export class CategoryService {
  constructor(@Inject(CategoryRepository) private readonly repository: CategoryRepository) {}

  async createCategory(rawLabel: string): Promise<Category> {
    const label = Label.create(rawLabel);
    const category = new Category(new Uuid().getValue(), label);
    return this.repository.save(category);
  }

  listCategories() {
    return this.repository.findAll();
  }

  async updateCategory(id: string, rawLabel: string) {
    const category = await this.repository.findById(id);

    if (!category) throw new Error("Category not found");

    const label = Label.create(rawLabel).toString();
    this.repository.update(id, { label });
  }
}
