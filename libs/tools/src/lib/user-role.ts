/**
 * Roles of an account, shared by the API (domain and HTTP contract) and the storefront.
 * The values are the ones stored in the database and sent by the API.
 */
export const UserRole = { ADMIN: 'ADMIN', CUSTOMER: 'CUSTOMER' } as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];
