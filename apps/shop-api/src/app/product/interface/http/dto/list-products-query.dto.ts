import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const ListProductsQuerySchema = z.object({
  categoryId: z.uuid().optional()
});

export class ListProductsQueryDto extends createZodDto(ListProductsQuerySchema) {}
