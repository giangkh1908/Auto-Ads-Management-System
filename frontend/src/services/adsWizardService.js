import axiosInstance from '../utils/axios';

export const publishAdsWizard = async (wizardData) => {
  try {
    const response = await axiosInstance.post('/api/ads-wizard/publish', wizardData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Lỗi tạo quảng cáo');
  }
};