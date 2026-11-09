export interface User {
    id: string;
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
