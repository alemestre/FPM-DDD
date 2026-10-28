import { Body, Controller, Post, Get, Patch, Param } from "@nestjs/common";@Controller("categories")
import { CategoryService } from "../../application/category.service";
import { CreateCategoryDTO } from "./dto/create-category.dto";
import { UpdateCategoryDTO } from "./dto/update-category.dto";

export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  create(@Body() { label }: CreateCategoryDTO) {
    return this.categoryService.createCategory(label);
  }

  @Get()
  findAll() {
    return this.categoryService.listCategories();
  }

  @Patch(":id")
  complete(@Param("id") id: string, @Body() { label }: UpdateCategoryDTO) {
    return this.categoryService.updateCategory(id, label);
  }
}
