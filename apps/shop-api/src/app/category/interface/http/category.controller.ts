import { Controller, Get, Param, ParseUUIDPipe } from "@nestjs/common";
import { ListCategoriesUseCase } from "../../application/use-cases/list-categories.use-case";
import { GetCategoryBySlugUseCase } from "../../application/use-cases/get-category-by-slug.use-case";
import { GetCategoryUseCase } from "../../application/use-cases/get-category.use-case";
import { CategorySlugParamDto } from "./dto/category-slug-param.dto";
import { toCategoryResponse } from "./dto/category.response.mapper";
import type { CategoryResponseDto } from "@fpm/contracts";

/** Public, read-only category routes for the shop. Changes go through AdminCategoryController. */
@Controller("categories")
export class CategoryController {
  constructor(
    private readonly listCategories: ListCategoriesUseCase,
    private readonly getCategory: GetCategoryUseCase,
    private readonly getCategoryBySlug: GetCategoryBySlugUseCase
  ) {}

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
}
