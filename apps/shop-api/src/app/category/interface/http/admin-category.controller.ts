import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, UseFilters } from "@nestjs/common";
import { CreateCategoryUseCase } from "../../application/use-cases/create-category.use-case";
import { DeleteCategoryUseCase } from "../../application/use-cases/delete-category.use-case";
import { ListCategoriesUseCase } from "../../application/use-cases/list-categories.use-case";
import { UpdateCategoryUseCase } from "../../application/use-cases/update-category.use-case";
import { GetCategoryUseCase } from "../../application/use-cases/get-category.use-case";
import { OnlyAdmin } from "../../../auth/interface/http/only-admin.decorator";
import { CategoryConflictErrorFilter } from "./category-conflict-error.filter";
import { toCategoryResponse } from "./dto/category.response.mapper";
import { CreateCategoryDTO } from "./dto/create-category.dto";
import { UpdateCategoryDTO } from "./dto/update-category.dto";
import type { CategoryResponseDto } from "@fpm/contracts";

/**
 * Category management for the admin area. Every route requires an admin session:
 * 401 without a valid session, 403 for a non-admin account.
 */
@Controller("admin/categories")
@OnlyAdmin()
@UseFilters(CategoryConflictErrorFilter)
export class AdminCategoryController {
  constructor(
    private readonly createCategory: CreateCategoryUseCase,
    private readonly listCategories: ListCategoriesUseCase,
    private readonly getCategory: GetCategoryUseCase,
    private readonly updateCategory: UpdateCategoryUseCase,
    private readonly deleteCategory: DeleteCategoryUseCase
  ) {}

  @Get()
  async findAll(): Promise<CategoryResponseDto[]> {
    const categories = await this.listCategories.execute();
    return categories.map(toCategoryResponse);
  }

  @Get(":id")
  async findOne(@Param("id", ParseUUIDPipe) id: string): Promise<CategoryResponseDto> {
    return toCategoryResponse(await this.getCategory.execute(id));
  }

  @Post()
  async create(@Body() { name }: CreateCategoryDTO): Promise<CategoryResponseDto> {
    return toCategoryResponse(await this.createCategory.execute(name));
  }

  @Patch(":id")
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() { name }: UpdateCategoryDTO
  ): Promise<CategoryResponseDto> {
    return toCategoryResponse(await this.updateCategory.execute(id, name));
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param("id", ParseUUIDPipe) id: string): Promise<void> {
    await this.deleteCategory.execute(id);
  }
}
