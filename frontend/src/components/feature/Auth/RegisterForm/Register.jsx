import React, { useState } from 'react'
import './Register.css'

function Register({ onSuccess, onSwitchLogin }) {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [password, setPassword] = useState('')
    const [showPwd, setShowPwd] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleSubmit = (e) => {
        e.preventDefault()
        if (loading) return
        setLoading(true)
        // TODO: integrate API + reCAPTCHA
        setTimeout(() => {
            setLoading(false)
            if (onSuccess) onSuccess()
        }, 800)
    }

    return (
        <form className="auth-form" onSubmit={handleSubmit}>
            <div className="input-group"><div className="input-icon">👤</div><input placeholder="Họ và tên" value={name} onChange={(e)=>setName(e.target.value)} required /></div>
            <div className="input-group"><div className="input-icon">✉️</div><input type="email" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} required /></div>
            <div className="input-group"><div className="input-icon">📞</div><input placeholder="Số điện thoại" value={phone} onChange={(e)=>setPhone(e.target.value)} /></div>
            <div className="input-group">
                <div className="input-icon">🔑</div>
                <input type={showPwd ? 'text' : 'password'} placeholder="Mật khẩu" value={password} onChange={(e)=>setPassword(e.target.value)} required />
                <div className="input-action" onClick={()=>setShowPwd(v=>!v)}>{showPwd ? '🙈' : '👁️'}</div>
            </div>

            {/* <div className="captcha-placeholder">Tôi không phải là người máy</div> */}

            <button type="submit" className="btn-login-form" disabled={loading}>
                {loading ? 'Đang xử lý...' : 'Đăng ký ngay'}
            </button>

            <div className="form-switch">
                Bạn chưa có tài khoản? <span className="link" onClick={onSwitchLogin}>Đăng nhập ngay</span>
            </div>
        </form>
    )
}

export default Register


