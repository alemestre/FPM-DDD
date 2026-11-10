import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const CategorySlugParamSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
});

export class CategorySlugParamDto extends createZodDto(CategorySlugParamSchema) {}
