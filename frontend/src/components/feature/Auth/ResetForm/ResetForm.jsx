import { useState } from 'react';
import { Mail, CheckCircle } from 'lucide-react';
import { useAuth } from '../../../../hooks/useAuth';
import './ResetForm.css';

function ResetForm({ onSwitchLogin }) {
    const [email, setEmail] = useState('')
    const [errors, setErrors] = useState({})
    const [isSubmitted, setIsSubmitted] = useState(false)
    
    const { forgotPassword, loading } = useAuth()

    const validateForm = () => {
        const newErrors = {}
        
        if (!email.trim()) {
            newErrors.email = 'Email là bắt buộc'
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'Email không hợp lệ'
        }
        
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    //Gửi email reset
    const handleSubmit = async (e) => {
        e.preventDefault()
        if (loading) return
        
        if (!validateForm()) return
        
        const result = await forgotPassword(email)
        
        if (result.success) {
            setIsSubmitted(true)
        }
    }

    //Gửi lại email reset
    const handleResendEmail = async () => {
        const result = await forgotPassword(email)
        
        if (result.success) {
            setIsSubmitted(true)
        }
    }

    if (isSubmitted) {
        return (
            //Form reset lại account
            <div className="auth-form">
                <div className="success-message">
                    <div className="success-icon"><CheckCircle size={20} /></div>
                    <h3>Email đã được gửi!</h3>
                    <p>Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến email <strong>{email}</strong></p>
                    <p>Vui lòng kiểm tra hộp thư (kể cả thư mục spam) và làm theo hướng dẫn.</p>
                    <button 
                        type="button" 
                        className="btn-login-form" 
                        onClick={handleResendEmail}
                        disabled={loading}
                    >
                        {loading ? 'Đang gửi...' : 'Gửi lại email'}
                    </button>
                </div>
                <div className="form-switch">
                    <span className="link" onClick={onSwitchLogin}>Quay lại đăng nhập</span>
                </div>
            </div>
        )
    }

    return (
        <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-header">
                <h3>Đặt lại mật khẩu</h3>
                <p>Nhập email của bạn để nhận hướng dẫn đặt lại mật khẩu</p>
            </div>
            
            <div className="input-group-auth">
                <div className="input-icon-auth"><Mail size={16} /></div>
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
            
            <button type="submit" className="btn-login-form" disabled={loading}>
                {loading ? 'Đang xử lý...' : 'Xác nhận'}
            </button>
            
            <div className="form-switch">
                Bạn nhớ mật khẩu? <span className="link" onClick={onSwitchLogin}>Đăng nhập ngay</span>
            </div>
        </form>
    )
}

export default ResetForm


