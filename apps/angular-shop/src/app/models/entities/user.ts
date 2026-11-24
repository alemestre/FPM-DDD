import type { UserRole } from '@fpm/tools';

export interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
    address?: {
        street: string;
        suite: string;
        city: string;
        postalCode: string;
    };
    phone?: string;
}
