// controllers/ads/adsSet.controller.js
import AdsSet from "../../models/ads/adsSet.model.js";
import { syncAdSetsFromFacebook } from "../../services/fbAdsService.js";
import User from "../../models/user.model.js";

/**
 * GET /api/adsets
 * Lấy danh sách nhóm quảng cáo
 */
export async function listAdSetsCtrl(req, res) {
  try {
    const { account_id, campaign_id, q, status, page = 1, limit = 10 } = req.query;

    // Xây dựng filter
    const filter = {};
    if (account_id) {
      // Hỗ trợ cả định dạng có act_ và không có act_
      const normalizedId = account_id.startsWith("act_")
        ? account_id.substring(4)
        : account_id;
      filter.external_account_id = { $in: [normalizedId, `act_${normalizedId}`] };
    }

    if (campaign_id) filter.campaign_id = campaign_id;
    if (status) filter.status = status;
    if (q) filter.name = new RegExp(q, "i");

    // Lấy dữ liệu có phân trang
    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      AdsSet.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      AdsSet.countDocuments(filter),
    ]);

    return res.status(200).json({
      items,
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit)) || 1,
    });
  } catch (err) {
    console.error("GET AdSets error:", err);
    return res
      .status(500)
      .json({ message: "Lỗi khi lấy danh sách nhóm quảng cáo", error: err.message });
  }
}

/**
 * GET /api/adsets/sync
 * Đồng bộ nhóm quảng cáo (AdSets) từ Facebook
 */
export async function syncAdSetsCtrl(req, res) {
  try {
    const { account_id } = req.query;
    if (!account_id) {
      return res.status(400).json({ message: "Thiếu account_id" });
    }

    // Lấy token: ưu tiên query, fallback DB của user hiện tại
    let accessToken = req.query.access_token;
    if (!accessToken) {
      const user = await User.findById(req.user?._id).select("+facebookAccessToken");
      accessToken = user?.facebookAccessToken || null;
    }

    if (!accessToken) {
      return res.status(400).json({
        message: "Không tìm thấy Facebook access_token. Vui lòng đăng nhập lại.",
        missingToken: true,
      });
    }

    const results = await syncAdSetsFromFacebook(accessToken, account_id);
    return res.status(200).json({
      message: `Đã đồng bộ ${results.length} nhóm quảng cáo từ Facebook`,
      count: results.length,
    });
  } catch (err) {
    console.error("SYNC AdSets error:", err);
    return res.status(500).json({
      message: "Lỗi khi đồng bộ nhóm quảng cáo từ Facebook",
      error: err.message,
    });
  }
}
