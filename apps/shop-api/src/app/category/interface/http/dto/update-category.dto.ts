import { CategoryRequestSchema } from "@fpm/contracts";
import { createZodDto } from "nestjs-zod";

export class UpdateCategoryDTO extends createZodDto(CategoryRequestSchema) {}
