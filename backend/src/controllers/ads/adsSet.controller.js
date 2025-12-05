import AdsSet from "../../models/ads/adsSet.model.js";
import { fetchAdsetsFromFacebook, updateAdsetStatus, deleteEntity, fetchInsightsForEntities } from "../../services/ads/fbAdsService.js";
import User from "../../models/user/user.model.js";
import Ads from "../../models/ads/ads.model.js";
import AdsAccount from "../../models/ads/adsAccount.model.js";
import AdsCampaign from "../../models/ads/adsCampaign.model.js";

// Helper function to extract string ID from ObjectId format
function extractObjectId(value) {
  if (!value) return null;
  if (typeof value === 'string') {
    const match = value.match(/[0-9a-fA-F]{24}/);
    return match ? match[0] : null;
  }
  if (value.$oid) return value.$oid; // in case MongoDB returns { $oid: '...' }
  return value.toString();
}

// Toggle adset status
export async function toggleAdsetStatusCtrl(req, res) {
  try {
    const { id } = req.params; // Facebook adset id
    const { status } = req.body; // "ACTIVE" | "PAUSED"
    if (!id || !status) return res.status(400).json({ message: "Thiếu id hoặc status" });

    const user = await User.findById(req.user?._id).select("+facebookAccessToken");
    const accessToken = user?.facebookAccessToken;
    if (!accessToken) return res.status(401).json({ message: "Thiếu access token Facebook" });

    await updateAdsetStatus(id, accessToken, status);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Toggle adset status error:", err.response?.data || err.message);
    return res.status(500).json({ message: "Không thể cập nhật trạng thái adset", detail: err.response?.data || err.message });
  }
}
// Get adset from database by adset_id or campaign_id
export async function getAdsetFromDatabase(req, res) {
  try {
    const { adset_id, campaign_id } = req.query;
    
    if (!adset_id && !campaign_id) {
      return res.status(400).json({
        success: false,
        message: "Thiếu adset_id hoặc campaign_id"
      });
    }

    // Extract and validate adset_id if provided
    const cleanAdsetId = extractObjectId(adset_id);
    if (adset_id && !cleanAdsetId) {
      return res.status(400).json({
        success: false,
        message: "adset_id không hợp lệ"
      });
    }

    // Extract and validate campaign_id if provided
    const cleanCampaignId = extractObjectId(campaign_id);
    if (campaign_id && !cleanCampaignId) {
      return res.status(400).json({
        success: false,
        message: "campaign_id không hợp lệ"
      });
    }

    let adset;
    if (cleanAdsetId) {
      adset = await AdsSet.findById(cleanAdsetId).populate('created_by', 'full_name email');
    } else if (cleanCampaignId) {
      const adsets = await AdsSet.find({ campaign_id: cleanCampaignId })
        .populate('created_by', 'full_name email')
        .sort({ createdAt: -1 });
      return res.status(200).json({
        success: true,
        data: adsets
      });
    }
    
    if (!adset) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy adset"
      });
    }

    return res.status(200).json({
      success: true,
      data: adset
    });
  } catch (err) {
    console.error("GET Adset from database error:", err);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi lấy adset từ database",
      error: err.message
    });
  }
}

// Get list of adsets
export async function listAdSetsCtrl(req, res) {
  try {
    const { account_id, campaign_id, q, status, page = 1, limit = 10, fetch_all = false } = req.query;

    const filter = {};

    // Get all items (do not filter by status) - Frontend will filter
    if (account_id) {
      const normalizedId = account_id.startsWith("act_")
        ? account_id.substring(4)
        : account_id;
      filter.external_account_id = { $in: [normalizedId, `act_${normalizedId}`] };
    }

    if (campaign_id) filter.campaign_id = campaign_id;
    // If there is a specific status filter, apply it (including DELETED if query)
    if (status) {
      filter.status = status;
    }
    // If no status parameter, get all (including DELETED)
    
    if (q) filter.name = new RegExp(q, "i");

    // Support fetch_all or large limit to allow Frontend to sort and paginate
    const limitNum = Number(limit);
    const shouldFetchAll = fetch_all === 'true' || fetch_all === true || limitNum === 0 || limitNum > 10000;
    
    let items, total;
    
    if (shouldFetchAll) {
      // Fetch all (no pagination) - let Frontend sort and paginate
      [items, total] = await Promise.all([
        AdsSet.find(filter)
          .populate('created_by', 'full_name email')
          .sort({ createdAt: -1 }), // Sort at Backend first
        AdsSet.countDocuments(filter)
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
        AdsSet.find(filter)
          .populate('created_by', 'full_name email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit)),
        AdsSet.countDocuments(filter),
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
    console.error("GET AdSets error:", err);
    return res.status(500).json({
      message: "Lỗi khi lấy danh sách nhóm quảng cáo",
      error: err.message,
    });
  }
}

function normalizeAccountPair(accountId) {
  const hasPrefix = String(accountId).startsWith("act_");
  const withPrefix = hasPrefix ? String(accountId) : `act_${accountId}`;
  const withoutPrefix = hasPrefix ? String(accountId).substring(4) : String(accountId);
  return { withPrefix, withoutPrefix };
}

// Get adsets from Facebook and save to DB
export async function getAdSetsLiveCtrl(req, res) {
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

    // 1. Get account info from DB
    const { withPrefix, withoutPrefix } = normalizeAccountPair(account_id);
    const adsAccount = await AdsAccount.findOne({
      external_id: { $in: [withPrefix, withoutPrefix] },
    });

    if (!adsAccount) {
      console.warn(`getAdSetsLiveCtrl: Không tìm thấy AdsAccount ${account_id} trong DB. Sẽ không lưu data.`);
    }

    // 2. Fetch from Facebook
    const data = await fetchAdsetsFromFacebook(accessToken, account_id);

    // 3. Upsert to DB if account exists
    if (adsAccount && data.length > 0) {
      // Get campaign_id (external) to find _id in DB
      const campaignExternalIds = [...new Set(data.map((s) => s.campaign_id).filter(Boolean))];
      const campaigns = await AdsCampaign.find({
        external_id: { $in: campaignExternalIds },
      }).select("_id external_id");
      const campaignsMap = new Map(campaigns.map((c) => [c.external_id, c._id]));

      const bulkOps = [];

      for (const s of data) {
        const campaignId = campaignsMap.get(s.campaign_id);
        // If campaign_id not found in DB, skip or save with null campaign_id (depends on logic).
        if (!campaignId) {
          continue;
        }

        const adsetData = {
          name: s.name,
          status: s.status,
          external_id: s.id,
          external_account_id: withoutPrefix,
          campaign_id: campaignId,
          effective_status: s.effective_status,
          daily_budget: s.daily_budget,
          lifetime_budget: s.lifetime_budget,
          targeting: s.targeting,
          start_time: s.start_time,
          end_time: s.end_time,
          optimization_goal: s.optimization_goal,
          insights: s.insights?.data?.[0] || {},
        };
        //Update or create adset
        bulkOps.push({
          updateOne: {
            filter: { external_id: s.id },
            update: { $set: adsetData },
            upsert: true,
          },
        });
      }

      if (bulkOps.length > 0) {
        try {
          await AdsSet.bulkWrite(bulkOps, { ordered: false });
          console.log(`Đã upsert ${bulkOps.length}/${data.length} adsets từ Live API cho account ${account_id}`);
        } catch (writeErr) {
          console.error("Lỗi bulkWrite adsets:", writeErr);
        }
      }
    }

    return res.status(200).json({ items: data, total: data.length });
  } catch (err) {
    console.error("GET Live AdSets error:", err);
    return res.status(500).json({ message: "Lỗi lấy adsets từ Facebook", error: err.message });
  }
}

/**
 * DELETE /api/adsets/:id
 * Delete AdSet & Ads
 * - Token: delete on Facebook
 * - No token: delete soft in DB
 */
export async function deleteAdsetCascadeCtrl(req, res) {
  try {
    const { id } = req.params;
    const adset = await AdsSet.findById(id);
    if (!adset) return res.status(404).json({ message: "Không tìm thấy nhóm quảng cáo." });

    // Get access_token from user or query
    let accessToken = req.user?.facebookAccessToken || req.query.access_token || null;

    if (!accessToken && req.user?._id) {
      const user = await User.findById(req.user._id).select("+facebookAccessToken");
      accessToken = user?.facebookAccessToken || null;
    }

    if (!accessToken) {
      console.warn("Không có Facebook access_token — chỉ xóa mềm trong DB.");
    }

    // Get all ads children in adset
    const ads = await Ads.find({ set_id: adset._id });

    // Delete on Facebook if has token
    if (accessToken) {
      try {
        // Delete all ads first
        for (const ad of ads) {
          if (ad.external_id) await deleteEntity(ad.external_id, accessToken);
        }

        // Sau đó xóa adset
        if (adset.external_id) await deleteEntity(adset.external_id, accessToken);

        console.log(`Đã xoá thật adset ${adset.name} (${adset.external_id}) và ${ads.length} ads trên Facebook`);
      } catch (fbErr) {
        console.warn("Lỗi khi xoá adset hoặc ads trên Facebook:", fbErr?.response?.data || fbErr.message);
      }
    }

    // Delete soft in DB
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
    console.error("Xoá AdSet cascade lỗi:", err);
    return res.status(500).json({
      message: "Xoá thất bại",
      error: err.message,
    });
  }
}

/**
 * POST /api/adsets/:id/archive
 * Archive adset & ads children (set status ARCHIVED instead of DELETED)
 */
export async function archiveAdsetCascadeCtrl(req, res) {
  try {
    const { id } = req.params;
    const adset = await AdsSet.findById(id);
    if (!adset) return res.status(404).json({ message: "Không tìm thấy nhóm quảng cáo." });

    // Get access_token from user or query
    let accessToken = req.user?.facebookAccessToken || req.query.access_token || null;

    if (!accessToken && req.user?._id) {
      const user = await User.findById(req.user._id).select("+facebookAccessToken");
      accessToken = user?.facebookAccessToken || null;
    }

    if (!accessToken) {
      return res.status(400).json({
        message:
          "Không tìm thấy Facebook access_token. Vui lòng đăng nhập lại.",
        missingToken: true,
      });
    }

    // Get all ads children in adset
    const ads = await Ads.find({ set_id: adset._id });

    // Delete on Facebook if has token (same as delete)
    if (accessToken) {
      try {
        // Delete ads first
        for (const ad of ads) {
          if (ad.external_id) await deleteEntity(ad.external_id, accessToken);
        }

        // Then delete adset
        if (adset.external_id) await deleteEntity(adset.external_id, accessToken);

        console.log(`Đã xóa (archive) adset ${adset.name} (${adset.external_id}) và ${ads.length} ads trên Facebook`);
      } catch (fbErr) {
        console.warn("Lỗi khi xóa (archive) adset hoặc ads trên Facebook:", fbErr?.response?.data || fbErr.message);
      }
    }

    // Update status ARCHIVED in DB
    const now = new Date();
    await Promise.all([
      Ads.updateMany({ set_id: adset._id }, { status: "ARCHIVED", updated_at: now }),
      AdsSet.findByIdAndUpdate(id, { status: "ARCHIVED", updated_at: now }),
    ]);

    return res.status(200).json({
      success: true,
      message: `Đã lưu trữ nhóm quảng cáo "${adset.name}" và ${ads.length} quảng cáo liên quan.`,
    });
  } catch (err) {
    console.error("Archive AdSet cascade error:", err);
    return res.status(500).json({
      message: "Lưu trữ thất bại",
      error: err.message,
    });
  }
}

/**
 * Create copy AdSet with all Ads children (DB only)
 */
export async function copyAdsetCascadeCtrl(req, res) {
  try {
    const { id } = req.params;
    const source = await AdsSet.findById(id);
    if (!source) return res.status(404).json({ message: "Không tìm thấy nhóm quảng cáo." });

    const newAdset = await AdsSet.create({
      campaign_id: source.campaign_id,
      external_account_id: source.external_account_id,
      name: `${source.name || "Nhóm quảng cáo"} (bản sao)`,
      status: "IN_PROCESS",
      configured_status: source.configured_status,
      effective_status: source.effective_status,
      optimization_goal: source.optimization_goal,
      billing_event: source.billing_event,
      bid_strategy: source.bid_strategy,
      bid_amount: source.bid_amount,
      pixel_id: source.pixel_id,
      conversion_event: source.conversion_event,
      promoted_object: source.promoted_object,
      targeting: source.targeting,
      daily_budget: source.daily_budget,
      lifetime_budget: source.lifetime_budget,
      start_time: source.start_time,
      end_time: source.end_time,
      external_id: null,
    });

    const ads = await Ads.find({ set_id: source._id }).lean();
    for (const a of ads) {
      await Ads.create({
        name: `${a.name || "Quảng cáo"} (bản sao)`,
        status: "IN_PROCESS",
        external_id: null,
        external_account_id: a.external_account_id,
        set_id: newAdset._id,
        campaign_id: source.campaign_id,
        effective_status: a.effective_status,
        creative: a.creative,
      });
    }

    return res.status(201).json({ success: true, message: "Đã sao chép AdSet cùng Ads.", data: { adset: newAdset } });
  } catch (err) {
    console.error("Copy AdSet cascade error:", err);
    return res.status(500).json({ message: "Copy thất bại", error: err.message });
  }
}

/**
 * GET /api/adsets/insights
 * Get insights for multiple adsets from Facebook
 */
export async function getAdsetInsightsCtrl(req, res) {
  try {
    const { ids } = req.query;
    if (!ids) {
      return res.status(400).json({ message: "Thiếu danh sách IDs" });
    }

    const adsetIds = ids.split(',');

    // Get user's access token
    const user = await User.findById(req.user?._id).select("+facebookAccessToken");
    const accessToken = user?.facebookAccessToken;
    if (!accessToken) {
      return res.status(401).json({ message: "Thiếu access token Facebook" });
    }

    // Call service to get insights
    const insightsData = await fetchInsightsForEntities(adsetIds, accessToken);

    // Map data for FE: { id: '...', insights: {...} }
    const items = insightsData.map(item => ({
      id: item.id,
      insights: item.insights?.data?.[0] || {}
    }));

    return res.status(200).json({ items });

  } catch (err) {
    console.error("GET Adset Insights error:", err.response?.data || err.message);
    return res.status(500).json({ 
      message: "Không thể lấy dữ liệu insights", 
      detail: err.response?.data || err.message 
    });
  }
}
