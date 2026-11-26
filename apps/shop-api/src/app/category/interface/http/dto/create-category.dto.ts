import { CategoryRequestSchema } from "@fpm/contracts";
import { createZodDto } from "nestjs-zod";

export class CreateCategoryDTO extends createZodDto(CategoryRequestSchema) {}
