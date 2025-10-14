// services/adsWizardService.js
import AdsCampaign from "../models/ads/adsCampaign.model.js";
import AdsSet from "../models/ads/adsSet.model.js";
import Ads from "../models/ads/ads.model.js";
import Creative from "../models/ads/creative.model.js";
import {
  createCampaign,
  createAdSet,
  createCreative,
  createAd,
  deleteEntity,
} from "./fbAdsService.js";

/**
 * 🧩 Publish toàn bộ quy trình tạo quảng cáo Wizard
 * (Campaign → Ad Set → Creative → Ad)
 */
export async function publishWizard({
  ad_account_id,
  access_token,
  campaign,
  adset,
  creative,
  ad,
  dry_run = false,
  campaignDraftId,
  adsetDraftId,
  creativeDraftId,
  adDraftId,
}) {
  const steps = [];
  let fbCampaignId, fbAdSetId, fbCreativeId, fbAdId;
  const now = new Date();

  // 🧱 1) Khởi tạo draft (nháp)
  const draftCamp = campaignDraftId
    ? await AdsCampaign.findById(campaignDraftId)
    : await AdsCampaign.create({
        name: campaign?.name,
        status: "IN_PROCESS",
        account_id: campaign?.account_id, // ✅ thêm
        shop_id: campaign?.shop_id, // ✅ thêm
      });

  const draftSet = adsetDraftId
    ? await AdsSet.findById(adsetDraftId)
    : await AdsSet.create({
        campaign_id: draftCamp._id,
        name: adset?.name,
        status: "IN_PROCESS",
      });

  const draftCreative = creativeDraftId
    ? await Creative.findById(creativeDraftId)
    : await Creative.create({
        name: creative?.name,
        external_id: undefined,
        object_story_spec: creative?.object_story_spec,
        page_id: creative?.object_story_spec?.page_id || null,
      });

  const draftAd = adDraftId
    ? await Ads.findById(adDraftId)
    : await Ads.create({
        set_id: draftSet._id,
        name: ad?.name,
        creative_id: draftCreative._id,
        status: "IN_PROCESS",
      });

  try {
    // 🧠 Validate cơ bản
    if (!campaign?.name || !campaign?.objective) {
      throw new Error(
        "Thiếu dữ liệu chiến dịch (campaign.name hoặc objective)."
      );
    }
    if (!adset?.name) {
      throw new Error("Thiếu tên nhóm quảng cáo (adset.name).");
    }
    if (!creative?.object_story_spec) {
      throw new Error("Thiếu nội dung creative.object_story_spec.");
    }

    // 🚀 2) Campaign
    if (dry_run) {
      fbCampaignId = "dry_" + Date.now();
      console.log(`[DRY RUN] Campaign giả: ${campaign.name}`);
    } else {
      fbCampaignId = await createCampaign(ad_account_id, access_token, {
        ...campaign,
        status: campaign?.status || "PAUSED",
        special_ad_categories: campaign?.special_ad_categories || ["NONE"],
      });
      steps.push(async () => deleteEntity(fbCampaignId, access_token));
    }

    await AdsCampaign.findByIdAndUpdate(draftCamp._id, {
      external_id: fbCampaignId,
      status: "PAUSED",
      synced_at: now,
    });

    // 🚀 3) Ad Set
    if (dry_run) {
      fbAdSetId = "dry_" + (Date.now() + 1);
      console.log(`[DRY RUN] AdSet giả: ${adset.name}`);
    } else {
      fbAdSetId = await createAdSet(ad_account_id, access_token, {
        ...adset,
        campaign_id: fbCampaignId,
        status: adset?.status || "PAUSED",
      });
      steps.push(async () => deleteEntity(fbAdSetId, access_token));
    }

    await AdsSet.findByIdAndUpdate(draftSet._id, {
      external_id: fbAdSetId,
      status: "PAUSED",
      synced_at: now,
    });

    // 🚀 4) Creative
    if (dry_run) {
      fbCreativeId = "dry_" + (Date.now() + 2);
      console.log(`[DRY RUN] Creative giả: ${creative.name}`);
    } else {
      fbCreativeId = await createCreative(
        ad_account_id,
        access_token,
        creative
      );
      steps.push(async () => deleteEntity(fbCreativeId, access_token));
    }

    await Creative.findByIdAndUpdate(draftCreative._id, {
      external_id: fbCreativeId,
      synced_at: now,
    });

    // 🚀 5) Ad
    if (dry_run) {
      fbAdId = "dry_" + (Date.now() + 3);
      console.log(`[DRY RUN] Ad giả: ${ad.name}`);
    } else {
      fbAdId = await createAd(ad_account_id, access_token, {
        ...ad,
        adset_id: fbAdSetId,
        creative: { creative_id: fbCreativeId },
        status: ad?.status || "PAUSED",
      });
      steps.push(async () => deleteEntity(fbAdId, access_token));
    }

    await Ads.findByIdAndUpdate(draftAd._id, {
      external_id: fbAdId,
      status: "PAUSED",
      synced_at: now,
    });

    // 🎁 6) Return dữ liệu đầy đủ cho FE
    return {
      success: true,
      message: dry_run
        ? "Dry run thành công (chưa publish thật)"
        : "Publish thành công.",
      campaign: {
        id: fbCampaignId,
        name: campaign.name,
        status: campaign.status || "PAUSED",
        objective: campaign.objective,
        budget: campaign.daily_budget || campaign.lifetime_budget || "0",
        spend: 0,
        impressions: 0,
        reach: 0,
        results: 0,
        quality_ranking: null,
        synced_at: now,
      },
      adset: {
        id: fbAdSetId,
        name: adset.name,
        status: adset.status || "PAUSED",
        budget: adset.daily_budget || adset.lifetime_budget || "0",
        spend: 0,
        impressions: 0,
        reach: 0,
        results: 0,
        quality_ranking: null,
        synced_at: now,
      },
      ad: {
        id: fbAdId,
        name: ad.name,
        status: ad.status || "PAUSED",
        spend: 0,
        impressions: 0,
        reach: 0,
        results: 0,
        quality_ranking: null,
        synced_at: now,
      },
      creative: {
        id: fbCreativeId,
        page_id: creative?.object_story_spec?.page_id || null,
        name: creative?.name,
      },
      drafts: {
        campaign: draftCamp._id,
        adset: draftSet._id,
        creative: draftCreative._id,
        ad: draftAd._id,
      },
    };
  } catch (err) {
    console.error("❌ Wizard Publish Error:", err.message);
    // Rollback Saga
    for (let i = steps.length - 1; i >= 0; i--) {
      try {
        await steps[i]();
      } catch (rollbackErr) {
        console.warn("⚠️ Rollback step failed:", rollbackErr.message);
      }
    }

    // Cập nhật trạng thái draft fail
    const errMeta = { "meta.last_error": err?.message, status: "FAILED" };
    await Promise.all([
      Ads.findByIdAndUpdate(draftAd._id, errMeta),
      AdsSet.findByIdAndUpdate(draftSet._id, errMeta),
      AdsCampaign.findByIdAndUpdate(draftCamp._id, errMeta),
    ]);

    throw err;
  }
}
