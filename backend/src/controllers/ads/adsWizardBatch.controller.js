// controllers/ads/adsWizardBatch.controller.js
import { publishWizardBatch } from "../../services/adsWizardBatchService.js";
import User from "../../models/user.model.js";
import AdsAccount from "../../models/ads/adsAccount.model.js";

/**
 * 🪄 Controller: Publish quy trình tạo quảng cáo Wizard với Batch API
 * Hỗ trợ multiple campaigns trong một request
 */
export async function publishAdsWizardBatch(req, res) {
  try {
    const { 
      ad_account_id, 
      access_token: tokenFromFE,
      campaignsList,
      dry_run = false 
    } = req.body;

    // Validate input
    if (!campaignsList || campaignsList.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'campaignsList is required and cannot be empty'
      });
    }

    if (campaignsList.length > 10) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 10 campaigns allowed per batch'
      });
    }

    // Lấy Access Token (tái sử dụng logic từ controller hiện tại)
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

    // Kiểm tra quyền sở hữu tài khoản quảng cáo (tái sử dụng logic hiện tại)
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

    // Validate campaigns data
    for (let i = 0; i < campaignsList.length; i++) {
      const campaign = campaignsList[i];
      
      if (!campaign.campaign?.name || !campaign.campaign?.objective) {
        return res.status(400).json({
          success: false,
          message: `Campaign ${i + 1}: Thiếu thông tin chiến dịch (tên hoặc mục tiêu).`,
        });
      }

      if (!campaign.adset?.name) {
        return res.status(400).json({
          success: false,
          message: `Campaign ${i + 1}: Thiếu tên nhóm quảng cáo (Ad Set).`,
        });
      }

      if (!campaign.creative?.object_story_spec) {
        return res.status(400).json({
          success: false,
          message: `Campaign ${i + 1}: Thiếu nội dung quảng cáo (Creative.object_story_spec).`,
        });
      }
    }

    console.log(`🚀 [Batch Wizard] Bắt đầu publish ${campaignsList.length} campaigns cho account: ${ad_account_id}`);

    // Gọi batch service
    const result = await publishWizardBatch({
      ad_account_id,
      access_token,
      campaignsList,
      dry_run
    });

    // Trả kết quả cho FE
    return res.status(201).json({
      success: true,
      message: dry_run
        ? `Dry run thành công cho ${campaignsList.length} campaigns (chưa publish thật).`
        : `Publish thành công ${result.successCount || campaignsList.length} campaigns.`,
      data: {
        ...result,
        totalCampaigns: campaignsList.length,
        successCount: result.successCount || campaignsList.length,
        errorCount: result.errors?.length || 0
      },
    });

  } catch (error) {
    console.error("Batch Publish Wizard Error:", error?.response?.data || error);
    const status = error?.response?.status || 500;
    const error_user_msg =
      error?.response?.data?.error_user_msg ||
      error?.response?.data?.error?.error_user_msg ||
      error?.message ||
      null;
    
    return res.status(status).json({
      success: false,
      message: "Batch publish thất bại.",
      error_user_msg,
    });
  }
}
