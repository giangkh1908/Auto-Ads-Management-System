/**
 * Application Constants
 * Centralized constants for the application
 */

// Layout constants
export const LAYOUT = {
  HEADER_HEIGHT: 100,
  FOOTER_HEIGHT: 140,
  SIDEBAR_WIDTH_EXPANDED: 240,
  SIDEBAR_WIDTH_COLLAPSED: 60,
  SCROLL_THRESHOLD: 10,
}

// Timing constants
export const TIMING = {
  DEBOUNCE_DELAY: 300,
  LOADING_DELAY: 600,
  TOAST_DURATION: 3000,
  ANIMATION_DURATION: 200,
}

// Route paths
export const ROUTES = {
  HOME: '/',
  ACCOUNT_MANAGEMENT: '/account-management',
  ADS_MANAGEMENT: '/ads',
  REPORTS: '/reports',
  STATS: '/stats',
  CONNECT: '/connect',
  VERIFY_EMAIL: '/verify-email/:token',
  RESET_PASSWORD: '/reset-password/:token',
  NOT_FOUND: '*',
}

// Valid routes for header display
export const HEADER_ROUTES = [
  ROUTES.HOME,
  ROUTES.ACCOUNT_MANAGEMENT,
  ROUTES.ADS_MANAGEMENT,
  ROUTES.REPORTS,
  ROUTES.STATS,
]

// Auth modes
export const AUTH_MODES = {
  LOGIN: 'login',
  REGISTER: 'register',
  RESET: 'reset',
}

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  THEME: 'theme',
}

// Auth status
export const AUTH_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  BANNED: 'banned',
}

// API Response status
export const API_STATUS = {
  SUCCESS: 'success',
  ERROR: 'error',
  LOADING: 'loading',
}