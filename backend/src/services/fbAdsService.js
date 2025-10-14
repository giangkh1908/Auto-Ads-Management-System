// services/fbAdsService.js
import axios from "axios";

// MODELS
import AdsAccount from "../models/ads/adsAccount.model.js";
import AdsCampaign from "../models/ads/adsCampaign.model.js";
import AdsSet from "../models/ads/adsSet.model.js";
import Ads from "../models/ads/ads.model.js";

const FB_API = "https://graph.facebook.com/v23.0";

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
  const { data } = await axios.post(
    `${FB_API}/${adAccountId}/campaigns`,
    body,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  return data.id;
}

export async function createAdSet(adAccountId, accessToken, body) {
  const { data } = await axios.post(`${FB_API}/${adAccountId}/adsets`, body, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return data.id;
}

export async function createCreative(adAccountId, accessToken, body) {
  const { data } = await axios.post(
    `${FB_API}/${adAccountId}/adcreatives`,
    body,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  return data.id;
}

export async function createAd(adAccountId, accessToken, body) {
  const { data } = await axios.post(`${FB_API}/${adAccountId}/ads`, body, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return data.id;
}

export async function deleteEntity(entityId, accessToken) {
  await axios
    .delete(`${FB_API}/${entityId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    .catch(() => {});
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
