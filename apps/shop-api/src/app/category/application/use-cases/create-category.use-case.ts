import { CategoryRepository } from "../../domain/category.repository";
import { Category } from "../../domain/category.entity";
import { Inject } from "@nestjs/common";

export class CreateCategoryUseCase {
  constructor(@Inject(CategoryRepository) private readonly repository: CategoryRepository) {}

  async execute(name: string): Promise<Category> {
    return this.repository.save(Category.create(name));
  }
}
