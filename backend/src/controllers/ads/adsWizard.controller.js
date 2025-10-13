// controllers/ads/adsWizard.controller.js
import { publishWizard } from "../../services/adsWizardService.js";
import User from "../../models/user.model.js";

export async function publishAdsWizard(req, res) {
  try {
    const { ad_account_id, access_token: tokenFromFE, campaign, adset, creative, ad } = req.body;

    // Nếu FE không truyền token, lấy từ DB user
    let access_token = tokenFromFE;
    if (!access_token) {
      const user = await User.findById(req.user?._id).select("+facebookAccessToken");
      access_token = user?.facebookAccessToken;
    }
    if (!ad_account_id || !access_token)
      return res.status(400).json({ success: false, message: "Thiếu ad_account_id hoặc access_token." });

    const data = await publishWizard({ ad_account_id, access_token, campaign, adset, creative, ad });

    return res.status(201).json({ success: true, message: "Publish thành công.", data });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Publish thất bại.",
      detail: error?.response?.data || error?.message,
    });
  }
}
