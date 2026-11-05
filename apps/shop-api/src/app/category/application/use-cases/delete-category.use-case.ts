import { CategoryRepository } from "../../domain/category.repository";
import { Inject } from "@nestjs/common";

export class DeleteCategoryUseCase {
  constructor(@Inject(CategoryRepository) private readonly repository: CategoryRepository) {}

  /**
   * Deletes the category. Products keep existing and simply lose this category.
   */
  async execute(id: string): Promise<void> {
    await this.repository.findByIdOrFail(id);
    await this.repository.delete(id);
  }
}
