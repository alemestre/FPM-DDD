export interface User {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    address?: {
        street: string;
        suite: string;
        city: string;
        postalCode: string;
    };
    phone?: string;
}
