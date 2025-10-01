import React, { useState } from 'react'
import './LoginForm.css'

function LoginForm({ onSuccess, onSwitchRegister, onSwitchReset }) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPwd, setShowPwd] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (loading) return
        setLoading(true)
        // TODO: integrate API
        setTimeout(() => {
            setLoading(false)
            if (onSuccess) onSuccess()
        }, 600)
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
                <input type="email" placeholder="Nhập email" value={email} onChange={(e)=>setEmail(e.target.value)} required />
            </div>

            <div className="input-group">
                <div className="input-icon">🔑</div>
                <input type={showPwd ? 'text' : 'password'} placeholder="Nhập mật khẩu" value={password} onChange={(e)=>setPassword(e.target.value)} required />
                <div className="input-action" onClick={()=>setShowPwd(v=>!v)}>{showPwd ? '🙈' : '👁️'}</div>
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


