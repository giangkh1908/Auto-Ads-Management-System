/**
 * API Configuration
 */

const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:5001',
  API_PREFIX: '/api',
  TIMEOUT: 10000,
}

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_CONFIG.BASE_URL}/api/auth/login`,
    REGISTER: `${API_CONFIG.BASE_URL}/api/auth/register`,
    LOGOUT: `${API_CONFIG.BASE_URL}/api/auth/logout`,
    FACEBOOK_LOGIN: `${API_CONFIG.BASE_URL}/api/auth/facebook-login`,
    VERIFY_EMAIL: (token) => `${API_CONFIG.BASE_URL}/api/auth/verify-email/${token}`,
    RESEND_VERIFICATION: `${API_CONFIG.BASE_URL}/api/auth/resend-verification`,
    FORGOT_PASSWORD: `${API_CONFIG.BASE_URL}/api/auth/forgot-password`,
    RESET_PASSWORD: (token) => `${API_CONFIG.BASE_URL}/api/auth/reset-password/${token}`,
    REFRESH_TOKEN: `${API_CONFIG.BASE_URL}/api/auth/refresh-token`,
    ME: `${API_CONFIG.BASE_URL}/api/auth/me`,
    CHANGE_PASSWORD: `${API_CONFIG.BASE_URL}/api/auth/change-password`, // có thể thêm nếu backend hỗ trợ
  },

  USERS: {
    LIST: `${API_CONFIG.BASE_URL}/api/users`,
    DETAIL: (id) => `${API_CONFIG.BASE_URL}/api/users/${id}`,
    CREATE: `${API_CONFIG.BASE_URL}/api/users`,
    UPDATE: (id) => `${API_CONFIG.BASE_URL}/api/users/${id}`,
    DELETE: (id) => `${API_CONFIG.BASE_URL}/api/users/${id}`,
  },

  ROLES: {
    LIST: `${API_CONFIG.BASE_URL}/api/roles`,
    DETAIL: (id) => `${API_CONFIG.BASE_URL}/api/roles/${id}`,
    CREATE: `${API_CONFIG.BASE_URL}/api/roles`,
    UPDATE: (id) => `${API_CONFIG.BASE_URL}/api/roles/${id}`,
    DELETE: (id) => `${API_CONFIG.BASE_URL}/api/roles/${id}`,
    PERMISSIONS: (id) => `${API_CONFIG.BASE_URL}/api/roles/${id}/permissions`,
  },

  USER_ROLES: {
    LIST: `${API_CONFIG.BASE_URL}/api/user-roles`,
    ASSIGN: `${API_CONFIG.BASE_URL}/api/user-roles`,
    DETAIL: (id) => `${API_CONFIG.BASE_URL}/api/user-roles/${id}`,
    UPDATE: (id) => `${API_CONFIG.BASE_URL}/api/user-roles/${id}`,
    DELETE: (id) => `${API_CONFIG.BASE_URL}/api/user-roles/${id}`,
    BY_USER: (userId) => `${API_CONFIG.BASE_URL}/api/user-roles/user/${userId}`,
  },

  SHOPS: {
    LIST: `${API_CONFIG.BASE_URL}/api/shops`,
    DETAIL: (id) => `${API_CONFIG.BASE_URL}/api/shops/${id}`,
    CREATE: `${API_CONFIG.BASE_URL}/api/shops`,
    UPDATE: (id) => `${API_CONFIG.BASE_URL}/api/shops/${id}`,
    DELETE: (id) => `${API_CONFIG.BASE_URL}/api/shops/${id}`,
  },

  SHOP_USERS: {
    LIST: `${API_CONFIG.BASE_URL}/api/shop-users`,
    DETAIL: (id) => `${API_CONFIG.BASE_URL}/api/shop-users/${id}`,
    CREATE: `${API_CONFIG.BASE_URL}/api/shop-users`,
    UPDATE: (id) => `${API_CONFIG.BASE_URL}/api/shop-users/${id}`,
    DELETE: (id) => `${API_CONFIG.BASE_URL}/api/shop-users/${id}`,
  },
}

export default API_CONFIG
