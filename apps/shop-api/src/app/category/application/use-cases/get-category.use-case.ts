import { CategoryRepository } from "../../domain/category.repository";
import type { Category } from "../../domain/category.entity";
import { Inject } from "@nestjs/common";

export class GetCategoryUseCase {
  constructor(@Inject(CategoryRepository) private readonly repository: CategoryRepository) {}

  execute(id: string): Promise<Category> {
    return this.repository.findByIdOrFail(id);
  }
}
