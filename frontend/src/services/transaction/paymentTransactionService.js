import axiosInstance from "../../utils/api/axios.js";

const paymentTransactionService = {
  getPaymentTransactionById: async (id) => {
    try {
      const response = await axiosInstance.get(`/api/payment-transactions/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  confirmTransfer: async (id) => {
    try {
      const response = await axiosInstance.patch(`/api/payment-transactions/${id}/confirm-transfer`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default paymentTransactionService;
