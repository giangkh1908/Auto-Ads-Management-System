import AdsAccount from "../models/ads/adsAccount.model.js";
import Ads from "../models/ads/ads.model.js";
import AdsSet from "../models/ads/adsSet.model.js";
import AdsCampaign from "../models/ads/adsCampaign.model.js";
import AdPerformance from "../models/ads/adPerformance.model.js";
import { fetchLifetimeInsightsForAds, fetchLifetimeInsightsForAdsets, fetchLifetimeInsightsForCampaigns } from "./fbAdsService.js";
import User from "../models/user.model.js";

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
 */
function normalizeToVietnamMidnight(date) {
  const d = new Date(date);
  // Chuyển về Vietnam timezone (+7)
  const vietnamOffset = 7 * 60 * 60 * 1000;
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  const vietnamTime = new Date(utc + vietnamOffset);
  
  // Set về 00:00:00
  vietnamTime.setHours(0, 0, 0, 0);
  
  return vietnamTime;
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
 * Lưu lifetime insights vào AdPerformance.
 * Mỗi ngày 1 record cho mỗi ad, chứa số liệu LIFETIME (tổng tích lũy).
 * 
 * @param {Array} insightsData - Mảng insights từ fetchLifetimeInsightsForAds
 * @param {Object} account - Account document từ MongoDB
 */
async function saveLifetimeInsightsToAdPerformance(insightsData, account) {
  if (!insightsData || insightsData.length === 0) {
    console.log('[insightsSyncService] ⚠️ No insights data to save');
    return { saved: 0, skipped: 0 };
  }

  const today = normalizeToVietnamMidnight(new Date());
  const accountId = account._id.toString();
  const externalAccountId = account.external_id.replace('act_', '');

  console.log(`[insightsSyncService] 💾 Saving ${insightsData.length} lifetime insights for date ${today.toISOString().split('T')[0]}...`);

  // Lấy mapping external_id -> ObjectId cho ads, adsets, campaigns
  const adExternalIds = [...new Set(insightsData.map(item => item.ad_id).filter(Boolean))];
  const adsetExternalIds = [...new Set(insightsData.map(item => item.adset_id).filter(Boolean))];
  const campaignExternalIds = [...new Set(insightsData.map(item => item.campaign_id).filter(Boolean))];

  const [adsDocs, adsetsDocs, campaignsDocs] = await Promise.all([
    Ads.find({ external_id: { $in: adExternalIds } }).select('_id external_id'),
    AdsSet.find({ external_id: { $in: adsetExternalIds } }).select('_id external_id'),
    AdsCampaign.find({ external_id: { $in: campaignExternalIds } }).select('_id external_id'),
  ]);

  const adsMap = new Map(adsDocs.map(ad => [ad.external_id, ad._id]));
  const adsetsMap = new Map(adsetsDocs.map(adset => [adset.external_id, adset._id]));
  const campaignsMap = new Map(campaignsDocs.map(campaign => [campaign.external_id, campaign._id]));

  const bulkOps = [];
  let saved = 0;
  let skipped = 0;

  for (const item of insightsData) {
    const adObjectId = adsMap.get(item.ad_id);
    if (!adObjectId) {
      skipped++;
      continue;
    }

    const performanceData = {
      ads_id: adObjectId,
      set_id: adsetsMap.get(item.adset_id) || null,
      campaign_id: campaignsMap.get(item.campaign_id) || null,
      account_id: accountId,
      external_account_id: externalAccountId,
      external_ad_id: item.ad_id,
      external_adset_id: item.adset_id || null,
      external_campaign_id: item.campaign_id || null,
      date: today,
      
      // Core metrics
      impressions: item.impressions || 0,
      reach: item.reach || 0,
      clicks: item.clicks || 0,
      spend: item.spend || 0,
      frequency: item.frequency || 0,
      
      // Calculated metrics
      cpc: item.cpc,
      cpm: item.cpm,
      ctr: item.ctr,
      
      // Conversions & Results
      conversions: item.conversions || 0,
      cost_per_conversion: item.cost_per_conversion,
      results: item.results || 0,
      cost_per_result: item.cost_per_result,
      
      // Metadata
      campaign_name: item.campaign_name || null,
      adset_name: item.adset_name || null,
      ad_name: item.ad_name || null,
      objective: item.objective || null,
      
      // Link metrics
      link_clicks: item.link_clicks || 0,
      link_cpc: item.link_cpc,
      link_ctr: item.link_ctr,
      
      // ROAS
      website_purchase_roas: item.website_purchase_roas,
      
      // Additional metrics from actions
      website_purchases: item.website_purchases || 0,
      leads: item.leads || 0,
      mobile_app_install: item.mobile_app_install || 0,
      post_engagement: item.post_engagement || 0,
      
      // Quality
      quality_ranking: item.quality_ranking || null,
      
      // Total spend (same as spend for lifetime)
      total_amount_spent: item.spend || 0,
    };

    bulkOps.push({
      updateOne: {
        filter: { ads_id: adObjectId, date: today },
        update: { $set: performanceData },
        upsert: true,
      },
    });
    saved++;
  }

  if (bulkOps.length > 0) {
    try {
      const result = await AdPerformance.bulkWrite(bulkOps, { ordered: false });
      console.log(`✅ [insightsSyncService] Saved ${result.upsertedCount} new, updated ${result.modifiedCount} existing records`);
    } catch (err) {
      console.error('❌ [insightsSyncService] BulkWrite error:', err.message);
    }
  }

  return { saved, skipped };
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

  if (account.sync_metadata?.insights_status === "syncing") {
    const lastSynced = account.sync_metadata?.insights_last_synced_at;
    if (lastSynced && (new Date() - new Date(lastSynced) < 1000 * 60 * 10)) {
       return;
    }
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
    // 1. Sync Campaigns & AdSets Insights (for model updates)
    await Promise.all([
      syncCampaignsInsights(accessToken, account.external_id),
      syncAdSetsInsights(accessToken, account.external_id)
    ]);

    // 2. Fetch LIFETIME insights for all ads in account
    console.log(`📊 [syncInsightsForAccount] Fetching lifetime insights for account ${withPrefix}...`);
    const lifetimeInsights = await fetchLifetimeInsightsForAds(accessToken, account.external_id);

    if (lifetimeInsights.length === 0) {
      console.log(`⏭️ No ads with insights for account ${account.external_id}`);
    } else {
      // 3. Save to AdPerformance (date = today, data = lifetime)
      await saveLifetimeInsightsToAdPerformance(lifetimeInsights, account);
      
      // 4. Update Ads model with latest insights
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
