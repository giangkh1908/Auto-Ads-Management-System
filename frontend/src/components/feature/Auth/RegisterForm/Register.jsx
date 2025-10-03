import { useState } from 'react'
import { useAuth } from '../../../../hooks/useAuth'
import './Register.css'

function Register({ onSwitchLogin }) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: ''
    })
    const [showPwd, setShowPwd] = useState(false)
    const [errors, setErrors] = useState({})
    
    const { register, loading } = useAuth()

    const validateForm = () => {
        const newErrors = {}
        
        if (!formData.name.trim()) {
            newErrors.name = 'Họ và tên là bắt buộc'
        } else if (formData.name.length < 2) {
            newErrors.name = 'Họ và tên phải có ít nhất 2 ký tự'
        }
        
        if (!formData.email.trim()) {
            newErrors.email = 'Email là bắt buộc'
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email không hợp lệ'
        }
        
        if (formData.phone && !/^[0-9+\-\s()]+$/.test(formData.phone)) {
            newErrors.phone = 'Số điện thoại không hợp lệ'
        }
        
        if (!formData.password.trim()) {
            newErrors.password = 'Mật khẩu là bắt buộc'
        } else if (formData.password.length < 6) {
            newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự'
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
        if (loading) return
        
        if (!validateForm()) return
        
        const result = await register(formData, onSwitchLogin)
        
        // Success handling is done in AuthContext with toast and auto-switch
    }

    return (
        <form className="auth-form" onSubmit={handleSubmit}>
            <div className="input-group">
                <div className="input-icon">👤</div>
                <input 
                    placeholder="Họ và tên" 
                    value={formData.name} 
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={errors.name ? 'error' : ''}
                />
                {errors.name && <div className="error-message">{errors.name}</div>}
            </div>
            
            <div className="input-group">
                <div className="input-icon">✉️</div>
                <input 
                    type="email" 
                    placeholder="Email" 
                    value={formData.email} 
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={errors.email ? 'error' : ''}
                />
                {errors.email && <div className="error-message">{errors.email}</div>}
            </div>
            
            <div className="input-group">
                <div className="input-icon">📞</div>
                <input 
                    placeholder="Số điện thoại (tùy chọn)" 
                    value={formData.phone} 
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={errors.phone ? 'error' : ''}
                />
                {errors.phone && <div className="error-message">{errors.phone}</div>}
            </div>
            
            <div className="input-group">
                <div className="input-icon">🔑</div>
                <input 
                    type={showPwd ? 'text' : 'password'} 
                    placeholder="Mật khẩu" 
                    value={formData.password} 
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={errors.password ? 'error' : ''}
                />
                <div className="input-action" onClick={() => setShowPwd(v => !v)}>
                    {showPwd ? '🙈' : '👁️'}
                </div>
                {errors.password && <div className="error-message">{errors.password}</div>}
            </div>

            <button type="submit" className="btn-login-form" disabled={loading}>
                {loading ? 'Đang xử lý...' : 'Đăng ký ngay'}
            </button>

            <div className="form-switch">
                Bạn đã có tài khoản? <span className="link" onClick={onSwitchLogin}>Đăng nhập ngay</span>
            </div>
        </form>
    )
}

export default Register


