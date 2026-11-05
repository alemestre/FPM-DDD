import { CreateCategoryUseCase } from "./application/use-cases/create-category.use-case";
import { DeleteCategoryUseCase } from "./application/use-cases/delete-category.use-case";
import { UpdateCategoryUseCase } from "./application/use-cases/update-category.use-case";
import { ListCategoriesUseCase } from "./application/use-cases/list-categories.use-case";
import { PrismaCategoryRepository } from "./infrastructure/prisma-category.repository";
import { GetCategoryUseCase } from "./application/use-cases/get-category.use-case";
import { CategoryController } from "./interface/http/category.controller";
import { CategoryRepository } from "./domain/category.repository";
import { Module } from "@nestjs/common";

@Module({
  controllers: [CategoryController],
  providers: [
    { provide: CategoryRepository, useClass: PrismaCategoryRepository },
    CreateCategoryUseCase,
    ListCategoriesUseCase,
    GetCategoryUseCase,
    UpdateCategoryUseCase,
    DeleteCategoryUseCase
  ]
})
export class CategoryModule {}
