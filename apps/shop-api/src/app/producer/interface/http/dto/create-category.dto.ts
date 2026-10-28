import { createZodDto } from "nestjs-zod";
import * as z from "zod";

export const CreateCategorySchema = z.object({
  label: z.string()
});

export class CreateCategoryDTO extends createZodDto(CreateCategorySchema) {}
