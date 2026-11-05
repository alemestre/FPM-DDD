import { CategoryRepository } from "../../domain/category.repository";
import type { Category } from "../../domain/category.entity";
import { Inject } from "@nestjs/common";

export class UpdateCategoryUseCase {
  constructor(@Inject(CategoryRepository) private readonly repository: CategoryRepository) {}

  /**
   * Renames the category through the aggregate, then persists it.
   */
  async execute(id: string, name: string): Promise<Category> {
    const category = await this.repository.findByIdOrFail(id);
    category.changeName(name);
    return this.repository.save(category);
  }
}
