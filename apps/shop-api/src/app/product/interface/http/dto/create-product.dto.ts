import { createZodDto } from "nestjs-zod";
import { PRODUCT_UNITS } from "../../../domain/value-objects/product-unit.value-object";
import { QUANTITY_UNITS } from "../../../domain/value-objects/quantity-unit.value-object";
import { z } from "zod";

/**
 * Shape of the create request. Business rules (stock >= minStock, name length, …)
 * are enforced by the Product aggregate, not here.
 */
export const CreateProductSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
  vatRate: z.number().min(0).max(100),
  stock: z.number().int().min(0),
  minStock: z.number().int().min(0),
  producerId: z.uuid(),
  categoryId: z.uuid(),
  unit: z.enum(PRODUCT_UNITS).optional(),
  quantityUnit: z.enum(QUANTITY_UNITS).nullable().optional()
});

export class CreateProductDto extends createZodDto(CreateProductSchema) {}
