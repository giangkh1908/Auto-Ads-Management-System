import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../hooks/useToast'
import authService from '../services/authService'
import { STORAGE_KEYS, ROUTES } from '../constants/app.constants'
import { AuthContext } from './AuthContext'

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const navigate = useNavigate()
  const toast = useToast()

  // Kiểm tra xác thực khi mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
        const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA)
        
        if (token && userData) {
          // Xác thực token vẫn hợp lệ bằng cách lấy user hiện tại
          try {
            const response = await authService.getCurrentUser()
            if (response.success) {
              setUser(response.data.user)
              setIsAuthenticated(true)
            } else {
              logout(false) // Đăng xuất im lặng trong quá trình xác thực token
            }
          } catch (error) {
            console.error('Token validation failed:', error)
            logout(false) // Đăng xuất im lặng trong quá trình xác thực token
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error)
        logout(false) // Đăng xuất im lặng trong quá trình xác thực token
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])


  // Đăng nhập
  const login = async (credentials, redirectTo = null) => {
    try {
      setLoading(true)
      const response = await authService.login(credentials)
      
      if (response.success) {
        const { user, tokens, requiresEmailVerification } = response.data
        
        // Kiểm tra xem có cần xác nhận email không
        if (requiresEmailVerification || !user.emailVerified) {
          // Lưu thông tin user nhưng không lưu tokens
          localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user))
          setUser(user)
          setIsAuthenticated(false) // Không đăng nhập thực sự
          
          toast.warning(response.message || 'Vui lòng kiểm tra email để xác nhận tài khoản.', {
            duration: 5000
          })
          
          return { 
            success: false, 
            error: 'Email chưa được xác nhận',
            requiresEmailVerification: true,
            user 
          }
        }
        
        // Lưu tokens và user data chỉ khi email đã được verify
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, tokens.accessToken)
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken)
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user))
        
        setUser(user)
        setIsAuthenticated(true)
        
        toast.success(response.message || 'Đăng nhập thành công!')
        
        // Chuyển trang sau khi login thành công: mặc định về Dashboard
        setTimeout(() => {
          if (redirectTo) {
            navigate(redirectTo)
          } else {
            navigate(ROUTES.DASHBOARD)
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

  // Đăng nhập với FB
const loginWithFacebook = async (redirectTo = null) => {
  try {
    setLoading(true);

    // Đảm bảo FB SDK đã sẵn sàng
    if (typeof window.FB === 'undefined') {
      toast.error('Facebook SDK chưa sẵn sàng. Hãy tải lại trang.');
      return { success: false, error: 'fb_sdk_unavailable' };
    }

    // 1) Mở popup login
    const fbResp = await new Promise((resolve) => {
      window.FB.login((response) => resolve(response), { scope: 'public_profile,email' });
    });
    if (!fbResp?.authResponse) {
      toast.error('Đăng nhập Facebook bị hủy');
      return { success: false, error: 'cancelled' };
    }

    const accessToken = fbResp.authResponse.accessToken;

    // 2) Lấy profile (id, name, email)
    const profile = await new Promise((resolve, reject) => {
      window.FB.api('/me', { fields: 'id,name,email' }, (resp) => {
        if (!resp || resp.error) return reject(resp?.error || new Error('FB api error'));
        resolve(resp);
      });
    });

    // 3) Gửi về backend
    const payload = {
      facebookId: profile.id,
      name: profile.name,
      email: profile.email,
      accessToken,
    };
    const response = await authService.loginWithFacebook(payload);

    if (response.success) {
      const { user, tokens } = response.data;
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, tokens.accessToken);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
      setUser(user);
      setIsAuthenticated(true);
      toast.success(response.message || 'Đăng nhập Facebook thành công!');
      setTimeout(() => {
        if (redirectTo) navigate(redirectTo);
        else navigate(ROUTES.DASHBOARD);
      }, 800);
      return { success: true, user };
    }

    toast.error(response.message || 'Đăng nhập Facebook thất bại');
    return { success: false, error: response.message };
  } catch (error) {
    const msg = error.response?.data?.message || error.message || 'Đăng nhập Facebook thất bại';
    toast.error(msg);
    return { success: false, error: msg };
  } finally {
    setLoading(false);
  }
};


  // Đăng ký
  const register = async (userData) => {
    try {
      setLoading(true)
      const response = await authService.register(userData)
        
      if (response.success) {
        toast.success(response.message || 'Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản.', {
          duration: 5000
        })
        
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


  // Đăng xuất
  const logout = useCallback((showToast = true) => {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.USER_DATA)
    setUser(null)
    setIsAuthenticated(false)
    
    if (showToast) {
      toast.success('Đăng xuất thành công!')
    }
    
    // Chuyển trang về trang home sau khi đăng xuất
    navigate(ROUTES.HOME)
  }, [navigate, toast])

  // Quên mật khẩu
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

  const updateUser = (newUserData) => {
    setUser(newUserData)
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(newUserData))
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
        
        // Chuyển trang về trang Dashboard sau khi xác nhận email thành công
        setTimeout(() => {
          navigate(ROUTES.DASHBOARD)
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
    loginWithFacebook,
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