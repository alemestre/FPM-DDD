import { CategoryRepository } from "../../domain/category.repository";
import { Inject } from "@nestjs/common";

export class DeleteCategoryUseCase {
  constructor(@Inject(CategoryRepository) private readonly repository: CategoryRepository) {}

  /**
   * Deletes the category. A category still used by products cannot be deleted.
   *
   * @throws {NotFoundException} If the category does not exist.
   * @throws {CategoryInUseError} If at least one product uses the category.
   */
  async execute(id: string): Promise<void> {
    await this.repository.findByIdOrFail(id);
    await this.repository.delete(id);
  }
}
