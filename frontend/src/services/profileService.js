import axiosInstance from '../utils/axios'

const PROFILE_ENDPOINTS = {
  GET_PROFILE: '/api/auth/me',
  UPDATE_PROFILE: '/api/auth/update-profile',
  CHANGE_PASSWORD: '/api/auth/change-password',
  UPLOAD_AVATAR: '/api/auth/upload-avatar'
}

export const profileService = {
  // Lấy thông tin profile hiện tại
  getCurrentProfile: async () => {
    try {
      const response = await axiosInstance.get(PROFILE_ENDPOINTS.GET_PROFILE)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  },

  // Cập nhật thông tin profile
  updateProfile: async (profileData) => {
    try {
      const response = await axiosInstance.put(PROFILE_ENDPOINTS.UPDATE_PROFILE, profileData)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  },

  // Đổi mật khẩu
  changePassword: async (passwordData) => {
    try {
      const response = await axiosInstance.post(PROFILE_ENDPOINTS.CHANGE_PASSWORD, passwordData)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  },

  // Upload avatar
  uploadAvatar: async (avatarFile) => {
    try {
      const formData = new FormData()
      formData.append('avatar', avatarFile)
      
      const response = await axiosInstance.post(PROFILE_ENDPOINTS.UPLOAD_AVATAR, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }
}

export default profileService
