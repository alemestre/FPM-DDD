import { ORDER_STATUSES } from '../../../domain/order-status';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const orderStatusSchema = z.enum(ORDER_STATUSES);

export const ListOrdersQuerySchema = z.object({
    /** Repeatable: `?status=READY&status=IN_PROGRESS`. One value arrives as a string, several as an array. */
    status: z
        .union([orderStatusSchema, z.array(orderStatusSchema).nonempty()])
        .transform((value) => (Array.isArray(value) ? value : [value]))
        .optional(),
});

export class ListOrdersQueryDto extends createZodDto(ListOrdersQuerySchema) {}
