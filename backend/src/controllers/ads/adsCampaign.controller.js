import { fetchCampaignsFromFacebook, updateCampaignStatus, deleteEntity, fetchInsightsForEntities } from "../../services/ads/fbAdsService.js";
import User from "../../models/user/user.model.js";
import AdsCampaign from "../../models/ads/adsCampaign.model.js";
import AdsSet from "../../models/ads/adsSet.model.js";
import Ads from "../../models/ads/ads.model.js";


// Helper function to extract string ID from ObjectId format
function extractObjectId(value) {
  if (!value) return null;
  if (typeof value === 'string') {
    const match = value.match(/[0-9a-fA-F]{24}/);
    return match ? match[0] : null;
  }
  if (value.$oid) return value.$oid; // If MongoDB exports as { $oid: '...' }
  return value.toString();
}

// Get list campaigns
export async function listCampaignsCtrl(req, res) {
  try {
    const { account_id, q, status, page = 1, limit = 10, fetch_all = false } = req.query;
    
    // Build filter
    const filter = {};
    
    // Get all items (without filtering by status) - Frontend will filter
    if (account_id) {
      // Support both formats with and without act_
      const normalizedId = account_id.startsWith('act_') ? account_id.substring(4) : account_id;
      filter.external_account_id = { $in: [normalizedId, `act_${normalizedId}`] };
    }
    
    // If specific status is provided, apply it (including DELETED if query)
    if (status) {
      filter.status = status;
    }
    // If no status parameter, get all (including DELETED)
    
    if (q) filter.name = new RegExp(q, 'i');
    
    // Support fetch_all or limit > 10000 to allow Frontend to sort and paginate
    const limitNum = Number(limit);
    const shouldFetchAll = fetch_all === 'true' || fetch_all === true || limitNum === 0 || limitNum > 10000;
    
    let items, total;
    
    if (shouldFetchAll) {
      // Fetch all (without pagination) - for Frontend to sort and paginate
      [items, total] = await Promise.all([
        AdsCampaign.find(filter)
          .populate('created_by', 'full_name email')
          .sort({ createdAt: -1 }), // Sort at Backend first
        AdsCampaign.countDocuments(filter)
      ]);
      
      return res.status(200).json({
        items,
        total,
        page: 1,
        limit: total,
        pages: 1,
      });
    } else {
      // Pagination as before (if needed)
      const skip = (Number(page) - 1) * Number(limit);
      [items, total] = await Promise.all([
        AdsCampaign.find(filter)
          .populate('created_by', 'full_name email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit)),
        AdsCampaign.countDocuments(filter)
      ]);
      
      return res.status(200).json({
        items,
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)) || 1,
      });
    }
  } catch (err) {
    console.error("GET Campaigns error:", err);
    return res.status(500).json({ 
      message: "Lỗi khi lấy danh sách chiến dịch", 
      error: err.message 
    });
  }
}

// Get campaign from database by campaign_id
export async function getCampaignFromDatabase(req, res) {
  try {
    const { campaign_id } = req.query;
    
    if (!campaign_id) {
      return res.status(400).json({
        success: false,
        message: "Thiếu campaign_id"
      });
    }

    // Extract and validate campaign_id
    const cleanCampaignId = extractObjectId(campaign_id);
    if (!cleanCampaignId) {
      return res.status(400).json({
        success: false,
        message: "campaign_id không hợp lệ"
      });
    }

    const campaign = await AdsCampaign.findById(cleanCampaignId)
      .populate('created_by', 'full_name email');
    
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

// Get campaign details by campaign_id
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



// Get list campaigns directly from Facebook (without saving to DB)
import AdsAccount from "../../models/ads/adsAccount.model.js";

function normalizeAccountPair(accountId) {
  const hasPrefix = String(accountId).startsWith("act_");
  const withPrefix = hasPrefix ? String(accountId) : `act_${accountId}`;
  const withoutPrefix = hasPrefix ? String(accountId).substring(4) : String(accountId);
  return { withPrefix, withoutPrefix };
}

// Get list campaigns directly from Facebook (without saving to DB)
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

    // Get account info from DB to have _id and shop_id
    const { withPrefix, withoutPrefix } = normalizeAccountPair(account_id);
    const adsAccount = await AdsAccount.findOne({
      external_id: { $in: [withPrefix, withoutPrefix] },
    });

    if (!adsAccount) {
      // If not found in DB, still return data from FB but don't save (or error depends on logic)
      // Here we choose to still return data so UI doesn't break, but log warning
      console.warn(`⚠️ getCampaignsLiveCtrl: Không tìm thấy AdsAccount ${account_id} trong DB. Sẽ không lưu data.`);
    }

    // Fetch from Facebook
    const data = await fetchCampaignsFromFacebook(accessToken, account_id);

    // Upsert into DB if account exists
    if (adsAccount && data.length > 0) {
      const bulkOps = data.map((c) => {
        const campaignData = {
          shop_id: adsAccount.shop_id || null,
          account_id: adsAccount._id,
          name: c.name,
          status: c.status,
          objective: c.objective,
          external_id: c.id,
          external_account_id: withoutPrefix,
          effective_status: c.effective_status,
          special_ad_categories: c.special_ad_categories,
          daily_budget: c.daily_budget,
          lifetime_budget: c.lifetime_budget,
          start_time: c.start_time,
          stop_time: c.stop_time,
          insights: c.insights?.data?.[0] || {},
        };

        return {
          updateOne: {
            filter: { external_id: c.id },
            update: { $set: campaignData },
            upsert: true,
          },
        };
      });

      try {
        await AdsCampaign.bulkWrite(bulkOps, { ordered: false });
        console.log(`✅ Đã upsert ${data.length} campaigns từ Live API cho account ${account_id}`);
      } catch (writeErr) {
        console.error("❌ Lỗi bulkWrite campaigns:", writeErr);
        // No throw error to still return data for client
      }
    }

    return res.status(200).json({ items: data, total: data.length });
  } catch (err) {
    console.error("GET Live Campaigns error:", err);
    return res.status(500).json({ message: "Lỗi lấy campaigns từ Facebook", error: err.message });
  }
}

// Toggle campaign status directly on Facebook
export async function toggleCampaignStatusCtrl(req, res) {
  try {
    const { id } = req.params; // Facebook campaign id (external_id)
    const { status } = req.body; // "ACTIVE" | "PAUSED"
    if (!id || !status) {
      return res.status(400).json({ message: "Thiếu id hoặc status" });
    }

    // Get user's access token
    const user = await User.findById(req.user?._id).select("+facebookAccessToken");
    const accessToken = user?.facebookAccessToken;
    if (!accessToken) {
      return res.status(401).json({ message: "Thiếu access token Facebook" });
    }

    const fbId = id.startsWith("act_") ? id : id; // campaign id doesn't have act_
    await updateCampaignStatus(fbId, accessToken, status);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Toggle campaign status error:", err.response?.data || err.message);
    return res.status(500).json({ message: "Không thể cập nhật trạng thái campaign", detail: err.response?.data || err.message });
  }
}

export async function deleteCampaignCascadeCtrl(req, res) {
  try {
    const { id } = req.params;
    const campaign = await AdsCampaign.findById(id);
    if (!campaign)
      return res.status(404).json({ message: "Không tìm thấy chiến dịch." });

    // Get token from user or query
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

    // Get adset + ads related
    const adsets = await AdsSet.find({ campaign_id: campaign._id });
    const adsetIds = adsets.map((a) => a._id);
    const ads = await Ads.find({ set_id: { $in: adsetIds } });

    // If have token → delete on Facebook
    if (accessToken) {
      try {
        if (campaign.external_id)
          await deleteEntity(campaign.external_id, accessToken);
        // Delete adsets
        for (const adset of adsets) {
          if (adset.external_id)
            await deleteEntity(adset.external_id, accessToken);
        }
        // Delete ads
        for (const ad of ads) {
          if (ad.external_id) await deleteEntity(ad.external_id, accessToken);
        }

        console.log(
          `Đã xoá campaign ${campaign.name} và ${adsets.length} adsets trên Facebook.`
        );
      } catch (fbErr) {
        console.warn(
          "Lỗi khi xoá campaign trên Facebook:",
          fbErr?.response?.data || fbErr.message
        );
      }
    }

    // Delete soft in DB
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
    console.error("Xoá Campaign cascade lỗi:", err);
    return res.status(500).json({
      message: "Xoá thất bại",
      error: err.message,
    });
  }
}

// Archive campaign and its adsets, ads (set status ARCHIVED instead of DELETED)
export async function archiveCampaignCascadeCtrl(req, res) {
  try {
    const { id } = req.params;
    const campaign = await AdsCampaign.findById(id);
    if (!campaign)
      return res.status(404).json({ message: "Không tìm thấy chiến dịch." });

    // Get token from user or query
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

    // Get adset + ads related
    const adsets = await AdsSet.find({ campaign_id: campaign._id });
    const adsetIds = adsets.map((a) => a._id);
    const ads = await Ads.find({ set_id: { $in: adsetIds } });

    // If have token → delete on Facebook
    if (accessToken) {
      try {
        if (campaign.external_id)
          await deleteEntity(campaign.external_id, accessToken);
        // Delete adsets
        for (const adset of adsets) {
          if (adset.external_id)
            await deleteEntity(adset.external_id, accessToken);
        }
        // Delete ads
        for (const ad of ads) {
          if (ad.external_id) await deleteEntity(ad.external_id, accessToken);
        }

        console.log(
          `Đã xóa (archive) campaign ${campaign.name} và ${adsets.length} adsets trên Facebook.`
        );
      } catch (fbErr) {
        console.warn(
          "Lỗi khi xóa (archive) campaign trên Facebook:",
          fbErr?.response?.data || fbErr.message
        );
      }
    }

    // Update status ARCHIVED in DB
    const now = new Date();
    await Promise.all([
      Ads.updateMany(
        { set_id: { $in: adsetIds } },
        { status: "ARCHIVED", updated_at: now }
      ),
      AdsSet.updateMany(
        { _id: { $in: adsetIds } },
        { status: "ARCHIVED", updated_at: now }
      ),
      AdsCampaign.findByIdAndUpdate(id, { status: "ARCHIVED", updated_at: now }),
    ]);

    return res.status(200).json({
      success: true,
      message: `Đã lưu trữ chiến dịch "${campaign.name}" cùng toàn bộ nhóm quảng cáo & quảng cáo liên quan.`,
    });
  } catch (err) {
    console.error("Archive Campaign cascade error:", err);
    return res.status(500).json({
      message: "Lưu trữ thất bại",
      error: err.message,
    });
  }
}

// Copy Campaign, AdSet and Ad (DB only)
export async function copyCampaignCascadeCtrl(req, res) {
  try {
    const { id } = req.params;
    const source = await AdsCampaign.findById(id);
    if (!source) return res.status(404).json({ message: "Không tìm thấy chiến dịch." });

    // Create new campaign
    const newCampaign = await AdsCampaign.create({
      name: `${source.name || "Chiến dịch"} (bản sao)`,
      objective: source.objective,
      status: "IN_PROCESS",
      account_id: source.account_id,
      shop_id: source.shop_id,
      page_id: source.page_id,
      page_name: source.page_name,
      daily_budget: source.daily_budget,
      lifetime_budget: source.lifetime_budget,
      start_time: source.start_time,
      stop_time: source.stop_time,
      external_id: null,
      external_account_id: source.external_account_id,
    });

    // Get all adsets of source
    const srcAdsets = await AdsSet.find({ campaign_id: source._id }).lean();
    const idMap = new Map(); // map source adset _id -> new adset _id

    for (const s of srcAdsets) {
      const created = await AdsSet.create({
        campaign_id: newCampaign._id,
        external_account_id: s.external_account_id,
        name: `${s.name || "Nhóm quảng cáo"} (bản sao)`,
        status: "IN_PROCESS",
        configured_status: s.configured_status,
        effective_status: s.effective_status,
        optimization_goal: s.optimization_goal,
        billing_event: s.billing_event,
        bid_strategy: s.bid_strategy,
        bid_amount: s.bid_amount,
        pixel_id: s.pixel_id,
        conversion_event: s.conversion_event,
        promoted_object: s.promoted_object,
        targeting: s.targeting,
        daily_budget: s.daily_budget,
        lifetime_budget: s.lifetime_budget,
        start_time: s.start_time,
        end_time: s.end_time,
        external_id: null,
      });
      idMap.set(String(s._id), created._id);
    }

    // Copy ads of each adset
    const srcAdsetIds = srcAdsets.map((a) => a._id);
    const srcAds = await Ads.find({ set_id: { $in: srcAdsetIds } }).lean();
    const newAds = [];
    for (const a of srcAds) {
      const newSetId = idMap.get(String(a.set_id));
      if (!newSetId) continue;
      const createdAd = await Ads.create({
        name: `${a.name || "Quảng cáo"} (bản sao)`,
        status: "IN_PROCESS",
        external_id: null,
        external_account_id: a.external_account_id,
        set_id: newSetId,
        campaign_id: newCampaign._id,
        effective_status: a.effective_status,
        creative: a.creative,
      });
      newAds.push(createdAd);
    }

    return res.status(201).json({
      success: true,
      message: "Đã sao chép chiến dịch cùng AdSet & Ad.",
      data: {
        campaign: newCampaign,
        adsets: Array.from(idMap.values()),
        adsCount: newAds.length,
      },
    });
  } catch (err) {
    console.error("❌ Copy campaign cascade lỗi:", err);
    return res.status(500).json({ message: "Copy thất bại", error: err.message });
  }
}

// Get insights for multiple campaigns from Facebook
export async function getCampaignInsightsCtrl(req, res) {
  try {
    const { ids } = req.query;
    if (!ids) {
      return res.status(400).json({ message: "Thiếu danh sách IDs" });
    }

    const campaignIds = ids.split(',');

    // Get user's access token
    const user = await User.findById(req.user?._id).select("+facebookAccessToken");
    const accessToken = user?.facebookAccessToken;
    if (!accessToken) {
      return res.status(401).json({ message: "Thiếu access token Facebook" });
    }

    // Call service to get insights
    const insightsData = await fetchInsightsForEntities(campaignIds, accessToken);

    // Map data for FE: { id: '...', insights: {...} }
    const items = insightsData.map(item => ({
      id: item.id,
      insights: item.insights?.data?.[0] || {}
    }));

    return res.status(200).json({ items });

  } catch (err) {
    console.error("GET Campaign Insights error:", err.response?.data || err.message);
    return res.status(500).json({ 
      message: "Không thể lấy dữ liệu insights", 
      detail: err.response?.data || err.message 
    });
  }
}
