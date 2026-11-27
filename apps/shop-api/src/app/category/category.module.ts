import { CreateCategoryUseCase } from "./application/use-cases/create-category.use-case";
import { UpdateCategoryUseCase } from "./application/use-cases/update-category.use-case";
import { ListCategoriesUseCase } from "./application/use-cases/list-categories.use-case";
import { PrismaCategoryRepository } from "./infrastructure/prisma-category.repository";
import { GetCategoryUseCase } from "./application/use-cases/get-category.use-case";
import { GetCategoryBySlugUseCase } from "./application/use-cases/get-category-by-slug.use-case";
import { CategoryController } from "./interface/http/category.controller";
import { AdminCategoryController } from "./interface/http/admin-category.controller";
import { CategoryRepository } from "./domain/category.repository";
import { AuthModule } from "../auth/auth.module";
import { Module } from "@nestjs/common";

@Module({
  // Provides the guards behind @OnlyAdmin, which protects AdminCategoryController.
  imports: [AuthModule],
  controllers: [CategoryController, AdminCategoryController],
  providers: [
    { provide: CategoryRepository, useClass: PrismaCategoryRepository },
    CreateCategoryUseCase,
    ListCategoriesUseCase,
    GetCategoryUseCase,
    GetCategoryBySlugUseCase,
    UpdateCategoryUseCase
  ]
})
export class CategoryModule {}
