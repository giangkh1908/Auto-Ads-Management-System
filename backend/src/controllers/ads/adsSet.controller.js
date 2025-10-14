import AdsSet from "../../models/ads/adsSet.model.js";
import { syncAdSetsFromFacebook, deleteEntity } from "../../services/fbAdsService.js";
import User from "../../models/user.model.js";
import Ads from "../../models/ads/ads.model.js";

/**
 * GET /api/adsets
 * Lấy danh sách nhóm quảng cáo
 */
export async function listAdSetsCtrl(req, res) {
  try {
    const { account_id, campaign_id, q, status, page = 1, limit = 10 } = req.query;

    const filter = {};

    filter.status = { $ne: "DELETED" };
    if (account_id) {
      const normalizedId = account_id.startsWith("act_")
        ? account_id.substring(4)
        : account_id;
      filter.external_account_id = { $in: [normalizedId, `act_${normalizedId}`] };
    }

    if (campaign_id) filter.campaign_id = campaign_id;
    if (status) filter.status = status;
    if (q) filter.name = new RegExp(q, "i");

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
    return res.status(500).json({
      message: "Lỗi khi lấy danh sách nhóm quảng cáo",
      error: err.message,
    });
  }
}

/**
 * GET /api/adsets/sync
 * Đồng bộ nhóm quảng cáo từ Facebook
 */
export async function syncAdSetsCtrl(req, res) {
  try {
    const { account_id } = req.query;
    if (!account_id) {
      return res.status(400).json({ message: "Thiếu account_id" });
    }

    // Lấy token: ưu tiên query, fallback DB của user hiện tại
    let accessToken = req.query.access_token;
    if (!accessToken && req.user?._id) {
      const user = await User.findById(req.user._id).select("+facebookAccessToken");
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

/**
 * DELETE /api/adsets/:id
 * Xóa AdSet + toàn bộ Ads con
 * - Có token: xóa thật trên Facebook
 * - Không có token: xóa mềm trong DB
 */
export async function deleteAdsetCascadeCtrl(req, res) {
  try {
    const { id } = req.params;
    const adset = await AdsSet.findById(id);
    if (!adset) return res.status(404).json({ message: "Không tìm thấy nhóm quảng cáo." });

    // ✅ Lấy access_token từ user hoặc query
    let accessToken = req.user?.facebookAccessToken || req.query.access_token || null;

    if (!accessToken && req.user?._id) {
      const user = await User.findById(req.user._id).select("+facebookAccessToken");
      accessToken = user?.facebookAccessToken || null;
    }

    if (!accessToken) {
      console.warn("⚠️ Không có Facebook access_token — chỉ xóa mềm trong DB.");
    }

    // Lấy toàn bộ ads con trong adset
    const ads = await Ads.find({ set_id: adset._id });

    // ✅ Xóa thật trên Facebook nếu có token
    if (accessToken) {
      try {
        // Xóa tất cả ads trước
        for (const ad of ads) {
          if (ad.external_id) await deleteEntity(ad.external_id, accessToken);
        }

        // Sau đó xóa adset
        if (adset.external_id) await deleteEntity(adset.external_id, accessToken);

        console.log(`🧹 Đã xoá thật adset ${adset.name} (${adset.external_id}) và ${ads.length} ads trên Facebook`);
      } catch (fbErr) {
        console.warn("⚠️ Lỗi khi xoá adset hoặc ads trên Facebook:", fbErr?.response?.data || fbErr.message);
      }
    }

    // ✅ Xóa mềm trong DB
    const now = new Date();
    await Promise.all([
      Ads.updateMany({ set_id: adset._id }, { status: "DELETED", deleted_at: now }),
      AdsSet.findByIdAndUpdate(id, { status: "DELETED", deleted_at: now }),
    ]);

    return res.status(200).json({
      success: true,
      message: `Đã xoá nhóm quảng cáo "${adset.name}" và ${ads.length} quảng cáo liên quan.`,
    });
  } catch (err) {
    console.error("❌ Xoá AdSet cascade lỗi:", err);
    return res.status(500).json({
      message: "Xoá thất bại",
      error: err.message,
    });
  }
}
