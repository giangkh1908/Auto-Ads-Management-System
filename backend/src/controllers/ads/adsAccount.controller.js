// controllers/ads/adsAccount.controller.js
import {
  upsertAdAccountsFromFacebook,
  listAdsAccounts,
  getAdsAccountById,
  getAdsAccountByExternalId,
  updateAdsAccount,
  softDeleteAdsAccount,
} from "../../services/adsAccountService.js";
import User from "../../models/user.model.js";
/**
 * GET /api/ads-accounts/sync
 * Đồng bộ từ Facebook → lưu DB
 */
export async function syncAdsAccounts(req, res) {
  try {
    // 1) Lấy token từ query (nếu FE có truyền)
    let accessToken = req.query.access_token;

    // 2) Nếu không có: lấy từ DB theo user hiện tại
    if (!accessToken) {
      const user = await User.findById(req.user?._id).select("+facebookAccessToken");
      accessToken = user?.facebookAccessToken || null;
    }

    if (!accessToken) {
      return res.status(400).json({ message: "Thiếu Facebook access_token." });
    }

    const adminUserId = req.user?.id || req.user?._id;
    const shopUserId = req.user?.shop_user_id || null;

    const docs = await upsertAdAccountsFromFacebook(accessToken, { shopUserId, adminUserId });

    return res.status(200).json({
      message: "Đồng bộ tài khoản quảng cáo thành công",
      total: docs.length,
      accounts: docs,
    });
  } catch (err) {
    console.error("SYNC AdsAccount error:", err?.response?.data || err.message);
    return res.status(500).json({
      message: "Lỗi đồng bộ tài khoản quảng cáo",
      error: err?.response?.data || err.message,
    });
  }
}

/**
 * GET /api/ads-accounts
 */
export async function listAdsAccountsCtrl(req, res) {
  try {
    const { q, status, account_status, page, limit, sort } = req.query;
    const result = await listAdsAccounts({ q, status, account_status, page, limit, sort });
    return res.status(200).json(result);
  } catch (err) {
    console.error("LIST AdsAccount error:", err.message);
    return res.status(500).json({ message: "Lỗi lấy danh sách tài khoản quảng cáo", error: err.message });
  }
}

/**
 * GET /api/ads-accounts/:id
 */
export async function getAdsAccountCtrl(req, res) {
  try {
    const doc = await getAdsAccountById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Không tìm thấy tài khoản quảng cáo" });
    return res.status(200).json(doc);
  } catch (err) {
    console.error("GET AdsAccount error:", err.message);
    return res.status(500).json({ message: "Lỗi lấy chi tiết tài khoản quảng cáo", error: err.message });
  }
}

/**
 * GET /api/ads-accounts/by-external/:externalId
 */
export async function getAdsAccountByExternalCtrl(req, res) {
  try {
    const doc = await getAdsAccountByExternalId(req.params.externalId);
    if (!doc) return res.status(404).json({ message: "Không tìm thấy tài khoản quảng cáo" });
    return res.status(200).json(doc);
  } catch (err) {
    console.error("GET by external AdsAccount error:", err.message);
    return res.status(500).json({ message: "Lỗi lấy tài khoản quảng cáo", error: err.message });
  }
}

/**
 * PATCH /api/ads-accounts/:id
 */
export async function updateAdsAccountCtrl(req, res) {
  try {
    const doc = await updateAdsAccount(req.params.id, req.body || {});
    if (!doc) return res.status(404).json({ message: "Không tìm thấy tài khoản quảng cáo" });
    return res.status(200).json({ message: "Cập nhật thành công", account: doc });
  } catch (err) {
    console.error("UPDATE AdsAccount error:", err.message);
    return res.status(500).json({ message: "Lỗi cập nhật tài khoản quảng cáo", error: err.message });
  }
}

/**
 * DELETE /api/ads-accounts/:id
 */
export async function deleteAdsAccountCtrl(req, res) {
  try {
    const doc = await softDeleteAdsAccount(req.params.id);
    if (!doc) return res.status(404).json({ message: "Không tìm thấy tài khoản quảng cáo" });
    return res.status(200).json({ message: "Đã vô hiệu hóa tài khoản quảng cáo", account: doc });
  } catch (err) {
    console.error("DELETE AdsAccount error:", err.message);
    return res.status(500).json({ message: "Lỗi xóa tài khoản quảng cáo", error: err.message });
  }
}