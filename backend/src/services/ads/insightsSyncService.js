import AdsAccount from "../../models/ads/adsAccount.model.js";
import Ads from "../../models/ads/ads.model.js";
import AdsSet from "../../models/ads/adsSet.model.js";
import AdsCampaign from "../../models/ads/adsCampaign.model.js";
import AdPerformance from "../../models/ads/adPerformance.model.js";
import { fetchLifetimeInsightsForAds, fetchLifetimeInsightsForAdsets, fetchLifetimeInsightsForCampaigns } from "../ads/fbAdsService.js";
import User from "../../models/user/user.model.js";

const BATCH_SIZE = 50;

async function getAccessTokenForAccount(account) {
  if (!account?.shop_admin_id) {
    return null;
  }
  const user = await User.findById(account.shop_admin_id).select("+facebookAccessToken");
  return user?.facebookAccessToken || null;
}
/**
 * Normalize ngày về 00:00:00 Vietnam timezone (GMT+7)
 * Trả về Date object với ngày của Vietnam
 */
function normalizeToVietnamMidnight(date) {
  const d = new Date(date);
  
  // Lấy ngày/tháng/năm theo Vietnam timezone
  const vietnamFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  const vietnamDateStr = vietnamFormatter.format(d); // format: YYYY-MM-DD
  
  // Tạo Date object từ string (sẽ là 00:00:00 UTC)
  const result = new Date(vietnamDateStr + 'T00:00:00.000Z');
  
  console.log(`[normalizeToVietnamMidnight] Input: ${d.toISOString()}, Vietnam date: ${vietnamDateStr}, Output: ${result.toISOString()}`);
  
  return result;
}

/**
 * Updates Ads collection with insights fetched from Facebook
 * @param {Array} insights Flattened insights array
 */
async function updateAdsModelWithInsights(insights) {
  if (!insights || insights.length === 0) return;

  const bulkOps = insights.map((item) => ({
    updateOne: {
      filter: { external_id: item.ad_id },
      update: {
        $set: {
          insights: item,
          updated_at: new Date(),
        },
      },
    },
  }));

  if (bulkOps.length > 0) {
    try {
      const res = await Ads.bulkWrite(bulkOps, { ordered: false });
      console.log(`✅ Updated ${res.modifiedCount} Ads documents with latest insights`);
    } catch (err) {
      console.error("❌ Error updating Ads model with insights:", err.message);
    }
  }
}

/**
 * Fetches and updates AdSets insights (LIFETIME) for the account
 */
async function syncAdSetsInsights(accessToken, accountExternalId) {
  try {
    // Dùng hàm mới lấy lifetime insights (có pagination)
    const insightsData = await fetchLifetimeInsightsForAdsets(accessToken, accountExternalId);
    
    if (insightsData.length === 0) {
      console.log(`⏭️ No adset insights for account ${accountExternalId}`);
      return;
    }
    
    const bulkOps = insightsData
      .filter(item => item.adset_id)
      .map(item => ({
        updateOne: {
          filter: { external_id: item.adset_id },
          update: {
            $set: {
              insights: item,
              updated_at: new Date(),
            }
          }
        }
      }));

    if (bulkOps.length > 0) {
      const res = await AdsSet.bulkWrite(bulkOps, { ordered: false });
      console.log(`✅ Updated ${res.modifiedCount} AdSets with lifetime insights`);
    }

  } catch (err) {
    console.error("❌ Error syncing AdSets insights:", err.message);
  }
}

/**
 * Fetches and updates Campaigns insights (LIFETIME) for the account
 */
async function syncCampaignsInsights(accessToken, accountExternalId) {
  try {
    // Dùng hàm mới lấy lifetime insights (có pagination)
    const insightsData = await fetchLifetimeInsightsForCampaigns(accessToken, accountExternalId);
    
    if (insightsData.length === 0) {
      console.log(`⏭️ No campaign insights for account ${accountExternalId}`);
      return;
    }
    
    const bulkOps = insightsData
      .filter(item => item.campaign_id)
      .map(item => ({
        updateOne: {
          filter: { external_id: item.campaign_id },
          update: {
            $set: {
              insights: item,
              updated_at: new Date(),
            }
          }
        }
      }));

    if (bulkOps.length > 0) {
      const res = await AdsCampaign.bulkWrite(bulkOps, { ordered: false });
      console.log(`✅ Updated ${res.modifiedCount} Campaigns with lifetime insights`);
    }

  } catch (err) {
    console.error("❌ Error syncing Campaigns insights:", err.message);
  }
}


/**
 * Lưu lifetime insights vào AdPerformance cho TẤT CẢ ads trong account.
 * Ads có insights -> lưu số liệu thực.
 * Ads không có insights -> lưu số liệu = 0.
 * Mỗi ngày 1 record cho mỗi ad.
 * 
 * @param {Array} insightsData - Mảng insights từ fetchLifetimeInsightsForAds (có thể rỗng)
 * @param {Object} account - Account document từ MongoDB
 */
async function saveLifetimeInsightsToAdPerformance(insightsData, account) {
  const today = normalizeToVietnamMidnight(new Date());
  const accountId = account._id.toString();
  const externalAccountId = account.external_id.replace('act_', '');

  // 1. Lấy TẤT CẢ ads của account từ DB (không chỉ ads có insights)
  const allAdsInAccount = await Ads.find({
    external_account_id: { $in: [externalAccountId, `act_${externalAccountId}`] }
  }).select('_id external_id set_id campaign_id name');

  if (allAdsInAccount.length === 0) {
    console.log(`[insightsSyncService] ⚠️ No ads found in DB for account ${account.external_id}`);
    return { saved: 0, skipped: 0 };
  }

  console.log(`[insightsSyncService] 💾 Processing ${allAdsInAccount.length} ads for date ${today.toISOString().split('T')[0]}...`);

  // 2. Tạo Map từ insights data để lookup nhanh
  const insightsMap = new Map();
  for (const item of (insightsData || [])) {
    if (item.ad_id) {
      insightsMap.set(item.ad_id, item);
    }
  }
  console.log(`[insightsSyncService] 📊 Insights from FB: ${insightsMap.size}, Ads in DB: ${allAdsInAccount.length}`);

  // 3. Tạo bulkOps cho TẤT CẢ ads
  const bulkOps = [];
  let withInsights = 0;
  let withoutInsights = 0;

  for (const ad of allAdsInAccount) {
    const item = insightsMap.get(ad.external_id) || {}; // Nếu không có insights -> object rỗng

    if (insightsMap.has(ad.external_id)) {
      withInsights++;
    } else {
      withoutInsights++;
    }

    const performanceData = {
      ads_id: ad._id,
      set_id: ad.set_id || null,
      campaign_id: ad.campaign_id || null,
      account_id: accountId,
      external_account_id: externalAccountId,
      external_ad_id: ad.external_id,
      external_adset_id: item.adset_id || null,
      external_campaign_id: item.campaign_id || null,
      date: today,
      
      // Core metrics (default 0 nếu không có insights)
      impressions: Number(item.impressions) || 0,
      reach: Number(item.reach) || 0,
      clicks: Number(item.clicks) || 0,
      spend: Number(item.spend) || 0,
      frequency: Number(item.frequency) || 0,
      
      // Calculated metrics
      cpc: item.cpc !== undefined ? Number(item.cpc) : null,
      cpm: item.cpm !== undefined ? Number(item.cpm) : null,
      ctr: item.ctr !== undefined ? Number(item.ctr) : null,
      
      // Conversions & Results
      conversions: Number(item.conversions) || 0,
      cost_per_conversion: item.cost_per_conversion !== undefined ? Number(item.cost_per_conversion) : null,
      results: Number(item.results) || 0,
      cost_per_result: item.cost_per_result !== undefined ? Number(item.cost_per_result) : null,
      
      // Metadata
      campaign_name: item.campaign_name || null,
      adset_name: item.adset_name || null,
      ad_name: item.ad_name || ad.name || null,
      objective: item.objective || null,
      
      // Link metrics
      link_clicks: Number(item.link_clicks) || 0,
      link_cpc: item.link_cpc !== undefined ? Number(item.link_cpc) : null,
      link_ctr: item.link_ctr !== undefined ? Number(item.link_ctr) : null,
      
      // ROAS
      website_purchase_roas: item.website_purchase_roas !== undefined ? Number(item.website_purchase_roas) : null,
      
      // Additional metrics from actions
      website_purchases: Number(item.website_purchases) || 0,
      leads: Number(item.leads) || 0,
      mobile_app_install: Number(item.mobile_app_install) || 0,
      post_engagement: Number(item.post_engagement) || 0,
      
      // Quality
      quality_ranking: item.quality_ranking || null,
      
      // Total spend
      total_amount_spent: Number(item.spend) || 0,
    };

    bulkOps.push({
      updateOne: {
        filter: { ads_id: ad._id, date: today },
        update: { $set: performanceData },
        upsert: true,
      },
    });
  }

  // 4. Execute bulkWrite
  console.log(`[insightsSyncService] 🔧 DEBUG - bulkOps.length: ${bulkOps.length}`);
  if (bulkOps.length > 0) {
    // Log sample để debug
    console.log(`[insightsSyncService] 🔧 DEBUG - Sample bulkOp filter:`, JSON.stringify(bulkOps[0]?.updateOne?.filter));
    
    try {
      const result = await AdPerformance.bulkWrite(bulkOps, { ordered: false });
      console.log(`✅ [insightsSyncService] BulkWrite result:`, {
        upsertedCount: result.upsertedCount,
        modifiedCount: result.modifiedCount,
        matchedCount: result.matchedCount,
        insertedCount: result.insertedCount
      });
      console.log(`   📊 With insights: ${withInsights}, Without insights (zeroed): ${withoutInsights}`);
    } catch (err) {
      console.error('❌ [insightsSyncService] BulkWrite error:', err.message, err.stack);
    }
  }

  return { saved: bulkOps.length, withInsights, withoutInsights };
}

/**
 * Main function: Sync insights for an account
 * - Lấy LIFETIME insights từ Facebook
 * - Lưu vào AdPerformance với date = today
 */
export async function syncInsightsForAccount(accountId) {
  const account = await AdsAccount.findById(accountId);
  if (!account) {
    throw new Error("AdsAccount not found");
  }

  const accessToken = await getAccessTokenForAccount(account);
  if (!accessToken) {
    throw new Error("Missing Facebook access token for account");
  }

  await AdsAccount.updateOne(
    { _id: account._id },
    {
      $set: {
        "sync_metadata.insights_status": "syncing",
        "sync_metadata.insights_error": null,
      },
    }
  );

  const { withoutPrefix, withPrefix } = (function normalizeAccountPair(accountIdValue) {
    const hasPrefix = String(accountIdValue).startsWith("act_");
    const withPrefixVal = hasPrefix ? String(accountIdValue) : `act_${accountIdValue}`;
    const withoutPrefixVal = hasPrefix ? String(accountIdValue).substring(4) : String(accountIdValue);
    return { withPrefix: withPrefixVal, withoutPrefix: withoutPrefixVal };
  })(account.external_id);

  let hasError = null;

  try {
    console.log(`📊 [syncInsightsForAccount] Fetching lifetime insights for account ${withPrefix}...`);
    const lifetimeInsights = await fetchLifetimeInsightsForAds(accessToken, account.external_id, { time_increment: 1 });

    await saveLifetimeInsightsToAdPerformance(lifetimeInsights, account);
    
    if (lifetimeInsights.length > 0) {
      await updateAdsModelWithInsights(lifetimeInsights);
    }

    await AdsAccount.updateOne(
      { _id: account._id },
      {
        $set: {
          "sync_metadata.insights_status": "done",
          "sync_metadata.insights_last_synced_at": new Date(),
        },
      }
    );
    
  } catch (err) {
    hasError = err;
    console.error(`❌ [syncInsightsForAccount] Error for ${account.external_id}:`, err.message);
    
    await AdsAccount.updateOne(
      { _id: account._id },
      {
        $set: {
          "sync_metadata.insights_status": "failed",
          "sync_metadata.insights_error": err.message || String(err),
        },
      }
    );
  }

  if (hasError) {
    throw hasError;
  }
}