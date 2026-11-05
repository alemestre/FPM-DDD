import { CreateProductSchema } from "./create-product.dto";
import { createZodDto } from "nestjs-zod";
import { z } from "zod";

/**
 * Partial update. `stock` is rejected: stock changes go through the
 * restock / withdraw endpoints so every movement is explicit.
 */
export const UpdateProductSchema = z.strictObject({
  ...CreateProductSchema.omit({ stock: true, categoryIds: true }).shape,
  categoryIds: z.array(z.uuid())
}).partial();

export class UpdateProductDto extends createZodDto(UpdateProductSchema) {}
