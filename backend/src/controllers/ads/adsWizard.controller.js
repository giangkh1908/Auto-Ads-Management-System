// controllers/ads/adsWizard.controller.js
import { publishWizard, updateWizard } from "../../services/adsWizardService.js";
import User from "../../models/user.model.js";
import AdsAccount from "../../models/ads/adsAccount.model.js";

/**
 * 🪄 Controller: Publish quy trình tạo quảng cáo Wizard
 * Bao gồm Campaign → AdSet → Creative → Ad
 */
export async function publishAdsWizard(req, res) {
  try {
    const {
      ad_account_id,
      access_token: tokenFromFE,
      campaign,
      adset,
      creative,
      ad,
      dry_run = false,
      campaignDraftId,
      adsetDraftId,
      creativeDraftId,
      adDraftId,
    } = req.body;

    // 🧩 1️⃣ Lấy Access Token
    let access_token = tokenFromFE;
    if (!access_token) {
      const user = await User.findById(req.user?._id).select("+facebookAccessToken");
      if (!user)
        return res.status(401).json({ success: false, message: "Người dùng không tồn tại hoặc chưa đăng nhập." });
      access_token = user.facebookAccessToken;
    }

    if (!ad_account_id || !access_token) {
      return res.status(400).json({ success: false, message: "Thiếu ad_account_id hoặc access_token." });
    }

    // 🧩 2️⃣ Kiểm tra quyền sở hữu tài khoản quảng cáo
    const account = await AdsAccount.findOne({
      external_id: ad_account_id,
      $or: [
        { user: req.user._id },
        { shop_admin_id: req.user._id },
        { shop_user_id: req.user._id },
      ],
    });
    if (!account)
      return res.status(403).json({ success: false, message: "Tài khoản quảng cáo không thuộc quyền sở hữu của bạn." });

    // 🧩 3️⃣ Validate cơ bản
    if (!campaign?.name || !campaign?.objective)
      return res.status(400).json({ success: false, message: "Thiếu thông tin chiến dịch (tên hoặc mục tiêu)." });
    if (!adset?.name)
      return res.status(400).json({ success: false, message: "Thiếu tên nhóm quảng cáo (Ad Set)." });
    if (!creative?.object_story_spec)
      return res.status(400).json({ success: false, message: "Thiếu nội dung quảng cáo (Creative.object_story_spec)." });

    console.log(`🧠 [Wizard] Bắt đầu publish quảng cáo cho account: ${ad_account_id}`);

    // 🧩 4️⃣ Gọi service chính
    const result = await publishWizard({
      ad_account_id,
      access_token,
      campaign: {
        ...campaign,
        account_id: account._id,
        shop_id: account.shop_id || req.user.shop_id,
      },
      adset,
      creative,
      ad,
      dry_run,
      campaignDraftId,
      adsetDraftId,
      creativeDraftId,
      adDraftId,
    });

    // 🧩 5️⃣ Trả kết quả cho FE
    return res.status(201).json({
      success: true,
      message: dry_run ? "Dry run thành công (chưa publish thật)." : "Publish thành công.",
      data: result,
    });
  } catch (error) {
    console.error("🔥 Publish Wizard Error:", error?.response?.data || error);
    return res.status(500).json({
      success: false,
      message: "Publish thất bại.",
      detail: error?.response?.data || error?.message,
    });
  }
}

/**
 * 🛠️ Controller: Update quy trình quảng cáo Wizard
 * Cho phép cập nhật Campaign / AdSet / Creative / Ad
 */
export async function updateAdsWizard(req, res) {
  try {
    const {
      ad_account_id,
      access_token: tokenFromFE,
      campaign,
      adset,
      creative,
      ad,
      dry_run = false,
    } = req.body;

    // 🧩 1️⃣ Lấy Access Token
    let access_token = tokenFromFE;
    if (!access_token) {
      const user = await User.findById(req.user?._id).select("+facebookAccessToken");
      if (!user)
        return res.status(401).json({ success: false, message: "Người dùng không tồn tại hoặc chưa đăng nhập." });
      access_token = user.facebookAccessToken;
    }

    if (!ad_account_id || !access_token) {
      return res.status(400).json({ success: false, message: "Thiếu ad_account_id hoặc access_token." });
    }

    // 🧩 2️⃣ Kiểm tra quyền sở hữu tài khoản quảng cáo
    const account = await AdsAccount.findOne({
      external_id: ad_account_id,
      $or: [
        { user: req.user._id },
        { shop_admin_id: req.user._id },
        { shop_user_id: req.user._id },
      ],
    });
    if (!account)
      return res.status(403).json({ success: false, message: "Tài khoản quảng cáo không thuộc quyền sở hữu của bạn." });

    console.log(`🧠 [Wizard] Bắt đầu cập nhật quảng cáo cho account: ${ad_account_id}`);

    // 🧩 3️⃣ Gọi service updateWizard
    const result = await updateWizard({
      ad_account_id,
      access_token,
      campaign,
      adset,
      creative,
      ad,
      dry_run,
    });

    // 🧩 4️⃣ Trả kết quả cho FE
    return res.status(200).json({
      success: true,
      message: dry_run
        ? "Dry run update thành công (chưa cập nhật thật)."
        : "Cập nhật wizard thành công.",
      data: result,
    });
  } catch (error) {
    console.error("🔥 Update Wizard Error:", error?.response?.data || error);
    return res.status(500).json({
      success: false,
      message: "Cập nhật wizard thất bại.",
      detail: error?.response?.data || error?.message,
    });
  }
}
