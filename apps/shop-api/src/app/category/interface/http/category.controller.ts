import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, UseFilters } from "@nestjs/common";
import { CreateCategoryUseCase } from "../../application/use-cases/create-category.use-case";
import { DeleteCategoryUseCase } from "../../application/use-cases/delete-category.use-case";
import { ListCategoriesUseCase } from "../../application/use-cases/list-categories.use-case";
import { UpdateCategoryUseCase } from "../../application/use-cases/update-category.use-case";
import type { CategoryResponseDto } from "@fpm/contracts";
import { toCategoryResponse } from "./dto/category.response.mapper";
import { GetCategoryUseCase } from "../../application/use-cases/get-category.use-case";
import { CategoryConflictErrorFilter } from "./category-conflict-error.filter";
import { GetCategoryBySlugUseCase } from "../../application/use-cases/get-category-by-slug.use-case";
import { CategorySlugParamDto } from "./dto/category-slug-param.dto";
import { CreateCategoryDTO } from "./dto/create-category.dto";
import { UpdateCategoryDTO } from "./dto/update-category.dto";

@Controller("categories")
@UseFilters(CategoryConflictErrorFilter)
export class CategoryController {
  constructor(
    private readonly createCategory: CreateCategoryUseCase,
    private readonly listCategories: ListCategoriesUseCase,
    private readonly getCategory: GetCategoryUseCase,
    private readonly getCategoryBySlug: GetCategoryBySlugUseCase,
    private readonly updateCategory: UpdateCategoryUseCase,
    private readonly deleteCategory: DeleteCategoryUseCase
  ) {}

  @Post()
  async create(@Body() { label }: CreateCategoryDTO): Promise<CategoryResponseDto> {
    return toCategoryResponse(await this.createCategory.execute(label));
  }

  @Get()
  async findAll(): Promise<CategoryResponseDto[]> {
    const categories = await this.listCategories.execute();
    return categories.map(toCategoryResponse);
  }

  @Get("slug/:slug")
  async findOneBySlug(@Param() { slug }: CategorySlugParamDto): Promise<CategoryResponseDto> {
    return toCategoryResponse(await this.getCategoryBySlug.execute(slug));
  }

  @Get(":id")
  async findOne(@Param("id", ParseUUIDPipe) id: string): Promise<CategoryResponseDto> {
    return toCategoryResponse(await this.getCategory.execute(id));
  }

  @Patch(":id")
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() { label }: UpdateCategoryDTO
  ): Promise<CategoryResponseDto> {
    return toCategoryResponse(await this.updateCategory.execute(id, label));
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param("id", ParseUUIDPipe) id: string): Promise<void> {
    await this.deleteCategory.execute(id);
  }
}
