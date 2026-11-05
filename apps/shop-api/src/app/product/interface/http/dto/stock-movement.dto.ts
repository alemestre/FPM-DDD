import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const StockMovementSchema = z.object({
  quantity: z.number().int().positive()
});

export class StockMovementDto extends createZodDto(StockMovementSchema) {}
