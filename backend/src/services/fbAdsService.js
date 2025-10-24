// services/fbAdsService.js
import axios from "axios";
import crypto from "crypto";

// MODELS
import AdsAccount from "../models/ads/adsAccount.model.js";
import AdsCampaign from "../models/ads/adsCampaign.model.js";
import AdsSet from "../models/ads/adsSet.model.js";
import Ads from "../models/ads/ads.model.js";

const FB_API = "https://graph.facebook.com/v23.0";

function buildFbAuthParams(accessToken) {
  const appSecret = process.env.FB_APP_SECRET || process.env.FACEBOOK_APP_SECRET || process.env.APP_SECRET;
  const base = { access_token: accessToken };
  if (!accessToken) return base;
  if (!appSecret) return base;
  try {
    const proof = crypto.createHmac("sha256", appSecret).update(accessToken).digest("hex");
    return { ...base, appsecret_proof: proof };
  } catch {
    return base;
  }
}

/* =========================
 *  Helpers
 * ========================= */

// Chuẩn hóa account id: luôn trả về cả 2 dạng
function normalizeAccountPair(accountId) {
  const hasPrefix = String(accountId).startsWith("act_");
  const withPrefix = hasPrefix ? accountId : `act_${accountId}`;
  const withoutPrefix = hasPrefix ? accountId.substring(4) : String(accountId);
  return { withPrefix, withoutPrefix };
}

// Tìm AdsAccount trong DB theo external_id (hỗ trợ cả act_xxx và xxx)
async function findAdsAccountByExternalId(accountId) {
  const { withPrefix, withoutPrefix } = normalizeAccountPair(accountId);
  return AdsAccount.findOne({
    external_id: { $in: [withPrefix, withoutPrefix] },
  });
}

/* =========================
 *  CREATE HELPERS (giữ nguyên)
 * ========================= */
export async function createCampaign(adAccountId, accessToken, body) {
  const { withPrefix } = normalizeAccountPair(adAccountId);
  const { data } = await axios.post(
    `${FB_API}/${withPrefix}/campaigns`,
    body,
    { params: buildFbAuthParams(accessToken) }
  );
  return data.id;
}

export async function createAdSet(adAccountId, accessToken, body) {
  // Clone body để tránh thay đổi dữ liệu gốc
  const payload = { ...body };
  
  // Xử lý xung đột bid_strategy và bid_amount
  if (payload.bid_strategy === 'LOWEST_COST_WITHOUT_CAP' && payload.bid_amount !== undefined) {
    console.log("🛠️ fbAdsService: Phát hiện xung đột bid_strategy/bid_amount");
    console.log(`🔧 Xóa bid_amount (${payload.bid_amount}) khi dùng LOWEST_COST_WITHOUT_CAP`);
    delete payload.bid_amount;
  }
  
  // Đảm bảo có bid_amount khi dùng LOWEST_COST_WITH_BID_CAP
  if (payload.bid_strategy === 'LOWEST_COST_WITH_BID_CAP' && payload.bid_amount === undefined) {
    console.log("⚠️ fbAdsService: Thiếu bid_amount cho LOWEST_COST_WITH_BID_CAP");
    console.log("🔧 Thêm bid_amount mặc định (100) cho LOWEST_COST_WITH_BID_CAP");
    payload.bid_amount = 100; // Giá trị mặc định
  }
  
  const { withPrefix } = normalizeAccountPair(adAccountId);
  const { data } = await axios.post(
    `${FB_API}/${withPrefix}/adsets`,
    payload, // Sử dụng payload đã được xử lý
    { params: buildFbAuthParams(accessToken) }
  );
  return data.id;
}

export async function createCreative(adAccountId, accessToken, body) {
  const { withPrefix } = normalizeAccountPair(adAccountId);
  
  // ✅ Whitelist: Chỉ gửi các field Facebook chấp nhận
  const allowedFields = [
    'name',
    'object_story_spec',
    'image_hash',
    'video_id',
    'thumbnail_url',
    'asset_feed_spec',
    'url_tags',
    'degrees_of_freedom_spec',
    'instagram_actor_id',
    'instagram_permalink_url',
    'interactive_components_spec',
  ];
  
  const filteredBody = Object.keys(body)
    .filter(key => allowedFields.includes(key) && body[key] !== undefined)
    .reduce((obj, key) => {
      obj[key] = body[key];
      return obj;
    }, {});
  
  console.log('🎨 Creating creative with filtered fields:', Object.keys(filteredBody));
  
  const { data } = await axios.post(
    `${FB_API}/${withPrefix}/adcreatives`,
    filteredBody,  // ✅ Gửi filtered body
    { params: buildFbAuthParams(accessToken) }
  );
  return data.id;
}

export async function createAd(adAccountId, accessToken, body) {
  const { withPrefix } = normalizeAccountPair(adAccountId);
  
  // ✅ Whitelist: Chỉ gửi các field Facebook chấp nhận cho Ad
  const allowedFields = [
    'name',
    'adset_id',
    'creative',
    'status',
    'tracking_specs',
    'conversion_specs',
    'destination_url',
  ];
  
  const filteredBody = Object.keys(body)
    .filter(key => allowedFields.includes(key) && body[key] !== undefined)
    .reduce((obj, key) => {
      obj[key] = body[key];
      return obj;
    }, {});
  
  console.log('📢 Creating ad with filtered fields:', Object.keys(filteredBody));
  
  const { data } = await axios.post(
    `${FB_API}/${withPrefix}/ads`,
    filteredBody,  // ✅ Gửi filtered body
    { params: buildFbAuthParams(accessToken) }
  );
  return data.id;
}

/**
 * Xoá entity (campaign, adset, ad, creative...) khỏi Facebook
 * @param {string} entityId - ID thật của entity trên Facebook
 * @param {string} accessToken - Facebook access_token hợp lệ
 * @returns {boolean} true nếu xoá thành công, false nếu lỗi
 */
export async function deleteEntity(entityId, accessToken) {
  if (!entityId || !accessToken) {
    console.warn("⚠️ deleteEntity() thiếu entityId hoặc accessToken");
    return false;
  }

  try {
    const url = `${FB_API}/${entityId}`;
    const { data } = await axios.delete(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    // Facebook trả về { success: true } nếu xoá thành công
    if (data?.success) {
      console.log(`✅ Đã xoá thành công entity ${entityId} trên Facebook`);
      return true;
    } else {
      console.warn(`⚠️ Facebook không xoá entity ${entityId}:`, data);
      return false;
    }
  } catch (err) {
    const fbErr = err.response?.data?.error;
    if (fbErr?.code === 190) {
      console.error("🚨 Token Facebook hết hạn hoặc không hợp lệ:", fbErr);
    } else if (fbErr?.code === 10) {
      console.error("🚨 Không có quyền xoá entity:", fbErr);
    } else {
      console.error(`❌ Lỗi xoá entity ${entityId}:`, fbErr || err.message);
    }
    return false;
  }
}


/* =========================
 *  UPDATE STATUS HELPERS
 * ========================= */
export async function updateCampaignStatus(entityId, accessToken, status) {
  const { data } = await axios.post(
    `${FB_API}/${entityId}`,
    { status },
    { params: buildFbAuthParams(accessToken) }
  );
  return data;
}

export async function updateAdsetStatus(entityId, accessToken, status) {
  const { data } = await axios.post(
    `${FB_API}/${entityId}`,
    { status },
    { params: buildFbAuthParams(accessToken) }
  );
  return data;
}

export async function updateAdStatus(entityId, accessToken, status) {
  const { data } = await axios.post(
    `${FB_API}/${entityId}`,
    { status },
    { params: buildFbAuthParams(accessToken) }
  );
  return data;
}

/* =========================
 *  UPDATE ENTITY HELPERS (Full field updates)
 * ========================= */

/**
 * Update campaign với nhiều fields (không chỉ status)
 * Whitelist: name, status, daily_budget, lifetime_budget, start_time, stop_time
 */
export async function updateCampaign(entityId, accessToken, updates) {
  const payload = { ...updates };
  
  // Whitelist các fields có thể update cho Campaign
  const allowedFields = ['name', 'status', 'daily_budget', 'lifetime_budget', 'start_time', 'stop_time'];
  const filteredPayload = Object.keys(payload)
    .filter(key => allowedFields.includes(key) && payload[key] !== undefined)
    .reduce((obj, key) => {
      obj[key] = payload[key];
      return obj;
    }, {});

  // Nếu không có field nào để update, return ngay
  if (Object.keys(filteredPayload).length === 0) {
    console.log("⚠️ updateCampaign: Không có field nào để update");
    return null;
  }

  console.log(`🔄 Updating campaign ${entityId} với fields:`, Object.keys(filteredPayload));
  const { data } = await axios.post(
    `${FB_API}/${entityId}`,
    filteredPayload,
    { params: buildFbAuthParams(accessToken) }
  );
  return data;
}

/**
 * Update adset với nhiều fields
 * Whitelist: name, status, daily_budget, lifetime_budget, start_time, end_time, 
 *            targeting, optimization_goal, bid_strategy, bid_amount, billing_event, conversion_event
 */
export async function updateAdset(entityId, accessToken, updates) {
  const payload = { ...updates };
  
  // ✅ Xử lý xung đột bid_strategy (giống createAdSet)
  if (payload.bid_strategy === 'LOWEST_COST_WITHOUT_CAP' && payload.bid_amount !== undefined) {
    console.log("🔧 updateAdset: Xóa bid_amount khi dùng LOWEST_COST_WITHOUT_CAP");
    delete payload.bid_amount;
  }
  
  // ✅ Đảm bảo có bid_amount khi dùng LOWEST_COST_WITH_BID_CAP
  if (payload.bid_strategy === 'LOWEST_COST_WITH_BID_CAP' && payload.bid_amount === undefined) {
    console.log("⚠️ updateAdset: Thiếu bid_amount cho LOWEST_COST_WITH_BID_CAP");
    payload.bid_amount = 100; // Giá trị mặc định
  }
  
  // Whitelist các fields có thể update cho AdSet
  const allowedFields = [
    'name', 'status', 'daily_budget', 'lifetime_budget', 
    'start_time', 'end_time', 'targeting', 'optimization_goal',
    'bid_strategy', 'bid_amount', 'billing_event', 'conversion_event'
  ];
  
  const filteredPayload = Object.keys(payload)
    .filter(key => allowedFields.includes(key) && payload[key] !== undefined)
    .reduce((obj, key) => {
      obj[key] = payload[key];
      return obj;
    }, {});

  // Nếu không có field nào để update, return ngay
  if (Object.keys(filteredPayload).length === 0) {
    console.log("⚠️ updateAdset: Không có field nào để update");
    return null;
  }

  console.log(`🔄 Updating adset ${entityId} với fields:`, Object.keys(filteredPayload));
  const { data } = await axios.post(
    `${FB_API}/${entityId}`,
    filteredPayload,
    { params: buildFbAuthParams(accessToken) }
  );
  return data;
}

/**
 * Update ad (chỉ name và status - Facebook không cho update creative)
 * NOTE: Creative không thể update - phải tạo ad mới nếu muốn đổi creative
 */
export async function updateAd(entityId, accessToken, updates) {
  const payload = { ...updates };
  
  // Ad chỉ update được name và status
  const allowedFields = ['name', 'status'];
  const filteredPayload = Object.keys(payload)
    .filter(key => allowedFields.includes(key) && payload[key] !== undefined)
    .reduce((obj, key) => {
      obj[key] = payload[key];
      return obj;
    }, {});

  // Nếu không có field nào để update, return ngay
  if (Object.keys(filteredPayload).length === 0) {
    console.log("⚠️ updateAd: Không có field nào để update");
    return null;
  }

  console.log(`🔄 Updating ad ${entityId} với fields:`, Object.keys(filteredPayload));
  const { data } = await axios.post(
    `${FB_API}/${entityId}`,
    filteredPayload,
    { params: buildFbAuthParams(accessToken) }
  );
  return data;
}

/* =========================
 *  FETCH HELPERS (giữ nguyên fields)
 * ========================= */

export async function fetchCampaignsFromFacebook(accessToken, adAccountId) {
  try {
    const { withPrefix } = normalizeAccountPair(adAccountId);
    const url = `${FB_API}/${withPrefix}/campaigns`;
    const response = await axios.get(url, {
      params: {
        fields:
          "id,name,status,objective,special_ad_categories,daily_budget,lifetime_budget,start_time,stop_time,effective_status",
        access_token: accessToken,
        limit: 100,
      },
    });
    return response.data?.data || [];
  } catch (err) {
    console.error(
      `Error fetching campaigns from Facebook for account ${adAccountId}:`,
      err.response?.data || err.message
    );
    return [];
  }
}

export async function fetchAdsetsFromFacebook(accessToken, adAccountId) {
  try {
    const { withPrefix } = normalizeAccountPair(adAccountId);
    const url = `${FB_API}/${withPrefix}/adsets`;
    const response = await axios.get(url, {
      params: {
        fields:
          "id,name,status,campaign_id,daily_budget,lifetime_budget,optimization_goal,targeting,start_time,end_time,effective_status",
        access_token: accessToken,
        limit: 100,
      },
    });
    return response.data?.data || [];
  } catch (err) {
    console.error(
      `Error fetching adsets from Facebook for account ${adAccountId}:`,
      err.response?.data || err.message
    );
    return [];
  }
}

export async function fetchAdsFromFacebook(accessToken, adAccountId) {
  try {
    const { withPrefix } = normalizeAccountPair(adAccountId);
    const url = `${FB_API}/${withPrefix}/ads`;
    const response = await axios.get(url, {
      params: {
        fields: "id,name,status,adset_id,creative,effective_status",
        access_token: accessToken,
        limit: 100,
      },
    });
    return response.data?.data || [];
  } catch (err) {
    console.error(
      `Error fetching ads from Facebook for account ${adAccountId}:`,
      err.response?.data || err.message
    );
    return [];
  }
}

/* =========================
 *  SYNC → DB (đã tối ưu & map đủ _id)
 * ========================= */

/**
 * Đồng bộ Campaigns từ Facebook → DB
 * - Bắt buộc: phải tìm được AdsAccount trong DB (để có account_id + shop_id)
 * - Lưu external_account_id ở dạng "không prefix" để đồng bộ với filter hiện có
 */
export async function syncCampaignsFromFacebook(accessToken, adAccountId) {
  try {
    const campaigns = await fetchCampaignsFromFacebook(
      accessToken,
      adAccountId
    );
    console.log(
      `Fetched ${campaigns.length} campaigns from Facebook for account ${adAccountId}`
    );

    const adsAccount = await findAdsAccountByExternalId(adAccountId);
    if (!adsAccount) {
      console.warn(
        `⚠️ Không tìm thấy AdsAccount trong DB cho ${adAccountId}. Bỏ qua upsert campaigns để tránh ValidationError.`
      );
      return [];
    }

    const { withoutPrefix } = normalizeAccountPair(adAccountId);
    const results = [];

    for (const c of campaigns) {
      try {
        const data = {
          shop_id: adsAccount.shop_id, // required by schema
          account_id: adsAccount._id, // required by schema
          name: c.name,
          status: c.status,
          objective: c.objective,
          external_id: c.id,
          external_account_id: withoutPrefix, // chuẩn với filter hiện có
          effective_status: c.effective_status,
          special_ad_categories: c.special_ad_categories,
          daily_budget: c.daily_budget,
          lifetime_budget: c.lifetime_budget,
          start_time: c.start_time,
          stop_time: c.stop_time,
        };

        const doc = await AdsCampaign.findOneAndUpdate(
          { external_id: c.id },
          { $set: data },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        results.push(doc);
      } catch (err) {
        console.error(`Error upserting campaign ${c.id}:`, err.message);
      }
    }

    return results;
  } catch (err) {
    console.error(
      `Error syncing campaigns for account ${adAccountId}:`,
      err.message
    );
    throw err;
  }
}

/**
 * Đồng bộ AdSets từ Facebook → DB
 * - Map campaign_id (FB) → _id (Mongo)
 * - Nếu chưa có campaign tương ứng → skip để tránh vi phạm required
 */
export async function syncAdSetsFromFacebook(accessToken, adAccountId) {
  try {
    const adsets = await fetchAdsetsFromFacebook(accessToken, adAccountId);
    console.log(
      `Fetched ${adsets.length} adsets from Facebook for account ${adAccountId}`
    );

    const { withoutPrefix } = normalizeAccountPair(adAccountId);
    const results = [];

    for (const s of adsets) {
      try {
        // Map campaign external_id -> _id
        const campaignDoc = await AdsCampaign.findOne({
          external_id: s.campaign_id,
        });
        if (!campaignDoc) {
          console.warn(
            `⚠️ Bỏ qua adset ${s.id} vì chưa tìm thấy campaign external_id=${s.campaign_id} trong DB.`
          );
          continue;
        }

        const data = {
          name: s.name,
          status: s.status,
          external_id: s.id,
          external_account_id: withoutPrefix,
          campaign_id: campaignDoc._id, // required by schema
          effective_status: s.effective_status,
          daily_budget: s.daily_budget,
          lifetime_budget: s.lifetime_budget,
          targeting: s.targeting,
          start_time: s.start_time,
          end_time: s.end_time,
          optimization_goal: s.optimization_goal,
        };

        const doc = await AdsSet.findOneAndUpdate(
          { external_id: s.id },
          { $set: data },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        results.push(doc);
      } catch (err) {
        console.error(`Error upserting adset ${s.id}:`, err.message);
      }
    }

    return results;
  } catch (err) {
    console.error(
      `Error syncing adsets for account ${adAccountId}:`,
      err.message
    );
    throw err;
  }
}

/**
 * Đồng bộ Ads từ Facebook → DB
 * - Map adset_id (FB) → _id (Mongo)
 * - Nếu chưa có adset tương ứng → skip để tránh set_id null
 */
export async function syncAdsFromFacebook(accessToken, adAccountId) {
  try {
    const ads = await fetchAdsFromFacebook(accessToken, adAccountId);
    console.log(
      `Fetched ${ads.length} ads from Facebook for account ${adAccountId}`
    );

    const { withoutPrefix } = normalizeAccountPair(adAccountId);
    const results = [];

    for (const a of ads) {
      try {
        // Map adset external_id -> _id
        const adsetDoc = await AdsSet.findOne({ external_id: a.adset_id });
        if (!adsetDoc) {
          console.warn(
            `⚠️ Bỏ qua ad ${a.id} vì chưa tìm thấy adset external_id=${a.adset_id} trong DB.`
          );
          continue;
        }

        const data = {
          name: a.name,
          status: a.status,
          external_id: a.id,
          external_account_id: withoutPrefix,
          set_id: adsetDoc._id, // liên kết nội bộ
          effective_status: a.effective_status,
          creative: a.creative,
        };

        const doc = await Ads.findOneAndUpdate(
          { external_id: a.id },
          { $set: data },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        results.push(doc);
      } catch (err) {
        console.error(`Error upserting ad ${a.id}:`, err.message);
      }
    }

    return results;
  } catch (err) {
    console.error(`Error syncing ads for account ${adAccountId}:`, err.message);
    throw err;
  }
}

export async function fetchAdInsights(accessToken, adIds = []) {
  if (!adIds.length) return [];

  try {
    const url = `${FB_API}/?ids=${adIds.join(",")}`;
    const fields =
      "insights{impressions,reach,spend,clicks,actions,quality_ranking,engagement_rate_ranking,conversion_rate_ranking}";
    const { data } = await axios.get(url, {
      params: { fields, access_token: accessToken },
    });

    // Flatten lại dữ liệu cho dễ xử lý
    return Object.keys(data).map((id) => ({
      id,
      insights: data[id].insights?.data?.[0] || {},
    }));
  } catch (err) {
    console.error(
      "Error fetching insights:",
      err.response?.data || err.message
    );
    return [];
  }
}

/**
 * Lấy insights cho nhiều thực thể (campaigns, adsets, ads) bằng batch request.
 * @param {string[]} entityIds - Mảng các ID của Facebook.
 * @param {string} accessToken - Access token của người dùng.
 * @returns {Promise<Array<{id: string, insights: object}>>}
 */
export async function fetchInsightsForEntities(entityIds, accessToken) {
  if (!entityIds || entityIds.length === 0) {
    return [];
  }

  const fields = [
    'impressions',
    'reach',
    'spend',
    'clicks',
    'actions',
    'quality_ranking',
  ].join(',');

  // Tạo mảng batch request
  const batch = entityIds.map(id => ({
    method: 'GET',
    relative_url: `${id}/insights?fields=${fields}`
  }));

  try {
    const response = await axios.post(
      `${FB_API}/`, // Sửa FB_GRAPH_API_URL thành FB_API
      {
        batch: JSON.stringify(batch),
        include_headers: false
      },
      {
        params: {
          access_token: accessToken
        }
      }
    );

    // Xử lý kết quả trả về từ batch request
    const results = response.data.map((res, index) => {
      const originalId = entityIds[index];
      if (res.code === 200) {
        const body = JSON.parse(res.body);
        return {
          id: originalId,
          insights: body // body chính là object insights { data: [...] }
        };
      } else {
        console.warn(`Lỗi khi lấy insights cho ID ${originalId}:`, JSON.parse(res.body).error);
        return {
          id: originalId,
          insights: { data: [] } // Trả về rỗng nếu có lỗi
        };
      }
    });

    return results;

  } catch (error) {
    console.error("Lỗi batch insights request từ Facebook:", error.response?.data || error.message);
    throw error; // Ném lỗi để controller xử lý
  }
}

