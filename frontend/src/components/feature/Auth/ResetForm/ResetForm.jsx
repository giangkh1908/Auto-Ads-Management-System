import React, { useState } from 'react'
import './ResetForm.css'

function ResetForm({ onSuccess, onSwitchLogin }) {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = (e) => {
        e.preventDefault()
        if (loading) return
        setLoading(true)
        // TODO: integrate API
        setTimeout(() => {
            setLoading(false)
            if (onSuccess) onSuccess()
        }, 600)
    }

    return (
        <form className="auth-form" onSubmit={handleSubmit}>
            <div className="input-group">
                <div className="input-icon">✉️</div>
                <input type="email" placeholder="Nhập email" value={email} onChange={(e)=>setEmail(e.target.value)} required />
            </div>
            <button type="submit" className="btn-login-form" disabled={loading}>
                {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
            </button>
            <div className="form-switch">
                Bạn chưa có tài khoản? <span className="link" onClick={onSwitchLogin}>Đăng nhập ngay</span>
            </div>
        </form>
    )
}

export default ResetForm


