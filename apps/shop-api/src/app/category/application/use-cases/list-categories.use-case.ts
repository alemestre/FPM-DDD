import { CategoryRepository } from "../../domain/category.repository";
import type { Category } from "../../domain/category.entity";
import { Inject } from "@nestjs/common";

export class ListCategoriesUseCase {
  constructor(@Inject(CategoryRepository) private readonly repository: CategoryRepository) {}

  execute(): Promise<Category[]> {
    return this.repository.findAll();
  }
}
