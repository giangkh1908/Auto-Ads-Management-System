import { syncCampaignsFromFacebook } from "../../services/fbAdsService.js";
import User from "../../models/user.model.js";
import AdsCampaign from "../../models/ads/adsCampaign.model.js";

/**
 * GET /api/campaigns
 * Lấy danh sách chiến dịch quảng cáo
 */
export async function listCampaignsCtrl(req, res) {
  try {
    const { account_id, q, status, page = 1, limit = 10 } = req.query;
    
    // Xây dựng filter
    const filter = {};
    if (account_id) {
      // Hỗ trợ cả định dạng có act_ và không có act_
      const normalizedId = account_id.startsWith('act_') ? account_id.substring(4) : account_id;
      filter.external_account_id = { $in: [normalizedId, `act_${normalizedId}`] };
    }
    
    if (status) filter.status = status;
    if (q) filter.name = new RegExp(q, 'i');
    
    // Lấy dữ liệu có phân trang
    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      AdsCampaign.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      AdsCampaign.countDocuments(filter)
    ]);
    
    return res.status(200).json({
      items,
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit)) || 1
    });
  } catch (err) {
    console.error("GET Campaigns error:", err);
    return res.status(500).json({ 
      message: "Lỗi khi lấy danh sách chiến dịch", 
      error: err.message 
    });
  }
}

/**
 * GET /api/campaigns/:id
 * Lấy chi tiết một chiến dịch
 */
export async function getCampaignCtrl(req, res) {
  try {
    const campaign = await AdsCampaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: "Không tìm thấy chiến dịch" });
    }
    return res.status(200).json(campaign);
  } catch (err) {
    console.error("GET Campaign error:", err);
    return res.status(500).json({ 
      message: "Lỗi khi lấy chi tiết chiến dịch", 
      error: err.message 
    });
  }
}

/**
 * GET /api/campaigns/sync
 * Đồng bộ campaigns từ Facebook
 */
export async function syncCampaignsCtrl(req, res) {
  try {
    const { account_id } = req.query;
    
    if (!account_id) {
      return res.status(400).json({ message: "Thiếu account_id" });
    }
    
    // 1) Lấy token từ query (nếu FE có truyền)
    let accessToken = req.query.access_token;

    // 2) Nếu không có: lấy từ DB theo user hiện tại
    if (!accessToken) {
      const user = await User.findById(req.user?._id).select("+facebookAccessToken");
      accessToken = user?.facebookAccessToken || null;
    }
    
    if (!accessToken) {
      return res.status(400).json({ 
        message: "Không tìm thấy Facebook access_token. Vui lòng đăng nhập lại.",
        missingToken: true
      });
    }
    
    console.log(`Đồng bộ campaigns cho tài khoản ${account_id}`);
    
    try {
      // Đồng bộ campaigns
      const results = await syncCampaignsFromFacebook(accessToken, account_id);
      
      return res.status(200).json({
        message: `Đã đồng bộ ${results.length} chiến dịch quảng cáo từ Facebook`,
        count: results.length
      });
    } catch (syncError) {
      // Xử lý lỗi từ Facebook API cụ thể
      if (syncError.response?.data?.error?.code === 190) {
        return res.status(401).json({
          message: "Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.",
          tokenExpired: true
        });
      }
      
      if (syncError.response?.data?.error?.code === 10) {
        return res.status(403).json({
          message: "Không có quyền truy cập quảng cáo. Vui lòng cấp thêm quyền.",
          permissionDenied: true
        });
      }
      
      throw syncError; // Ném lỗi để xử lý ở catch bên ngoài
    }
  } catch (err) {
    console.error("SYNC Campaigns error:", err);
    return res.status(500).json({
      message: "Lỗi khi đồng bộ chiến dịch từ Facebook",
      error: err.message
    });
  }
}