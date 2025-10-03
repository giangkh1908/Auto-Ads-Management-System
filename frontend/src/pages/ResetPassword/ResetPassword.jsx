import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { ROUTES } from '../../constants/app.constants'
import './ResetPassword.css'

function ResetPassword() {
    const { token } = useParams()
    const navigate = useNavigate()
    const { resetPassword } = useAuth()
    
    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
    })
    const [showPassword, setShowPassword] = useState(false)
    const [errors, setErrors] = useState({})
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [tokenError, setTokenError] = useState(null)

    const validateForm = () => {
        const newErrors = {}
        
        if (!formData.password.trim()) {
            newErrors.password = 'Mật khẩu là bắt buộc'
        } else if (formData.password.length < 6) {
            newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự'
        }
        
        if (!formData.confirmPassword.trim()) {
            newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu'
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp'
        }
        
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }))
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        if (!validateForm()) return
        
        const result = await resetPassword(token, formData.password)
        
        if (result.success) {
            setIsSubmitted(true)
            
            // Redirect to home after 2 seconds
            setTimeout(() => {
                navigate(ROUTES.HOME)
            }, 2000)
        } else if (result.error) {
            // Handle token-related errors
            if (result.error.includes('hết hạn')) {
                setTokenError('Liên kết đặt lại mật khẩu đã hết hạn. Vui lòng yêu cầu đặt lại mật khẩu mới.')
            } else if (result.error.includes('đã được sử dụng')) {
                setTokenError('Liên kết đặt lại mật khẩu đã được sử dụng. Vui lòng yêu cầu đặt lại mật khẩu mới nếu cần.')
            } else {
                setTokenError('Liên kết đặt lại mật khẩu không hợp lệ.')
            }
        }
    }

    if (isSubmitted) {
        return (
            <div className="reset-password-page">
                <div className="reset-password-container">
                    <div className="success-status">
                        <div className="success-icon">✅</div>
                        <h2>Đặt lại mật khẩu thành công!</h2>
                        <p>Mật khẩu của bạn đã được cập nhật.</p>
                        <p>Bạn sẽ được chuyển hướng về trang chủ trong 2 giây...</p>
                    </div>
                </div>
            </div>
        )
    }

    // Show token error if exists
    if (tokenError) {
        return (
            <div className="reset-password-page">
                <div className="reset-password-container">
                    <div className="error-status">
                        <div className="error-icon">❌</div>
                        <h2>Liên kết không hợp lệ</h2>
                        <p>{tokenError}</p>
                        <button 
                            className="btn-home"
                            onClick={() => navigate(ROUTES.HOME)}
                        >
                            Về trang chủ
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="reset-password-page">
            <div className="reset-password-container">
                <div className="form-header">
                    <h2>Đặt lại mật khẩu</h2>
                    <p>Nhập mật khẩu mới cho tài khoản của bạn</p>
                </div>

                <form onSubmit={handleSubmit} className="reset-form">
                    <div className="input-group">
                        <div className="input-icon">🔑</div>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Mật khẩu mới"
                            value={formData.password}
                            onChange={(e) => handleInputChange('password', e.target.value)}
                            className={errors.password ? 'error' : ''}
                        />
                        <div 
                            className="input-action" 
                            onClick={() => setShowPassword(v => !v)}
                        >
                            {showPassword ? '🙈' : '👁️'}
                        </div>
                        {errors.password && <div className="error-message">{errors.password}</div>}
                    </div>

                    <div className="input-group">
                        <div className="input-icon">🔑</div>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Xác nhận mật khẩu mới"
                            value={formData.confirmPassword}
                            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                            className={errors.confirmPassword ? 'error' : ''}
                        />
                        {errors.confirmPassword && <div className="error-message">{errors.confirmPassword}</div>}
                    </div>

                    <button type="submit" className="btn-reset">
                        Đặt lại mật khẩu
                    </button>
                </form>

                <div className="form-footer">
                    <span className="link" onClick={() => navigate('/')}>
                        Quay lại trang chủ
                    </span>
                </div>
            </div>
        </div>
    )
}

export default ResetPassword