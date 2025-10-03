import React, { useState } from 'react'
import { useAuth } from '../../../../hooks/useAuth'
import './LoginForm.css'

function LoginForm({ onSuccess, onSwitchRegister, onSwitchReset }) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPwd, setShowPwd] = useState(false)
    const [errors, setErrors] = useState({})
    
    const { login, loading } = useAuth()

    const validateForm = () => {
        const newErrors = {}
        
        if (!email.trim()) {
            newErrors.email = 'Email là bắt buộc'
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'Email không hợp lệ'
        }
        
        if (!password.trim()) {
            newErrors.password = 'Mật khẩu là bắt buộc'
        } else if (password.length < 6) {
            newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự'
        }
        
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (loading) return
        
        if (!validateForm()) return
        
        const result = await login({ email, password })
        
        if (result.success) {
            // Close modal after successful login (navigation handled by AuthContext)
            if (onSuccess) onSuccess()
        }
    }

    const startFacebookLogin = () => {
        const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'
        window.location.href = `${API_BASE}/auth/facebook`
    }

    return (
        <form className="auth-form" onSubmit={handleSubmit}>
            <button type="button" className="btn-fb" onClick={startFacebookLogin}>
                <span className="fb-icon">f</span>
                Đăng nhập với Facebook
            </button>

            <div className="form-sep">Hoặc</div>

            <div className="input-group">
                <div className="input-icon">✉️</div>
                <input 
                    type="email" 
                    placeholder="Nhập email" 
                    value={email} 
                    onChange={(e) => {
                        setEmail(e.target.value)
                        if (errors.email) setErrors(prev => ({...prev, email: ''}))
                    }}
                    className={errors.email ? 'error' : ''}
                />
                {errors.email && <div className="error-message">{errors.email}</div>}
            </div>

            <div className="input-group">
                <div className="input-icon">🔑</div>
                <input 
                    type={showPwd ? 'text' : 'password'} 
                    placeholder="Nhập mật khẩu" 
                    value={password} 
                    onChange={(e) => {
                        setPassword(e.target.value)
                        if (errors.password) setErrors(prev => ({...prev, password: ''}))
                    }}
                    className={errors.password ? 'error' : ''}
                />
                <div className="input-action" onClick={() => setShowPwd(v => !v)}>
                    {showPwd ? '🙈' : '👁️'}
                </div>
                {errors.password && <div className="error-message">{errors.password}</div>}
            </div>

            <button type="submit" className="btn-login-form" disabled={loading}>
                {loading ? 'Đang xử lý...' : 'Đăng nhập'}
            </button>

            <div className="form-switch">
                Bạn chưa có tài khoản? <span className="link" onClick={onSwitchRegister}>Đăng ký ngay</span>
                <br />
                <span className="link" onClick={onSwitchReset}>Quên mật khẩu</span>
            </div>
        </form>
    )
}

export default LoginForm


