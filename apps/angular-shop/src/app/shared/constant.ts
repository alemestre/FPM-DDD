import { ProductsState } from './interface';

export const CONSTANTS = {
  API_END_POINTS: {
    CATEGORIES: 'categories',
    CATEGORY_BY_SLUG: 'categories/slug',
    PRODUCTS: 'products',
    LOGIN: 'login',
    REGISTER: 'register',
    LOGOUT: 'logout',
    ME: 'me',
    PROFILE: 'customers/me',
    PASSWORD: 'me/password',
    VERIFY_EMAIL: 'verify-email',
    RESEND_VERIFICATION: 'resend-verification',
    ORDERS: 'orders',
    GUEST_ORDERS: 'orders/guest'
  },
};

export const PRODUCTS_INITIAL_STATE: ProductsState = {
    products: [],
    loading: true,
    error: null,
};
