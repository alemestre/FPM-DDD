import { UserRole } from '@fpm/tools';
import { GenericEntitySchema } from './generic-entity.dto';
import { z } from 'zod';

export const CurrentUserResponseSchema = GenericEntitySchema.extend({
    email: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    role: z.enum(UserRole)
});

export type CurrentUserResponseDto = z.infer<typeof CurrentUserResponseSchema>;
