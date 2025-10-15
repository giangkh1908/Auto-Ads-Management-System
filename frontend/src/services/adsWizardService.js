import axiosInstance from '../utils/axios';

export const publishAdsWizard = async (wizardData) => {
  try {
    const response = await axiosInstance.post('/api/ads-wizard/publish', wizardData);
    return response.data;
  } catch (error) {
    const detail = error.response?.data?.detail;
    const message = error.response?.data?.message || 'Lỗi tạo quảng cáo';
    throw new Error(detail ? `${message}: ${typeof detail === 'string' ? detail : JSON.stringify(detail)}` : message);
  }
};

export const updateAdsWizard = async (wizardData) => {
  try {
    const response = await axiosInstance.put(
      "/api/ads-wizard/update",
      wizardData
    );
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Lỗi cập nhật quảng cáo");
  }
};