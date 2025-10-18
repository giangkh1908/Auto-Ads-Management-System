import axiosInstance from '../utils/axios';

export const publishAdsWizard = async (wizardData) => {
  try {
    const response = await axiosInstance.post('/api/ads-wizard/publish', wizardData);
    return response.data;
  } catch (error) {
    // Rethrow original axios error to preserve error.response (including error_user_msg)
    throw handleError(error);
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
    // Rethrow original axios error to preserve error.response (including error_user_msg)
    throw handleError(error);
  }
};

// Xử lý lỗi chuẩn cho service
function handleError(error) {
  return error;
}