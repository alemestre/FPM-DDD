import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const UpdateCategorySchema = z.object({
  label: z.string()
});

export class UpdateCategoryDTO extends createZodDto(UpdateCategorySchema) {}
