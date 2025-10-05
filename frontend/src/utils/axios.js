import axios from 'axios'
import API_CONFIG from '../config/api.config'
import { STORAGE_KEYS } from '../constants/app.constants'

/**
 * Create axios instance with default config
 */
const axiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * Request interceptor
 * Add auth token to requests
 */
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

/**
 * Response interceptor
 * Handle errors globally and token refresh
 */
axiosInstance.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config

    // Handle different error types
    if (error.response) {
      // Server responded with error status
      const { status } = error.response
      
      switch (status) {
        case 403: {
          // Forbidden - check if it's email verification issue
          if (error.response?.data?.code === 'EMAIL_NOT_VERIFIED') {
            // Clear auth data and redirect to email verification required page
            localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
            localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
            localStorage.removeItem(STORAGE_KEYS.USER_DATA);
            
            if (window.location.pathname !== "/email-verification-required") {
              window.location.href = "/email-verification-required";
            }
            return Promise.reject(error);
          }
          break;
        }
        case 401: {
          // Unauthorized - try to refresh token first
          if (!originalRequest._retry) {
            originalRequest._retry = true;

            const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
            if (refreshToken) {
              try {
                const response = await axios.post(
                  `${API_CONFIG.BASE_URL}/api/auth/refresh-token`,
                  { refreshToken }
                );

                if (response.data.success) {
                  const { accessToken } = response.data.data;
                  localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, accessToken);

                  // Retry original request with new token
                  originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                  return axiosInstance(originalRequest);
                }
              } catch (refreshError) {
                console.error("Token refresh failed:", refreshError);
              }
            }
          }

          // Check if user was actually logged in before showing timeout message
          const wasLoggedIn = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) || localStorage.getItem(STORAGE_KEYS.USER_DATA);

          // Clear auth data
          localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.USER_DATA);

          // Only redirect if not already on home page - removed toast to avoid conflict with AuthContext
          if (wasLoggedIn && window.location.pathname !== "/") {
            window.location.href = "/";
          }
          
          // Return early to prevent other error toasts
          return Promise.reject(error);
    }  
        // case 403:
        //   toast.error(data?.message || 'Bạn không có quyền thực hiện thao tác này.')
        //   break
          
        // case 404:
        //   toast.error(data?.message || 'Không tìm thấy tài nguyên.')
        //   break
          
        // case 422:
        //   // Validation errors
        //   toast.error(data?.message || 'Dữ liệu không hợp lệ.')
        //   break
          
        // case 429:
        //   // Rate limit exceeded
        //   toast.error(data?.message || 'Quá nhiều yêu cầu. Vui lòng thử lại sau.')
        //   break
          
        // case 500:
        //   toast.error(data?.message || 'Lỗi server. Vui lòng thử lại sau.')
        //   break
          
        default:
          // Removed toast to avoid conflicts with AuthContext - errors will be handled by AuthContext
          break
      }
    } else if (error.request) {
      // Request made but no response - commented out to avoid conflicts
      // toast.error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.')
    } else {
      // Something else happened - removed toast to avoid conflicts with AuthContext
      // Errors will be handled by individual components/contexts
    }
    
    return Promise.reject(error)
  }
)

export default axiosInstance