import { useState } from 'react'
import { User, Mail, Phone, Lock, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../../../hooks/useAuth'
import EmailVerification from '../EmailVerification/EmailVerification'
import { validateFullName, validateEmail, validatePhone, validatePassword, buildErrors } from '../../../../utils/validation'
import './Register.css'

function Register({ onSwitchLogin }) {
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        password: ''
    })
    const [showPwd, setShowPwd] = useState(false)
    const [errors, setErrors] = useState({})
    const [showVerificationForm, setShowVerificationForm] = useState(false)
    const [registeredEmail, setRegisteredEmail] = useState('')
    
    const { register, loading } = useAuth()

    const validateForm = () => {
        const checks = [
            { key: 'full_name', valid: validateFullName(formData.full_name), message: 'Họ và tên phải có ít nhất 2 ký tự' },
            { key: 'email', valid: validateEmail(formData.email), message: 'Email không hợp lệ' },
            { key: 'phone', valid: validatePhone(formData.phone), message: 'Số điện thoại không hợp lệ' },
            { key: 'password', valid: validatePassword(formData.password, { minLength: 6 }), message: 'Mật khẩu phải có ít nhất 6 ký tự' },
        ]
        const newErrors = buildErrors(checks)
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
        
        if (result.success) {
            // Hiển thị form xác thực email thay vì chuyển sang login
            setRegisteredEmail(formData.email)
            setShowVerificationForm(true)
        }
    }

    const handleBackToLogin = () => {
        setShowVerificationForm(false)
        setRegisteredEmail('')
        // Chuyển sang form login
        if (onSwitchLogin) {
            onSwitchLogin()
        }
    }

    // Nếu đang hiển thị form xác thực email
    if (showVerificationForm) {
        return (
            <EmailVerification 
                email={registeredEmail}
                onBack={handleBackToLogin}
                title="Xác nhận email của bạn"
            />
        )
    }   
        return (
            <form className="auth-form" onSubmit={handleSubmit}>
                <div className="input-group-auth">
                    <div className="input-icon-auth"><User size={16} /></div>
                    <input 
                        placeholder="Họ và tên" 
                        value={formData.name} 
                        onChange={(e) => handleInputChange('full_name', e.target.value)}
                        className={errors.full_name ? 'error' : ''}
                    />
                    {errors.full_name && <div className="error-message">{errors.full_name}</div>}
                </div>
                
                <div className="input-group-auth">
                    <div className="input-icon-auth"><Mail size={16} /></div>
                    <input 
                        type="email" 
                        placeholder="Email" 
                        value={formData.email} 
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={errors.email ? 'error' : ''}
                    />
                    {errors.email && <div className="error-message">{errors.email}</div>}
                </div>
                
                <div className="input-group-auth">
                    <div className="input-icon-auth"><Phone size={16} /></div>
                    <input 
                        placeholder="Số điện thoại" 
                        value={formData.phone} 
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className={errors.phone ? 'error' : ''}
                    />
                    {errors.phone && <div className="error-message">{errors.phone}</div>}
                </div>
                
                <div className="input-group-auth">
                    <div className="input-icon-auth" aria-hidden="true"><Lock size={16} /></div>
                    <input 
                        type={showPwd ? 'text' : 'password'} 
                        placeholder="Mật khẩu" 
                        value={formData.password} 
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className={errors.password ? 'error' : ''}
                    />
                    <div className="input-action" onClick={() => setShowPwd(v => !v)}>
                        {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
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


