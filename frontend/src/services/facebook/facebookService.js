import axiosInstance from "../../utils/api/axios.js";

const fetchFacebookPages = async () => {
  return await axiosInstance.get("/api/users/facebook/pages");
};

const connectFacebookPage = async (data) => {
  return await axiosInstance.post("/api/users/facebook/pages/connect", data);
};

const disconnectFacebookPage = async (pageId) => {
  return await axiosInstance.delete(`/api/users/facebook/pages/${pageId}`);
};

const refreshFacebookToken = async () => {
  return await axiosInstance.post("/api/users/facebook/token/refresh");
};

const updatePageStatus = async (pageId, pageStatus) => {
  return await axiosInstance.put(`/api/users/facebook/pages/${pageId}/status`, { pageStatus });
};

const facebookService = {
  fetchFacebookPages,
  connectFacebookPage,
  disconnectFacebookPage,
  refreshFacebookToken,
  updatePageStatus,
};

export default facebookService;
