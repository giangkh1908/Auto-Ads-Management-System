/**
 * API Configuration
 * Centralized API configuration for the application
 */

const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:5001',
  API_PREFIX: '/api',
  AUTH_PREFIX: '/api/auth',
  TIMEOUT: 10000, // 10 seconds
}

export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: `${API_CONFIG.BASE_URL}${API_CONFIG.AUTH_PREFIX}/login`,
    REGISTER: `${API_CONFIG.BASE_URL}${API_CONFIG.AUTH_PREFIX}/register`,
    LOGOUT: `${API_CONFIG.BASE_URL}${API_CONFIG.AUTH_PREFIX}/logout`,
    FACEBOOK_LOGIN: `${API_CONFIG.BASE_URL}${API_CONFIG.AUTH_PREFIX}/facebook-login`,
    VERIFY_EMAIL: (token) => `${API_CONFIG.BASE_URL}${API_CONFIG.AUTH_PREFIX}/verify-email/${token}`,
    RESEND_VERIFICATION: `${API_CONFIG.BASE_URL}${API_CONFIG.AUTH_PREFIX}/resend-verification`,
    FORGOT_PASSWORD: `${API_CONFIG.BASE_URL}${API_CONFIG.AUTH_PREFIX}/forgot-password`,
    RESET_PASSWORD: (token) => `${API_CONFIG.BASE_URL}${API_CONFIG.AUTH_PREFIX}/reset-password/${token}`,
    CHANGE_PASSWORD: `${API_CONFIG.BASE_URL}${API_CONFIG.AUTH_PREFIX}/change-password`,
    ME: `${API_CONFIG.BASE_URL}${API_CONFIG.AUTH_PREFIX}/me`,
    REFRESH_TOKEN: `${API_CONFIG.BASE_URL}${API_CONFIG.AUTH_PREFIX}/refresh-token`,
  },
  
  // Campaign endpoints
  CAMPAIGNS: {
    CREATE: `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/create-campaign`,
    LIST: `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/campaigns`,
    UPDATE: (id) => `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/campaigns/${id}`,
    DELETE: (id) => `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/campaigns/${id}`,
  },
  
  // AdSet endpoints
  ADSETS: {
    UPDATE: (id) => `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/adsets/${id}`,
    DELETE: (id) => `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/adsets/${id}`,
  },
  
  // Ad endpoints
  ADS: {
    STATUS: `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/status`,
    UPDATE: (id) => `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/ads/${id}`,
    DELETE: (id) => `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/ads/${id}`,
  },
}

export default API_CONFIG 