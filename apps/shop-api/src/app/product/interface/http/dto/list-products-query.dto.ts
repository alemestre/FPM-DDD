import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ListProductsQuerySchema = z.object({
    categoryId: z.uuid().optional(),
    /** Query strings are text: "true" / "false" (also 1/0, yes/no) become a boolean. */
    isAvailable: z.stringbool().optional(),
    /** Repeatable: `?productIds=a&productIds=b`. One value arrives as a string, several as an array. */
    productIds: z
        .union([z.uuid(), z.array(z.uuid()).nonempty()])
        .transform((value) => (Array.isArray(value) ? value : [value]))
        .optional(),
});

export class ListProductsQueryDto extends createZodDto(ListProductsQuerySchema) {}
