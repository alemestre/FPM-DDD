import { CategoryRepository } from "../domain/category.repository";
import { Category } from "../domain/category.entity";
import { Inject } from "@nestjs/common";
import { Name } from "../../shared/domain/value-objects/name.value-object";

export class CategoryService {
  constructor(@Inject(CategoryRepository) private readonly repository: CategoryRepository) {}

  async createCategory(rawLabel: string): Promise<Category> {
    const category = Category.create(rawLabel);
    return this.repository.save(category);
  }

  listCategories() {
    return this.repository.findAll();
  }

  async updateCategory(id: string, rawLabel: string) {
    const category = await this.repository.findByIdOrFail(id);
    const label = Name.create(rawLabel).toString();
    this.repository.update(category.id, { label });
  }
}
