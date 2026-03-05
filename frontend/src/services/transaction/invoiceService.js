import axiosInstance from "../../utils/api/axios.js";

const invoiceService = {
  getInvoiceByTransactionId: async (id) => {
    try {
      const response = await axiosInstance.get(`/api/invoices/transaction/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getInvoices: async (params) => {
    try {
      const response = await axiosInstance.get('/api/invoices', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default invoiceService;
