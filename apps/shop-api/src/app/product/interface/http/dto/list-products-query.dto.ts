import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const ListProductsQuerySchema = z.object({
  categoryId: z.uuid().optional(),
  /** Query strings are text: "true" / "false" (also 1/0, yes/no) become a boolean. */
  isAvailable: z.stringbool().optional(),
});

export class ListProductsQueryDto extends createZodDto(ListProductsQuerySchema) {}
