import { CategoryRepository } from "../../domain/category.repository";
import type { Category } from "../../domain/category.entity";
import { Inject, NotFoundException } from "@nestjs/common";

export class GetCategoryBySlugUseCase {
  constructor(@Inject(CategoryRepository) private readonly repository: CategoryRepository) {}

  /**
   * @throws {NotFoundException} If no category uses this slug.
   */
  async execute(slug: string): Promise<Category> {
    const category = await this.repository.findBySlug(slug);
    if (!category) throw new NotFoundException(`Catégorie ${slug} introuvable`);
    return category;
  }
}
