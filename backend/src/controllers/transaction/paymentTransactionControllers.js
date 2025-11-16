import PaymentTransaction from "../../models/paymentTransaction.model.js";
import mongoose from "mongoose";


export const createPaymentTransaction = async (req, res) => {
  try {
    const data = req.body;

    const transaction = await PaymentTransaction.create({
      ...data,
      user_id: req.user?._id,
      created_by: req.user?._id,
    });

    res.status(201).json({
      success: true,
      message: "Tạo giao dịch thành công",
      data: transaction,
    });
  } catch (error) {
    console.error("Lỗi tạo giao dịch:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi tạo giao dịch",
      error: error.message,
    });
  }
};

/**
 * 🟡 Lấy danh sách giao dịch (có phân trang + filter)
 */
export const getPaymentTransactions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      user_id,
      package_id,
    } = req.query;

    const filter = { deleted_at: null };

    if (status) filter.status = status;
    if (user_id) filter.user_id = user_id;
    if (package_id) filter.package_id = package_id;

    const transactions = await PaymentTransaction.find(filter)
      .populate("user_id", "name email")
      .populate("package_id", "name price")
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await PaymentTransaction.countDocuments(filter);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: transactions,
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách giao dịch:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi lấy danh sách giao dịch",
      error: error.message,
    });
  }
};

/**
 * 🟡 Lấy chi tiết giao dịch theo ID
 */
export const getPaymentTransactionById = async (req, res) => {
  try {
    const transaction = await PaymentTransaction.findById(req.params.id)
      .populate("user_id", "name email")
      .populate("package_id", "name price");

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy giao dịch",
      });
    }

    res.status(200).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    console.error("Lỗi lấy chi tiết giao dịch:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi lấy chi tiết giao dịch",
      error: error.message,
    });
  }
};

export const updatePaymentTransaction = async (req, res) => {
  try {
    const data = req.body;

    const transaction = await PaymentTransaction.findByIdAndUpdate(
      req.params.id,
      {
        ...data,
        updated_by: req.user?._id || null,
      },
      { new: true }
    );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy giao dịch",
      });
    }

    res.status(200).json({
      success: true,
      message: "Cập nhật giao dịch thành công",
      data: transaction,
    });
  } catch (error) {
    console.error("Lỗi cập nhật giao dịch:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi cập nhật giao dịch",
      error: error.message,
    });
  }
};

export const setPaymentMethod = async (req, res) => {
  try {
    const { method } = req.body;
    console.log("SET METHOD CALLED");
    console.log("ID nhận được:", req.params.id);
    console.log("Valid ObjectId?", mongoose.Types.ObjectId.isValid(req.params.id));
    console.log("User:", req.user?._id);
    const id = req.params.id;
    const objectId = new mongoose.Types.ObjectId(id);

    const updated = await PaymentTransaction.findByIdAndUpdate(
      objectId,
      {
        method,
        updated_by: req.user._id,
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy giao dịch",
      });
    }

    res.status(200).json({
      success: true,
      message: "Cập nhật phương thức thanh toán thành công",
      data: updated,
    });
  } catch (error) {
    console.error("Lỗi cập nhật method:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi cập nhật method thanh toán",
      error: error.message,
    });
  }
};

export const confirmBankTransfer = async (req, res) => {
  try {
    const updated = await PaymentTransaction.findByIdAndUpdate(
      req.params.id,
      {
        status: "pending",
        payment_at: new Date(),
        updated_by: req.user._id,
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy giao dịch",
      });
    }

    res.status(200).json({
      success: true,
      message: "Xác nhận chuyển khoản thành công",
      data: updated,
    });
  } catch (error) {
    console.error("Lỗi confirm bank:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi xác nhận chuyển khoản",
      error: error.message,
    });
  }
};

export const deletePaymentTransaction = async (req, res) => {
  try {
    const transaction = await PaymentTransaction.findByIdAndUpdate(
      req.params.id,
      {
        deleted_at: new Date(),
        updated_by: req.user?._id || null,
      },
      { new: true }
    );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy giao dịch",
      });
    }

    res.status(200).json({
      success: true,
      message: "Xóa giao dịch thành công",
    });
  } catch (error) {
    console.error("Lỗi xóa giao dịch:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi xóa giao dịch",
      error: error.message,
    });
  }
};