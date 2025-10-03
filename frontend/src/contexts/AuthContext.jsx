import { createContext, useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useToast } from '../hooks/useToast'
import { STORAGE_KEYS, ROUTES } from '../constants/app.constants'
import authService from '../services/authService'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
        const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA)
        
        if (token && userData) {
          // Verify token is still valid by fetching current user
          try {
            const response = await authService.getCurrentUser()
            if (response.success) {
              setUser(response.data.user)
              setIsAuthenticated(true)
            } else {
              logout(false) // Silent logout during token validation
            }
          } catch (error) {
            console.error('Token validation failed:', error)
            logout(false) // Silent logout during token validation
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error)
        logout(false) // Silent logout during token validation
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])


  // Login
  const login = async (credentials, redirectTo = null) => {
    try {
      setLoading(true)
      const response = await authService.login(credentials)
      
      if (response.success) {
        const { user, tokens } = response.data
        
        // Store tokens and user data
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, tokens.accessToken)
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken)
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user))
        
        setUser(user)
        setIsAuthenticated(true)
        
        // Show success message from backend
        if (user.status === 'pending' && !user.emailVerified) {
          toast.warning(response.message + ' Vui lòng kiểm tra email để kích hoạt tài khoản.', {
            duration: 5000
          })
        } else {
          toast.success(response.message || 'Đăng nhập thành công!')
        }
        
        // Navigate after successful login
        setTimeout(() => {
          if (redirectTo) {
            navigate(redirectTo)
          } else if (location.pathname === ROUTES.HOME) {
            navigate(ROUTES.ACCOUNT_MANAGEMENT)
          } else {
            // Stay on current page or go to intended page
            const intendedPath = location.state?.from?.pathname || ROUTES.ACCOUNT_MANAGEMENT
            navigate(intendedPath)
          }
        }, 1000)
        
        return { success: true, user }
      }
    } catch (error) {
      // Chỉ hiển thị message từ backend
      const errorMessage = error.response?.data?.message || error.message || 'Đăng nhập thất bại'
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }


  // Register
  const register = async (userData, switchToLogin = null) => {
    try {
      setLoading(true)
      const response = await authService.register(userData)
        
      if (response.success) {
        toast.success(response.message || 'Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản.', {
          duration: 5000
        })
        
        // Switch to login form after successful registration
        if (switchToLogin) {
          setTimeout(() => {
            switchToLogin()
          }, 2000)
        }
        
        return { success: true, data: response.data }
      }
    } catch (error) {
      // Chỉ hiển thị message từ backend
      const errorMessage = error.response?.data?.message || error.message || 'Đăng ký thất bại'
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }


  // Logout
  const logout = useCallback((showToast = true) => {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.USER_DATA)
    setUser(null)
    setIsAuthenticated(false)
    
    if (showToast) {
      toast.success('Đăng xuất thành công!')
    }
    
    // Navigate to home page after logout
    navigate(ROUTES.HOME)
  }, [navigate, toast])

    // Update user
    const updateUser = (userData) => {
      try {
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData))
        setUser(userData)
      } catch (error) {
        console.error('Error updating user:', error)
      }
    }

  // Forgot password
  const forgotPassword = async (email) => {
    try {
      setLoading(true)
      const response = await authService.forgotPassword(email)
      
      if (response.success) {
        toast.success(response.message || 'Email đặt lại mật khẩu đã được gửi!')
        return { success: true }
      }
      } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Gửi email đặt lại mật khẩu thất bại'
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (token, password) => {
    try {
      setLoading(true)
      const response = await authService.resetPassword(token, password)
      
      if (response.success) {
        toast.success(response.message || 'Đặt lại mật khẩu thành công!')
        return { success: true }
      }
      // setTimeout(() => {
      //   console.log('Navigating to:', ROUTES.ACCOUNT_MANAGEMENT)
      //   navigate(ROUTES.ACCOUNT_MANAGEMENT)
      // }, 2000)
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Đặt lại mật khẩu thất bại'
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const changePassword = async (currentPassword, newPassword) => {
    try {
      setLoading(true)
      const response = await authService.changePassword(currentPassword, newPassword)
      
      if (response.success) {
        toast.success(response.message || 'Đổi mật khẩu thành công!')
        return { success: true }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Đổi mật khẩu thất bại'
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const resendVerificationEmail = async (email) => {
    try {
      setLoading(true)
      const response = await authService.resendVerificationEmail(email)
      
      if (response.success) {
        toast.success(response.message || 'Email xác nhận đã được gửi lại!')
        return { success: true }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Gửi lại email xác nhận thất bại'
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const verifyEmail = async (token) => {
    try {
      setLoading(true)
      const response = await authService.verifyEmail(token)
      
      if (response.success) {
        toast.success(response.message || 'Xác nhận email thành công!')
        
        // Auto-login user after successful email verification
        if (response.data && response.data.user && response.data.tokens) {
          const { user, tokens } = response.data
          
          // Store tokens and user data (same as login)
          localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, tokens.accessToken)
          localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken)
          localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user))
          
          setUser(user)
          setIsAuthenticated(true)
          
        }
        
        // Navigate to Account Management after successful verification
        setTimeout(() => {
          navigate(ROUTES.ACCOUNT_MANAGEMENT)
        }, 2000)
        
        return { success: true }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Xác nhận email thất bại'
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
    forgotPassword,
    resetPassword,
    changePassword,
    resendVerificationEmail,
    verifyEmail,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthContext