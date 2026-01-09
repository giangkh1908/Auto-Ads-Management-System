import crypto from "crypto";
import querystring from "qs";
import axios from "axios";
import PaymentTransaction from "../../models/transaction/paymentTransaction.model.js";
import UserPackage from "../../models/package/userPackage.model.js";
import Package from "../../models/package/package.model.js";
import Shop from "../../models/shops/shop.model.js";
import ShopUser from "../../models/shops/shopUser.model.js";
import UserRole from "../../models/user/userRole.model.js";
import User from "../../models/user/user.model.js";
import { RoleEnum } from "../../constants/enum.js";
import { createInvoice } from "../invoice/invoiceControllers.js";

const config = {
  vnp_TmnCode: process.env.VNPAY_TMN_CODE || "Y4DJ13B6",
  vnp_HashSecret: process.env.VNPAY_HASH_SECRET || "BIYMKPJPKLOEPMWRKCRWIXJLOIETVDUN",
  vnp_Url: "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
  vnp_ReturnUrl: process.env.VNPAY_RETURN_URL || "https://api.vibestoneoficial.store/api/vnpay/return",
};

/* ============== HÀM SORT OBJECT THEO THỨ TỰ A-Z (CHÍNH XÁC NHƯ DEMO VNPAY) ============== */
function sortAndEncodeParams(obj) {
  const sorted = {};
  const keys = Object.keys(obj).sort();

  for (const key of keys) {
    // CHÍNH XÁC NHƯ DEMO: encodeURIComponent + %20 → +
    sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, "+");
  }
  return sorted;
}

/* ============== HÀM SORT OBJECT (DÙNG TRONG RETURN URL) ============== */
function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  for (const key of keys) {
    sorted[key] = obj[key];
  }
  return sorted;
}

export const createVnpayPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { orderData } = req.body;
    console.log("Creating VNPAY payment for orderId:", orderId, "with data:", orderData);

    const transaction = await PaymentTransaction.findById(orderId);
    if (!transaction || transaction.status !== "initializing") {
      return res.status(400).json({ success: false, message: "Giao dịch không hợp lệ" });
    }

    const ipAddr =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.socket?.remoteAddress ||
      "127.0.0.1";

    const cleanIp = ipAddr.includes(":") ? "127.0.0.1" : ipAddr;

    const createDate = new Date()
      .toISOString()
      .replace(/[-T:Z]/g, "")
      .slice(0, 14);

    const txnRef = `${createDate}_${orderId}`;

    let vnp_Params = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: config.vnp_TmnCode,
      vnp_Amount: String(orderData.packagePricing * 100),
      vnp_CreateDate: createDate,
      vnp_CurrCode: "VND",
      vnp_IpAddr: cleanIp, // Đảm bảo IPv4
      vnp_Locale: "vn",
      vnp_OrderInfo: `Thanh toan goi ${orderData.name || "Chatbot AI"}`,
      vnp_OrderType: "250000",
      vnp_ReturnUrl: config.vnp_ReturnUrl,
      vnp_TxnRef: txnRef,
    };

    // BƯỚC QUAN TRỌNG NHẤT: SORT + ENCODE CHUẨN VNPAY
    vnp_Params = sortAndEncodeParams(vnp_Params);

    // Tạo chuỗi ký
    const signData = querystring.stringify(vnp_Params, { encode: false });

    // HMAC-SHA512
    const hmac = crypto.createHmac("sha512", config.vnp_HashSecret);
    const vnp_SecureHash = hmac.update(signData, "utf-8").digest("hex");

    vnp_Params.vnp_SecureHash = vnp_SecureHash;

    // TẠO URL – encode = false để giữ nguyên "+" thay vì "%20"
    const paymentUrl =
      config.vnp_Url + "?" + querystring.stringify(vnp_Params, { encode: false });

    await PaymentTransaction.findByIdAndUpdate(orderId, {
      vnp_txn_ref: txnRef,
      vnp_create_date: createDate,
      status: "pending",
      method: "vnpay",
      metadata: {
        employees: orderData.employees,
        pages: orderData.pages,
        shops: orderData.shops,
        duration: orderData.duration,
      },
    });

    return res.json({ success: true, paymentUrl });
  } catch (error) {
    console.error("VNPAY Error:", error);
    return res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
};

/* ============== RETURN URL – CHỮ KÝ CHUẨN ============== */
export const vnpayReturn = async (req, res) => {
  try {
    let vnp_Params = req.query;
    let secureHash = vnp_Params.vnp_SecureHash;

    delete vnp_Params.vnp_SecureHash;
    delete vnp_Params.vnp_SecureHashType;

    // Ensure values are encoded exactly the same way as when creating the payment
    // so the computed hash matches the one returned by VNPAY.
    vnp_Params = sortAndEncodeParams(vnp_Params);
    let signData = querystring.stringify(vnp_Params, { encode: false });
    let hmac = crypto.createHmac("sha512", config.vnp_HashSecret);
    let validHash = hmac.update(signData, "utf-8").digest("hex");

    console.log("vnpayReturn - secureHash:", secureHash);
    console.log("vnpayReturn - validHash:", validHash);
    console.log("vnpayReturn - match:", secureHash === validHash);

    if (secureHash === validHash) {
      if (vnp_Params.vnp_ResponseCode === "00" && vnp_Params.vnp_TransactionStatus === "00") {
        // === KÍCH HOẠT GÓI CHO USER ===
        const txnRef = vnp_Params.vnp_TxnRef;
        const orderId = txnRef.split("_")[1];

        console.log("Payment success! txnRef:", txnRef, "orderId:", orderId);

        const transaction = await PaymentTransaction.findById(orderId).populate("user_id package_id");

        if (!transaction) {
          console.error("Transaction not found:", orderId);
          return res.redirect(`${process.env.FRONTEND_URL}/checkout?payment=failed&msg=notfound`);
        }

        console.log("Current transaction status:", transaction.status);

        if (transaction.status !== "success") {
          const pkg = transaction.package_id;
          const metaData = transaction.metadata || {};

          if (!pkg) {
            console.error("Package not found for transaction:", orderId);
            return res.redirect(`${process.env.FRONTEND_URL}/checkout?payment=failed&msg=nopkg`);
          }
          // Cập nhật UserPackage hoặc tạo mới nếu chưa có
          console.log("Finding pending UserPackage for user:", transaction.user_id._id, "package:", pkg._id);
          let userPackage = await UserPackage.findOne({
            user_id: transaction.user_id._id,
            package_id: pkg._id,
            status: "pending",
            deleted_at: null,
          }).sort({ created_at: -1 });

          if (userPackage) {
            userPackage.status = "active";
            userPackage.from_date = new Date();
            userPackage.to_date = new Date(Date.now() + (pkg.duration_days || 30) * 86400000);
            userPackage.updated_by = transaction.user_id._id;
            await userPackage.save();
            console.log("✅ Updated existing pending UserPackage:", userPackage._id);
          } else {
            console.log("⚠️ Pending UserPackage not found, creating new one...");
            userPackage = await UserPackage.create({
              user_id: transaction.user_id._id,
              package_id: pkg._id,
              pages: metaData.pages || pkg.pages,
              employees: metaData.employees || pkg.employees,
              shops: metaData.shops || pkg.shops,
              from_date: new Date(),
              to_date: new Date(Date.now() + pkg.duration_days * 86400000),
              status: "active",
              created_by: transaction.user_id._id,
            });
            console.log("✅ Created new UserPackage:", userPackage._id);
          }

          // Update PaymentTransaction status
          const updatedTransaction = await PaymentTransaction.findByIdAndUpdate(
            orderId,
            {
              status: "success",
              payment_at: new Date(),
            },
            { new: true }
          );

          console.log("PaymentTransaction updated - new status:", updatedTransaction.status);

          // Lấy thông tin user
          const user = await User.findById(transaction.user_id);
          const full_name = user?.full_name || "Shop Owner";

          // ✨ KIỂM TRA NÂNG CẤP PACKAGE: "Chatbot AI" → "Chatbot" - XÓA TẤT CẢ SHOPS
          try {
            // Lấy thông tin package mới (mua)
            const newPackageInfo = await Package.findById(transaction.package_id).select("name");

            // Tìm tất cả active UserPackage khác của user (package cũ)
            const oldActivePackages = await UserPackage.find({
              user_id: transaction.user_id,
              _id: { $ne: userPackage._id },
              status: { $in: ["active", "expiring soon", "new signup"] },
              deleted_at: null,
            }).populate("package_id", "name");
            // Kiểm tra nếu user đang dùng "Chatbot AI" và muốn mua "Chatbot"
            const currentHasChatbotAI = oldActivePackages.some(
              pkg => pkg.package_id?.name === "Chatbot AI"
            );
            const newIsChatbot = newPackageInfo?.name === "Chatbot";

            if (currentHasChatbotAI && newIsChatbot) {
              // Xóa toàn bộ shops có owner_id = user_id
              const deletedShops = await Shop.deleteMany({
                owner_id: transaction.user_id,
              });

              console.log(`🗑️ Đã xóa ${deletedShops.deletedCount} shops của user ${transaction.user_id} (downgrade: Chatbot AI → Chatbot)`);

              // Tạo shop mặc định cho user
              const shop = await Shop.create({
                shop_name: full_name,
                owner_id: user._id,
                status: "active",
                settings: {
                  currency: "VND",
                  timezone: "Asia/Ho_Chi_Minh",
                  language: "vi",
                },
                current_package_id: userPackage.package_id._id,
                package_expired_at: userPackage.to_date || null,
                created_by: user._id,
                updated_by: user._id,
              });
              console.log("Shop created:", shop._id);

              // Tạo ShopUser với status "active" để được tính vào employee count
              let shopUser;
              try {
                shopUser = await ShopUser.create({
                  user_id: user._id,
                  shop_id: shop._id,
                  is_manager: true,
                  status: "active", // Đảm bảo status là "active" để được tính vào employee count
                });
                console.log("ShopUser created:", shopUser._id);
              } catch (shopUserError) {
                console.error("Error creating ShopUser:", shopUserError);
                console.error("ShopUser error details:", {
                  message: shopUserError.message,
                  code: shopUserError.code,
                  keyPattern: shopUserError.keyPattern,
                  keyValue: shopUserError.keyValue,
                });
                throw shopUserError;
              }

              // Tạo UserRole với role Shop Owner
              try {
                await UserRole.create({
                  user_id: user._id,
                  role_id: RoleEnum.SHOP_OWNER,
                  shop_id: shop._id,
                  shop_user_id: shopUser._id,
                  is_current: true,
                  source: "system", // Đánh dấu là được tạo tự động từ hệ thống
                });
                console.log("UserRole created successfully");
              } catch (userRoleError) {
                console.error("Error creating UserRole:", userRoleError);
                console.error("UserRole error details:", {
                  message: userRoleError.message,
                  code: userRoleError.code,
                  name: userRoleError.name,
                  keyPattern: userRoleError.keyPattern,
                  keyValue: userRoleError.keyValue,
                });
                throw userRoleError;
              }
            }

          } catch (checkPackageError) {
            console.error("⚠️ Lỗi kiểm tra package downgrade:", checkPackageError);
            // Không throw error để không ảnh hưởng đến flow chính
          }

          // Create invoice for successful payment (non-blocking)
          try {
            await createInvoice(orderId);
            console.log("Invoice created for transaction:", orderId);
          } catch (invErr) {
            console.error("Error creating invoice for transaction:", orderId, invErr);
          }
        }

        return res.redirect(`${process.env.FRONTEND_URL}/dashboard?payment=success`);
      }
    }

    console.log("Payment validation failed or wrong response code");
    return res.redirect(`${process.env.FRONTEND_URL}/checkout?payment=failed`);
  } catch (error) {
    console.error("vnpayReturn error:", error);
    return res.redirect(`${process.env.FRONTEND_URL}/checkout?payment=failed&msg=error`);
  }
};

/* ============== QUERYDR – THEO DEMO CHÍNH THỨC (HMAC-SHA512 + SORT) ============== */
export const queryVnpayTransaction = async (req, res) => {
  try {
    const { txnRef } = req.body;
    const transaction = await PaymentTransaction.findOne({ vnp_txn_ref: txnRef });
    if (!transaction?.vnp_create_date) {
      return res.status(404).json({ success: false, message: "Không tìm giao dịch" });
    }

    let postData = {
      vnp_Version: "2.1.0",
      vnp_Command: "querydr",
      vnp_TmnCode: config.vnp_TmnCode,
      vnp_TxnRef: txnRef,
      vnp_TransactionDate: transaction.vnp_create_date,
      vnp_RequestId: Date.now().toString(),
      vnp_CreateDate: new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14),
      vnp_IpAddr: "127.0.0.1",
      vnp_OrderInfo: "Kiem tra giao dich",
    };

    postData = sortObject(postData);
    const signData = querystring.stringify(postData, { encode: false });
    const hmac = crypto.createHmac("sha512", config.vnp_HashSecret);
    postData.vnp_SecureHash = hmac.update(signData, "utf-8").digest("hex");

    const response = await axios.post(
      "https://sandbox.vnpayment.vn/merchant_webapi/api/transaction",
      postData,
      { headers: { "Content-Type": "application/json" } }
    );

    return res.json({
      success: response.data.vnp_ResponseCode === "00",
      data: response.data,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};