import { syncCampaignsFromFacebook, fetchCampaignsFromFacebook, updateCampaignStatus, deleteEntity } from "../../services/fbAdsService.js";
import User from "../../models/user.model.js";
import AdsCampaign from "../../models/ads/adsCampaign.model.js";
import AdsSet from "../../models/ads/adsSet.model.js";
import Ads from "../../models/ads/ads.model.js";

// Helper function để extract string ID từ ObjectId format
function extractObjectId(value) {
  if (!value) return null;
  if (typeof value === 'string') {
    const match = value.match(/[0-9a-fA-F]{24}/);
    return match ? match[0] : null;
  }
  if (value.$oid) return value.$oid; // trong trường hợp Mongo xuất ra kiểu { $oid: '...' }
  return value.toString();
}

/**
 * GET /api/campaigns
 * Lấy danh sách chiến dịch quảng cáo
 */
export async function listCampaignsCtrl(req, res) {
  try {
    const { account_id, q, status, page = 1, limit = 10 } = req.query;

    const filter = {};
    filter.status = { $ne: "DELETED" };
    if (account_id) {
      const normalizedId = account_id.startsWith("act_")
        ? account_id.substring(4)
        : account_id;
      filter.external_account_id = {
        $in: [normalizedId, `act_${normalizedId}`],
      };
    }

    if (status) filter.status = status;
    if (q) filter.name = new RegExp(q, "i");

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      AdsCampaign.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      AdsCampaign.countDocuments(filter),
    ]);

    return res.status(200).json({
      items,
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit)) || 1,
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
 * GET /api/campaigns/database
 * Lấy campaign từ database theo campaign_id
 */
export async function getCampaignFromDatabase(req, res) {
  try {
    const { campaign_id } = req.query;
    
    if (!campaign_id) {
      return res.status(400).json({
        success: false,
        message: "Thiếu campaign_id"
      });
    }

    // Extract và validate campaign_id
    const cleanCampaignId = extractObjectId(campaign_id);
    if (!cleanCampaignId) {
      return res.status(400).json({
        success: false,
        message: "campaign_id không hợp lệ"
      });
    }

    const campaign = await AdsCampaign.findById(cleanCampaignId);
    
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy campaign"
      });
    }

    return res.status(200).json({
      success: true,
      data: campaign
    });
  } catch (err) {
    console.error("GET Campaign from database error:", err);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi lấy campaign từ database",
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
    if (!campaign)
      return res.status(404).json({ message: "Không tìm thấy chiến dịch" });

    return res.status(200).json(campaign);
  } catch (err) {
    console.error("GET Campaign error:", err);
    return res.status(500).json({
      message: "Lỗi khi lấy chi tiết chiến dịch",
      error: err.message,
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

    // Lấy token từ query (FE truyền) hoặc từ user DB
    let accessToken = req.query.access_token;
    if (!accessToken && req.user?._id) {
      const user = await User.findById(req.user._id).select(
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

    console.log(`Đồng bộ campaigns cho tài khoản ${account_id}`);
    const results = await syncCampaignsFromFacebook(accessToken, account_id);

    return res.status(200).json({
      message: `Đã đồng bộ ${results.length} chiến dịch quảng cáo từ Facebook`,
      count: results.length,
    });
  } catch (err) {
    console.error("SYNC Campaigns error:", err);
    return res.status(500).json({
      message: "Lỗi khi đồng bộ chiến dịch từ Facebook",
      error: err.message,
    });
  }
}

/**
 * DELETE /api/campaigns/:id
 * Xóa campaign + adset + ads liên quan (cascade)
 * - Có token: xóa thật trên Facebook
 * - Không có token: xóa mềm trong DB
 */
export async function deleteCampaignCascadeCtrl(req, res) {
  try {
    const { id } = req.params;
    const campaign = await AdsCampaign.findById(id);
    if (!campaign)
      return res.status(404).json({ message: "Không tìm thấy chiến dịch." });

    // ✅ Lấy token từ user hoặc query
    let accessToken = req.query.access_token;
    if (!accessToken && req.user?._id) {
      const user = await User.findById(req.user._id).select(
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

    // Lấy adset + ads liên quan
    const adsets = await AdsSet.find({ campaign_id: campaign._id });
    const adsetIds = adsets.map((a) => a._id);
    const ads = await Ads.find({ set_id: { $in: adsetIds } });

    // ✅ Nếu có token → xoá thật trên Facebook
    if (accessToken) {
      try {
        if (campaign.external_id)
          await deleteEntity(campaign.external_id, accessToken);

        for (const adset of adsets) {
          if (adset.external_id)
            await deleteEntity(adset.external_id, accessToken);
        }

        for (const ad of ads) {
          if (ad.external_id) await deleteEntity(ad.external_id, accessToken);
        }

        console.log(
          `🧹 Đã xoá thật campaign ${campaign.name} và ${adsets.length} adsets trên Facebook.`
        );
      } catch (fbErr) {
        console.warn(
          "⚠️ Lỗi khi xoá campaign trên Facebook:",
          fbErr?.response?.data || fbErr.message
        );
      }
    }

    // ✅ Dù có token hay không → Xoá mềm trong DB
    const now = new Date();
    await Promise.all([
      Ads.updateMany(
        { set_id: { $in: adsetIds } },
        { status: "DELETED", deleted_at: now }
      ),
      AdsSet.updateMany(
        { _id: { $in: adsetIds } },
        { status: "DELETED", deleted_at: now }
      ),
      AdsCampaign.findByIdAndUpdate(id, { status: "DELETED", deleted_at: now }),
    ]);

    return res.status(200).json({
      success: true,
      message: `Đã xoá chiến dịch "${campaign.name}" cùng toàn bộ nhóm quảng cáo & quảng cáo liên quan.`,
    });
  } catch (err) {
    console.error("❌ Xoá Campaign cascade lỗi:", err);
    return res.status(500).json({
      message: "Xoá thất bại",
      error: err.message,
    });
  }
}

/**
 * GET /api/campaigns/live
 * Lấy danh sách campaigns trực tiếp từ Facebook (không lưu DB)
 */
export async function getCampaignsLiveCtrl(req, res) {
  try {
    const { account_id } = req.query;
    if (!account_id) {
      return res.status(400).json({ message: "Thiếu account_id" });
    }

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

    const data = await fetchCampaignsFromFacebook(accessToken, account_id);
    return res.status(200).json({ items: data, total: data.length });
  } catch (err) {
    console.error("GET Live Campaigns error:", err);
    return res.status(500).json({ message: "Lỗi lấy campaigns từ Facebook", error: err.message });
  }
}

/**
 * PATCH /api/campaigns/:id/status
 * Bật/Tắt campaign trực tiếp trên Facebook
 */
export async function toggleCampaignStatusCtrl(req, res) {
  try {
    const { id } = req.params; // Facebook campaign id (external_id)
    const { status } = req.body; // "ACTIVE" | "PAUSED"
    if (!id || !status) {
      return res.status(400).json({ message: "Thiếu id hoặc status" });
    }

    // Lấy token người dùng hiện tại
    const user = await User.findById(req.user?._id).select("+facebookAccessToken");
    const accessToken = user?.facebookAccessToken;
    if (!accessToken) {
      return res.status(401).json({ message: "Thiếu access token Facebook" });
    }

    const fbId = id.startsWith("act_") ? id : id; // campaign id không có act_
    await updateCampaignStatus(fbId, accessToken, status);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Toggle campaign status error:", err.response?.data || err.message);
    return res.status(500).json({ message: "Không thể cập nhật trạng thái campaign", detail: err.response?.data || err.message });
  }
}

// export async function deleteCampaignCascadeCtrl(req, res) {
//   try {
//     const { id } = req.params;
//     const campaign = await AdsCampaign.findById(id);
//     if (!campaign)
//       return res.status(404).json({ message: "Không tìm thấy chiến dịch." });

//     // ✅ Lấy token từ user hoặc query
//     let accessToken = req.query.access_token;
//     if (!accessToken && req.user?._id) {
//       const user = await User.findById(req.user._id).select(
//         "+facebookAccessToken"
//       );
//       accessToken = user?.facebookAccessToken || null;
//     }

//     if (!accessToken) {
//       return res.status(400).json({
//         message:
//           "Không tìm thấy Facebook access_token. Vui lòng đăng nhập lại.",
//         missingToken: true,
//       });
//     }

//     // Lấy adset + ads liên quan
//     const adsets = await AdsSet.find({ campaign_id: campaign._id });
//     const adsetIds = adsets.map((a) => a._id);
//     const ads = await Ads.find({ set_id: { $in: adsetIds } });

//     // ✅ Nếu có token → xoá thật trên Facebook
//     if (accessToken) {
//       try {
//         if (campaign.external_id)
//           await deleteEntity(campaign.external_id, accessToken);

//         for (const adset of adsets) {
//           if (adset.external_id)
//             await deleteEntity(adset.external_id, accessToken);
//         }

//         for (const ad of ads) {
//           if (ad.external_id) await deleteEntity(ad.external_id, accessToken);
//         }

//         console.log(
//           `🧹 Đã xoá thật campaign ${campaign.name} và ${adsets.length} adsets trên Facebook.`
//         );
//       } catch (fbErr) {
//         console.warn(
//           "⚠️ Lỗi khi xoá campaign trên Facebook:",
//           fbErr?.response?.data || fbErr.message
//         );
//       }
//     }

//     // Dù có token hay không → Xoá mềm trong DB
//     const now = new Date();
//     await Promise.all([
//       Ads.updateMany(
//         { set_id: { $in: adsetIds } },
//         { status: "DELETED", deleted_at: now }
//       ),
//       AdsSet.updateMany(
//         { _id: { $in: adsetIds } },
//         { status: "DELETED", deleted_at: now }
//       ),
//       AdsCampaign.findByIdAndUpdate(id, { status: "DELETED", deleted_at: now }),
//     ]);

//     return res.status(200).json({
//       success: true,
//       message: `Đã xoá chiến dịch "${campaign.name}" cùng toàn bộ nhóm quảng cáo & quảng cáo liên quan.`,
//     });
//   } catch (err) {
//     console.error("❌ Xoá Campaign cascade lỗi:", err);
//     return res.status(500).json({
//       message: "Xoá thất bại",
//       error: err.message,
//     });
//   }
// }