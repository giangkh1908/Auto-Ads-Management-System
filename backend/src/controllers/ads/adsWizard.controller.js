// controllers/ads/adsWizard.controller.js
import { 
  publishWizard, 
  updateWizard,
  publishCampaignService,
  publishAdsetService,
  publishAdService,
  publishFlexibleService,
} from "../../services/adsWizardService.js";
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

    //  Lấy Access Token: luôn ưu tiên token lưu trong DB để khớp APP SECRET
    const user = await User.findById(req.user?._id).select(
      "+facebookAccessToken"
    );
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Người dùng không tồn tại hoặc chưa đăng nhập.",
      });
    }
    const access_token = user.facebookAccessToken || tokenFromFE;

    if (!ad_account_id || !access_token) {
      return res.status(400).json({
        success: false,
        message: "Thiếu ad_account_id hoặc access_token.",
      });
    }

    // Kiểm tra quyền sở hữu tài khoản quảng cáo
    const account = await AdsAccount.findOne({
      external_id: ad_account_id,
      $or: [
        { user: req.user._id },
        { shop_admin_id: req.user._id },
        { shop_user_id: req.user._id },
      ],
    });

    if (!account) {
      return res.status(403).json({
        success: false,
        message: "Tài khoản quảng cáo không thuộc quyền sở hữu của bạn.",
      });
    }

    // Validate dữ liệu đầu vào cơ bản
    if (!campaign?.name || !campaign?.objective) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin chiến dịch (tên hoặc mục tiêu).",
      });
    }

    if (!adset?.name) {
      return res.status(400).json({
        success: false,
        message: "Thiếu tên nhóm quảng cáo (Ad Set).",
      });
    }

    if (!creative?.object_story_spec) {
      return res.status(400).json({
        success: false,
        message: "Thiếu nội dung quảng cáo (Creative.object_story_spec).",
      });
    }

    console.log(
      ` [Wizard] Bắt đầu publish quảng cáo cho account: ${ad_account_id}`
    );

    // Sửa trong hàm publishAdsWizard

    // Thêm đoạn này ngay trước khi gọi service
    // Khoảng dòng 68 (sau phần validate)
    if (adset.bid_strategy === "LOWEST_COST_WITHOUT_CAP" && adset.bid_amount !== undefined) {
      console.log("⚠️ Controller: Phát hiện xung đột bid_strategy và bid_amount");
      // Xóa bid_amount trực tiếp từ đối tượng hiện tại
      delete adset.bid_amount; // ✅ Hợp lệ - chỉ sửa thuộc tính không gán lại biến
    }

    // Gọi service chính
    const result = await publishWizard({
      ad_account_id,
      access_token,
      campaign: {
        ...campaign,
        account_id: account._id,
        shop_id: account.shop_id || req.user.shop_id, // fallback sang user.shop_id
        created_by: req.user._id,
        page_id: campaign.page_id,
        page_name: campaign.page_name,
      },
      adset: {
        ...adset, // Sử dụng adset đã được xử lý
        created_by: req.user._id,
      },
      creative: {
        ...creative,
        created_by: req.user._id,
      },
      ad: {
        ...ad,
        created_by: req.user._id,
      },
      dry_run,
      campaignDraftId,
      adsetDraftId,
      creativeDraftId,
      adDraftId,
    });

    // Trả kết quả cho FE
    return res.status(201).json({
      success: true,
      message: dry_run
        ? "Dry run thành công (chưa publish thật)."
        : "Publish thành công.",
      data: {
        campaign: result.campaign,
        adset: result.adset,
        ad: result.ad,
        creative: result.creative,
        drafts: result.drafts,
      },
    });
  } catch (error) {
    console.error("Publish Wizard Error:", error?.response?.data || error);
    const status = error?.response?.status || 500;
    const error_user_msg =
      error?.response?.data?.error_user_msg ||
      error?.response?.data?.error?.error_user_msg ||
      null;
    return res.status(status).json({
      success: false,
      message: "Publish thất bại.",
      error_user_msg,
    });
  }
}

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

    // Thêm vào trước khi gọi service
    if (adset?.bid_strategy === "LOWEST_COST_WITHOUT_CAP" && adset?.bid_amount !== undefined) {
      console.log("⚠️ Controller (update): Phát hiện xung đột bid_strategy và bid_amount");
      delete adset.bid_amount;
    }

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
    const status = error?.response?.status || 500;
    const error_user_msg =
      error?.response?.data?.error_user_msg ||
      error?.response?.data?.error?.error_user_msg ||
      null;
    return res.status(status).json({
      success: false,
      message: "Cập nhật wizard thất bại.",
      error_user_msg,
    });
  }
}

// ========================================
// 🎯 NEW FLEXIBLE CONTROLLERS FOR DIFFERENT MODELS
// ========================================

/**
 * 🎯 Controller: Tạo Campaign riêng biệt
 * POST /api/ads-wizard/publish-campaign
 */
export async function publishCampaignController(req, res) {
  try {
    const {
      ad_account_id,
      access_token: tokenFromFE,
      campaign,
      dry_run = false,
      campaignDraftId,
    } = req.body;

    // Lấy Access Token: luôn ưu tiên token lưu trong DB để khớp APP SECRET
    const user = await User.findById(req.user?._id).select("+facebookAccessToken");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Người dùng không tồn tại hoặc chưa đăng nhập.",
      });
    }
    const access_token = user.facebookAccessToken || tokenFromFE;

    if (!ad_account_id || !access_token) {
      return res.status(400).json({
        success: false,
        message: "Thiếu ad_account_id hoặc access_token.",
      });
    }

    // Kiểm tra quyền sở hữu tài khoản quảng cáo
    const account = await AdsAccount.findOne({
      external_id: ad_account_id,
      $or: [
        { user: req.user._id },
        { shop_admin_id: req.user._id },
        { shop_user_id: req.user._id },
      ],
    });

    if (!account) {
      return res.status(403).json({
        success: false,
        message: "Tài khoản quảng cáo không thuộc quyền sở hữu của bạn.",
      });
    }

    // Validate dữ liệu đầu vào cơ bản
    if (!campaign?.name || !campaign?.objective) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin chiến dịch (tên hoặc mục tiêu).",
      });
    }

    console.log(`[Campaign Only] Bắt đầu tạo campaign: ${campaign.name}`);

    // Gọi service tạo campaign
    const result = await publishCampaignService({
      ad_account_id,
      access_token,
      campaign: {
        ...campaign,
        account_id: account._id,
        shop_id: account.shop_id || req.user.shop_id,
        created_by: req.user._id,
        page_id: campaign.page_id,
        page_name: campaign.page_name,
      },
      dry_run,
      campaignDraftId,
    });

    return res.status(200).json({
      success: true,
      message: "Tạo campaign thành công!",
      data: result,
    });

  } catch (error) {
    console.error("❌ Lỗi publish campaign:", error);
    const error_user_msg = error?.response?.data?.error_user_msg || error.message;
    const status = error?.response?.status || 500;

    return res.status(status).json({
      success: false,
      message: "Tạo campaign thất bại.",
      error_user_msg,
    });
  }
}

/**
 * 🎯 Controller: Tạo AdSet cho Campaign đã có
 * POST /api/ads-wizard/publish-adset
 */
export async function publishAdsetController(req, res) {
  try {
    const {
      ad_account_id,
      access_token: tokenFromFE,
      campaignId,
      adset,
      dry_run = false,
      adsetDraftId,
    } = req.body;

    // Lấy Access Token
    const user = await User.findById(req.user?._id).select("+facebookAccessToken");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Người dùng không tồn tại hoặc chưa đăng nhập.",
      });
    }
    const access_token = user.facebookAccessToken || tokenFromFE;

    if (!ad_account_id || !access_token || !campaignId) {
      return res.status(400).json({
        success: false,
        message: "Thiếu ad_account_id, access_token hoặc campaignId.",
      });
    }

    // Kiểm tra quyền sở hữu tài khoản quảng cáo
    const account = await AdsAccount.findOne({
      external_id: ad_account_id,
      $or: [
        { user: req.user._id },
        { shop_admin_id: req.user._id },
        { shop_user_id: req.user._id },
      ],
    });

    if (!account) {
      return res.status(403).json({
        success: false,
        message: "Tài khoản quảng cáo không thuộc quyền sở hữu của bạn.",
      });
    }

    // Validate dữ liệu đầu vào
    if (!adset?.name) {
      return res.status(400).json({
        success: false,
        message: "Thiếu tên nhóm quảng cáo (Ad Set).",
      });
    }

    console.log(`[AdSet Only] Bắt đầu tạo adset: ${adset.name} cho campaign: ${campaignId}`);

    // Gọi service tạo adset
    const result = await publishAdsetService({
      ad_account_id,
      access_token,
      campaignId,
      adset: {
        ...adset,
        created_by: req.user._id,
      },
      dry_run,
      adsetDraftId,
    });

    return res.status(200).json({
      success: true,
      message: "Tạo adset thành công!",
      data: result,
    });

  } catch (error) {
    console.error("❌ Lỗi publish adset:", error);
    const error_user_msg = error?.response?.data?.error_user_msg || error.message;
    const status = error?.response?.status || 500;

    return res.status(status).json({
      success: false,
      message: "Tạo adset thất bại.",
      error_user_msg,
    });
  }
}

/**
 * 🎯 Controller: Tạo Ad cho AdSet đã có
 * POST /api/ads-wizard/publish-ad
 */
export async function publishAdController(req, res) {
  try {
    const {
      ad_account_id,
      access_token: tokenFromFE,
      adsetId,
      creative,
      ad,
      dry_run = false,
      adDraftId,
    } = req.body;

    // Lấy Access Token
    const user = await User.findById(req.user?._id).select("+facebookAccessToken");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Người dùng không tồn tại hoặc chưa đăng nhập.",
      });
    }
    const access_token = user.facebookAccessToken || tokenFromFE;

    if (!ad_account_id || !access_token || !adsetId) {
      return res.status(400).json({
        success: false,
        message: "Thiếu ad_account_id, access_token hoặc adsetId.",
      });
    }

    // Kiểm tra quyền sở hữu tài khoản quảng cáo
    const account = await AdsAccount.findOne({
      external_id: ad_account_id,
      $or: [
        { user: req.user._id },
        { shop_admin_id: req.user._id },
        { shop_user_id: req.user._id },
      ],
    });

    if (!account) {
      return res.status(403).json({
        success: false,
        message: "Tài khoản quảng cáo không thuộc quyền sở hữu của bạn.",
      });
    }

    // Validate dữ liệu đầu vào
    if (!creative?.object_story_spec) {
      return res.status(400).json({
        success: false,
        message: "Thiếu nội dung quảng cáo (Creative.object_story_spec).",
      });
    }

    if (!ad?.name) {
      return res.status(400).json({
        success: false,
        message: "Thiếu tên quảng cáo (Ad).",
      });
    }

    console.log(`[Ad Only] Bắt đầu tạo ad: ${ad.name} cho adset: ${adsetId}`);

    // Gọi service tạo ad
    const result = await publishAdService({
      ad_account_id,
      access_token,
      adsetId,
      creative: {
        ...creative,
        created_by: req.user._id,
      },
      ad: {
        ...ad,
        created_by: req.user._id,
      },
      dry_run,
      adDraftId,
    });

    return res.status(200).json({
      success: true,
      message: "Tạo ad thành công!",
      data: result,
    });

  } catch (error) {
    console.error("❌ Lỗi publish ad:", error);
    const error_user_msg = error?.response?.data?.error_user_msg || error.message;
    const status = error?.response?.status || 500;

    return res.status(status).json({
      success: false,
      message: "Tạo ad thất bại.",
      error_user_msg,
    });
  }
}

/**
 * 🎯 Controller: Tạo toàn bộ cấu trúc linh hoạt
 * POST /api/ads-wizard/publish-flexible
 */
export async function publishFlexibleController(req, res) {
  try {
    const {
      ad_account_id,
      access_token: tokenFromFE,
      campaignsList,
      dry_run = false,
    } = req.body;

    // Lấy Access Token
    const user = await User.findById(req.user?._id).select("+facebookAccessToken");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Người dùng không tồn tại hoặc chưa đăng nhập.",
      });
    }
    const access_token = user.facebookAccessToken || tokenFromFE;

    if (!ad_account_id || !access_token) {
      return res.status(400).json({
        success: false,
        message: "Thiếu ad_account_id hoặc access_token.",
      });
    }

    // Kiểm tra quyền sở hữu tài khoản quảng cáo
    const account = await AdsAccount.findOne({
      external_id: ad_account_id,
      $or: [
        { user: req.user._id },
        { shop_admin_id: req.user._id },
        { shop_user_id: req.user._id },
      ],
    });

    if (!account) {
      return res.status(403).json({
        success: false,
        message: "Tài khoản quảng cáo không thuộc quyền sở hữu của bạn.",
      });
    }

    // Validate dữ liệu đầu vào
    if (!campaignsList || !Array.isArray(campaignsList) || campaignsList.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Thiếu danh sách campaigns hoặc danh sách rỗng.",
      });
    }

    // Validate từng campaign
    for (let i = 0; i < campaignsList.length; i++) {
      const campaign = campaignsList[i];
      if (!campaign?.name || !campaign?.objective) {
        return res.status(400).json({
          success: false,
          message: `Campaign ${i + 1}: Thiếu tên hoặc mục tiêu.`,
        });
      }
      if (!campaign?.adsets || !Array.isArray(campaign.adsets) || campaign.adsets.length === 0) {
        return res.status(400).json({
          success: false,
          message: `Campaign ${i + 1}: Thiếu danh sách adsets.`,
        });
      }
    }

    console.log(`[Flexible Structure] Bắt đầu tạo ${campaignsList.length} campaigns với cấu trúc linh hoạt`);

    // Chuẩn bị dữ liệu với thông tin user
    const enrichedCampaignsList = campaignsList.map(campaign => ({
      ...campaign,
      account_id: account._id,
      shop_id: account.shop_id || req.user.shop_id,
      created_by: req.user._id,
      adsets: campaign.adsets.map(adset => ({
        ...adset,
        created_by: req.user._id,
        ads: adset.ads.map(ad => ({
          ...ad,
          created_by: req.user._id,
          creative: {
            ...ad.creative,
            created_by: req.user._id,
          }
        }))
      }))
    }));

    // Gọi service tạo cấu trúc linh hoạt
    const result = await publishFlexibleService({
      ad_account_id,
      access_token,
      campaignsList: enrichedCampaignsList,
      dry_run,
    });

    return res.status(200).json({
      success: result.success,
      message: result.message,
      data: result,
    });

  } catch (error) {
    console.error("❌ Lỗi publish flexible structure:", error);
    const error_user_msg = error?.response?.data?.error_user_msg || error.message;
    const status = error?.response?.status || 500;

    return res.status(status).json({
      success: false,
      message: "Tạo cấu trúc linh hoạt thất bại.",
      error_user_msg,
    });
  }
}
