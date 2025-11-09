import Log from "../models/log.model.js";

export const saveLog = async ({
  user_id,
  shop_id,
  action,
  target_type,
  target_id,
  request,
  response,
  success = true,
  error_message,
  source = "manual",
  ip_address,
  meta,
}) => {
  try {
    await Log.create({
      user_id,
      shop_id,
      action,
      target_type,
      target_id,
      request,
      response,
      success,
      error_message,
      source,
      ip_address,
      meta,
    });
  } catch (err) {
    console.error("❌ Lỗi khi lưu log:", err.message);
  }
};