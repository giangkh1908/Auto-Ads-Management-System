import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import profileService from '../../services/profileService'
import './Profile.css'
import { getNames } from "country-list";
import {User, AtSign, Mail, Phone, Lock, Eye, EyeOff } from "lucide-react";
import { validateRequired, validatePassword, validateEmail, validatePhone } from '../../utils/validation'
import no_avatar from '../../assets/home.jpg';

function Profile() {
  const { user, updateUser, logout } = useAuth()
  const toast = useToast()
  const countries = getNames();

  const [activeTab, setActiveTab] = useState('update')
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    _id: '',
    full_name: '',
    email: '',
    phone: '',
    username: '',
    country: '',
    profile: {
      address: '',
      bio: ''
    }
  })

  //Hiển thị pass
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  //Ẩn pass
  const [showPassword, setShowPassword] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false
  })

  // Load user data when component mounts
  useEffect(() => {
    if (user) {
      setFormData({
        _id: user._id || '',
        full_name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
        username: user.username || '',
        country: user.country || '',
        profile: {
          avatar: user.avatar || '',
          address: user.profile?.address || '',
          bio: user.profile?.bio || ''
        }
      })
    }
  }, [user])

  //Xử lý thay đổi data trong form
  const handleInputChange = (e) => {
    const { name, value } = e.target

    if (name === 'address' || name === 'bio') {
      setFormData(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          [name]: value
        }
      }))
      return
    }
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Xử lý đổi mật khẩu
  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  //Ẩn/hiện mật khẩu
  const togglePasswordVisibility = (field) => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (loading) return

    // Client-side validation (shared utils)
    const name = (formData.full_name || '').trim()
    const email = (formData.email || '').trim()
    const phone = (formData.phone || '').trim()

    if (!validateRequired(name)) {
      toast.error('Vui lòng nhập họ tên')
      return
    }

    if (!validateRequired(email)) {
      toast.error('Vui lòng nhập email')
      return
    }

    if (!validateEmail(email)) {
      toast.error('Email không hợp lệ')
      return
    }

    if (phone && !validatePhone(phone)) {
      toast.error('Số điện thoại không hợp lệ (9-11 chữ số)')
      return
    }

    try {
      setLoading(true)
      const response = await profileService.updateProfile(formData)

      if (response.success) {
        // Cập nhật user data trong context
        updateUser(response.data.user)
        toast.success(response.message || 'Cập nhật thông tin thành công!')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Cập nhật thông tin thất bại'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    if (loading) return

    // Validation (shared utils)
    if (!validateRequired(passwordData.currentPassword)) {
      toast.error('Vui lòng nhập mật khẩu hiện tại')
      return
    }
    if (!validateRequired(passwordData.newPassword)) {
      toast.error('Vui lòng nhập mật khẩu mới')
      return
    }
    if (!validateRequired(passwordData.confirmPassword)) {
      toast.error('Vui lòng nhập lại mật khẩu mới')
      return
    }
    if (!validatePassword(passwordData.newPassword, { minLength: 6 })) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự')
      return
    }
    if (passwordData.newPassword === passwordData.currentPassword) {
      toast.error('Mật khẩu mới không được trùng với mật khẩu hiện tại')
      return
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp')
      return
    }

    try {
      setLoading(true)
      const response = await profileService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      })

      if (response.success) {
        toast.success(response.message || 'Đổi mật khẩu thành công!')

        // Reset form
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })

        // Logout sau khi đổi mật khẩu
        setTimeout(() => {
          logout()
        }, 1500)
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Đổi mật khẩu thất bại'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="profile-border">
      <div className="profile-container">
        <div className="profile-card">
          {/* Tab Navigation */}
          <div className="profile-tabs">
            <button
              className={`tab-button ${activeTab === 'update' ? 'active' : ''}`}
              onClick={() => setActiveTab('update')}
            >
              Cập nhật hồ sơ
            </button>
            <button
              className={`tab-button ${activeTab === 'password' ? 'active' : ''}`}
              onClick={() => setActiveTab('password')}
            >
              Đổi mật khẩu
            </button>
          </div>

          {/* Profile Content */}
          {activeTab === 'update' && (
            <div className="profile-content">
              {/* Avatar Section */}
              <div className="avatar-section">
                <div className="avatar-circle">
                  <img
                    src={user?.avatar || no_avatar}
                    alt="Profile Avatar"
                  />
                </div>
              </div>

              {/* Profile Form */}
              <form className="profile-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="full_name">Họ tên của bạn</label>
                  <div className="input-with-icon">
                    <User className="input-icon" size={18} />
                    <input
                      type="text"
                      id="full_name"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="username">Username</label>
                  <div className="input-with-icon">
                    <AtSign className="input-icon" size={18} />
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className="form-input"
                      readOnly
                    />
                    <button type="button" className="edit-icon-btn">
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <div className="input-with-icon">
                    <Mail className="input-icon" size={18} />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Số điện thoại</label>
                  <div className="input-with-icon">
                    <Phone className="input-icon" size={18} />
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="country">Quốc gia</label>
                  <select
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="form-select"
                  >
                    <option value="">-- Chọn quốc gia --</option>
                    {countries.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* <div className="form-group">
                <label htmlFor="address">Địa chỉ</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.profile?.address}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div> */}

                {/* <div className="form-group">
                <label htmlFor="bio">Giới thiệu</label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.profile?.bio}
                  onChange={handleInputChange}
                  className="form-input"
                  rows={3}
                />
              </div> */}

                <button type="submit" className="submit-button" disabled={loading}>
                  {loading ? 'Đang lưu...' : 'Lưu'}
                </button>
              </form>
            </div>
          )}

          {/* Đổi mật khẩu */}
          {activeTab === 'password' && (
            <div className="profile-content">
              <form className="profile-form password-form" onSubmit={handlePasswordSubmit}>
                <div className="form-group">
                  <label htmlFor="currentPassword">Mật khẩu hiện tại</label>
                  <div className="input-with-icon">
                    <Lock className="input-icon" size={18} />
                    <input
                      type={showPassword.currentPassword ? "text" : "password"}
                      id="currentPassword"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      className="form-input"
                      placeholder="Nhập mật khẩu hiện tại"
                    />
                    <button
                      type="button"
                      className="eye-icon-btn"
                      onClick={() => togglePasswordVisibility('currentPassword')}
                    >
                      {showPassword.currentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="newPassword">Mật khẩu mới</label>
                  <div className="input-with-icon">
                    <Lock className="input-icon" size={18} />
                    <input
                      type={showPassword.newPassword ? "text" : "password"}
                      id="newPassword"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      className="form-input"
                      placeholder="Mật khẩu mới"
                    />
                    <button
                      type="button"
                      className="eye-icon-btn"
                      onClick={() => togglePasswordVisibility('newPassword')}
                    >
                      {showPassword.newPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Nhập lại mật khẩu</label>
                  <div className="input-with-icon">
                    <Lock className="input-icon" size={18} />
                    <input
                      type={showPassword.confirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      className="form-input"
                      placeholder="Nhập lại mật khẩu"
                    />
                    <button
                      type="button"
                      className="eye-icon-btn"
                      onClick={() => togglePasswordVisibility('confirmPassword')}
                    >
                      {showPassword.confirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button type="submit" className="submit-button" disabled={loading}>
                  {loading ? 'Đang đổi mật khẩu...' : 'Đổi mật khẩu'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Profile