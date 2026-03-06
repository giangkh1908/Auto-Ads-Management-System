import Log from "../models/admin/log.model.js";

export const saveLog = async (logData) => {
  try {
    // Tạo description tự động theo action
    let description = "";

    const userName = logData.user_name || "Người dùng";
    const targetName = logData.target_name || "đối tượng";

    switch (logData.action) {
      case "CREATE_USER":
        description = `${userName} đã tạo người dùng mới: "${targetName}"`;
        break;

      case "CONNECT_FACEBOOK_PAGE":
        const pageName = logData.page_info?.name || logData.request?.pageId || "Fanpage";
        description = `${userName} đã kết nối fanpage: "${pageName}"`;
        break;

      case "DISCONNECT_FACEBOOK_PAGE":
        const disconnectedPage = logData.request?.pageId || "Fanpage";
        description = `${userName} đã ngắt kết nối fanpage: "${disconnectedPage}"`;
        break;

      case "PAUSE_FACEBOOK_PAGE":
        const pausedPage = logData.request?.pageId || logData.target_name || "Fanpage";
        description = `${userName} đã tạm dừng fanpage: "${pausedPage}"`;
        break;

      case "RESUME_FACEBOOK_PAGE":
        const resumedPage = logData.request?.pageId || logData.target_name || "Fanpage";
        description = `${userName} đã kích hoạt lại fanpage: "${resumedPage}"`;
        break;

      case "REFRESH_FACEBOOK_TOKEN":
        description = `${userName} đã làm mới access token Facebook thành công`;
        break;

      // ===== CAMPAIGN ACTIONS =====
      case "CREATE_CAMPAIGN":
        description = `${userName} vừa tạo chiến dịch: "${targetName}"`;
        break;

      case "UPDATE_CAMPAIGN":
        description = `${userName} vừa cập nhật chiến dịch: "${targetName}"`;
        break;

      case "DELETE_CAMPAIGN":
        description = `${userName} vừa xóa chiến dịch: "${targetName}"`;
        break;

      case "ARCHIVE_CAMPAIGN":
        description = `${userName} vừa lưu trữ chiến dịch: "${targetName}"`;
        break;

      // ===== ADSET ACTIONS =====
      case "CREATE_ADSET":
        description = `${userName} vừa tạo nhóm quảng cáo: "${targetName}"`;
        break;

      case "UPDATE_ADSET":
        description = `${userName} vừa cập nhật nhóm quảng cáo: "${targetName}"`;
        break;

      case "DELETE_ADSET":
        description = `${userName} vừa xóa nhóm quảng cáo: "${targetName}"`;
        break;

      case "ARCHIVE_ADSET":
        description = `${userName} vừa lưu trữ nhóm quảng cáo: "${targetName}"`;
        break;

      // ===== AD ACTIONS =====
      case "CREATE_AD":
        description = `${userName} vừa tạo quảng cáo: "${targetName}"`;
        break;

      case "UPDATE_AD":
        description = `${userName} vừa cập nhật quảng cáo: "${targetName}"`;
        break;

      case "DELETE_AD":
        description = `${userName} vừa xóa quảng cáo: "${targetName}"`;
        break;

      case "ARCHIVE_AD":
        description = `${userName} vừa lưu trữ quảng cáo: "${targetName}"`;
        break;

      default:
        description = `${userName} đã thực hiện hành động: ${logData.action} trên ${targetName}`;
    }

    const log = new Log({
      user_id: logData.user_id,
      action: logData.action,
      target_type: logData.target_type,
      target_id: logData.target_id,
      description, // ← TỰ ĐỘNG TẠO
      request: logData.request,
      response: logData.response,
      ip_address: logData.ip_address,
      user_agent: logData.user_agent || "Unknown",
    });

    await log.save();
    return log;
  } catch (error) {
    console.error("Lỗi khi lưu log:", error);
    return null;
  }
};