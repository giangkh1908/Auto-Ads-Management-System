// controllers/ads/ads.controller.js
import Ads from "../../models/ads/ads.model.js";
import { syncAdsFromFacebook, deleteEntity } from "../../services/fbAdsService.js";
import User from "../../models/user.model.js";

/**
 * GET /api/ads
 * Lấy danh sách quảng cáo
 */
export async function listAdsCtrl(req, res) {
  try {
    const { account_id, adset_id, q, status, page = 1, limit = 10 } = req.query;

    // Xây dựng filter
    const filter = {};

    filter.status = { $ne: "DELETED" };
    if (account_id) {
      // Hỗ trợ cả định dạng có act_ và không có act_
      const normalizedId = account_id.startsWith("act_")
        ? account_id.substring(4)
        : account_id;
      filter.external_account_id = {
        $in: [normalizedId, `act_${normalizedId}`],
      };
    }

    if (adset_id) filter.set_id = adset_id;
    if (status) filter.status = status;
    if (q) filter.name = new RegExp(q, "i");

    // Lấy dữ liệu có phân trang
    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      Ads.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Ads.countDocuments(filter),
    ]);

    return res.status(200).json({
      items,
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit)) || 1,
    });
  } catch (err) {
    console.error("GET Ads error:", err);
    return res
      .status(500)
      .json({ message: "Lỗi khi lấy danh sách quảng cáo", error: err.message });
  }
}

/**
 * GET /api/ads/sync
 * Đồng bộ quảng cáo (Ads) từ Facebook
 */
export async function syncAdsCtrl(req, res) {
  try {
    const { account_id } = req.query;
    if (!account_id) {
      return res.status(400).json({ message: "Thiếu account_id" });
    }

    // Lấy token: ưu tiên query, fallback DB của user hiện tại
    let accessToken = req.query.access_token;
    if (!accessToken) {
      const user = await User.findById(req.user?._id).select(
        "+facebookAccessToken"
      );
      accessToken = user?.facebookAccessToken || null;
    }

    if (!accessToken) {
      return res.status(400).json({
        message:
          "Không tìm thấy Facebook access_token. Vui lòng đăng nhập lại.",
        missingToken: true,
      });
    }

    const results = await syncAdsFromFacebook(accessToken, account_id);
    return res.status(200).json({
      message: `Đã đồng bộ ${results.length} quảng cáo từ Facebook`,
      count: results.length,
    });
  } catch (err) {
    console.error("SYNC Ads error:", err);
    return res.status(500).json({
      message: "Lỗi khi đồng bộ quảng cáo từ Facebook",
      error: err.message,
    });
  }
}
export async function deleteAdCtrl(req, res) {
  try {
    const { id } = req.params;
    const ad = await Ads.findById(id);
    if (!ad)
      return res.status(404).json({ message: "Không tìm thấy quảng cáo." });

    // ✅ Lấy access token từ user hoặc query (ưu tiên query)
    let accessToken = req.user?.facebookAccessToken || req.query.access_token || null;

    // Nếu chưa có token trong user, thử lấy từ DB
    if (!accessToken && req.user?._id) {
      const user = await User.findById(req.user._id).select("+facebookAccessToken");
      accessToken = user?.facebookAccessToken || null;
    }

    if (!accessToken) {
      console.warn("⚠️ Không có Facebook access_token — chỉ xóa mềm trong DB, bỏ qua Facebook API.");
    }

    // ✅ Thực hiện xoá thật trên Facebook nếu có token & external_id
    if (accessToken && ad.external_id) {
      try {
        const deleted = await deleteEntity(ad.external_id, accessToken);
        if (deleted) {
          console.log(`🧹 Đã xoá thật quảng cáo ${ad.name} (${ad.external_id}) trên Facebook`);
        } else {
          console.warn(`⚠️ Không thể xoá quảng cáo ${ad.name} trên Facebook (Facebook trả về false)`);
        }
      } catch (fbErr) {
        console.warn("⚠️ Lỗi khi xoá trên Facebook:", fbErr?.response?.data || fbErr.message);
      }
    }

    // ✅ Xoá mềm trong DB (giữ lại record để không bị sync lại)
    await Ads.findByIdAndUpdate(id, {
      status: "DELETED",
      deleted_at: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: `Đã xoá quảng cáo "${ad.name}" ${accessToken ? "(Facebook + DB)" : "(chỉ trong DB)"}.`,
    });
  } catch (err) {
    console.error("❌ Xoá Ad lỗi:", err);
    return res.status(500).json({
      message: "Xoá thất bại",
      error: err.message,
    });
  }
}