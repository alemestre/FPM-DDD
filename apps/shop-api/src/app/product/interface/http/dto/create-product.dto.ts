import { createZodDto } from "nestjs-zod";
import { PRODUCT_UNITS } from "../../../domain/value-objects/product-unit.value-object";
import { MEASURE_UNITS } from "../../../domain/value-objects/measure.value-object";
import { z } from "zod";

/**
 * Shape of the create request. Business rules (stock >= minStock, name length, …)
 * are enforced by the Product aggregate, not here.
 */
/**
 * What one sale unit contains. `itemSize` may be omitted for items without size (12 eggs).
 */
const ProductContentSchema = z.strictObject({
  itemCount: z.number().int().min(1),
  itemSize: z
    .strictObject({ amount: z.number().positive(), unit: z.enum(MEASURE_UNITS) })
    .nullable()
    .default(null)
});

export const CreateProductSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
  vatRate: z.number().min(0).max(100),
  stock: z.number().int().min(0),
  minStock: z.number().int().min(0),
  producerId: z.uuid(),
  categoryId: z.uuid(),
  image: z.url({ protocol: /^https?$/ }),
  unit: z.enum(PRODUCT_UNITS).optional(),
  content: ProductContentSchema.nullable().optional()
});

export class CreateProductDto extends createZodDto(CreateProductSchema) {}
