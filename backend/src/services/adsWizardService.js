// services/adsWizardService.js
import AdsCampaign from "../models/ads/adsCampaign.model.js";
import AdsSet from "../models/ads/adsSet.model.js";
import Ads from "../models/ads/ads.model.js";
import Creative from "../models/ads/creative.model.js";
import {
  createCampaign, createAdSet, createCreative, createAd, deleteEntity
} from "./fbAdsService.js";

export async function publishWizard({
  ad_account_id,
  access_token,
  campaign,   // payload cho FB
  adset,      // payload cho FB
  creative,   // payload cho FB
  ad,         // payload cho FB
  // (tuỳ chọn) ids draft có sẵn trong DB để cập nhật lại:
  campaignDraftId, adsetDraftId, creativeDraftId, adDraftId,
}) {
  const steps = [];
  let fbCampaignId, fbAdSetId, fbCreativeId, fbAdId;

  // 1) Nếu chưa có draft, tạo nháp trong DB (IN_PROCESS)
  const draftCamp = campaignDraftId
    ? await AdsCampaign.findById(campaignDraftId)
    : await AdsCampaign.create({ name: campaign?.name, status: "IN_PROCESS" });

  const draftSet = adsetDraftId
    ? await AdsSet.findById(adsetDraftId)
    : await AdsSet.create({ campaign_id: draftCamp._id, name: adset?.name, status: "IN_PROCESS" });

  const draftCreative = creativeDraftId
    ? await Creative.findById(creativeDraftId)
    : await Creative.create({ name: creative?.name, object_story_spec: creative?.object_story_spec });

  const draftAd = adDraftId
    ? await Ads.findById(adDraftId)
    : await Ads.create({ set_id: draftSet._id, name: ad?.name, creative_id: draftCreative._id, status: "IN_PROCESS" });

  try {
    // 2) Campaign
    fbCampaignId = await createCampaign(ad_account_id, access_token, { ...campaign, status: campaign?.status || "PAUSED" });
    await AdsCampaign.findByIdAndUpdate(draftCamp._id, { external_id: fbCampaignId, status: "PAUSED" });
    steps.push(async () => deleteEntity(fbCampaignId, access_token));

    // 3) Ad Set
    fbAdSetId = await createAdSet(ad_account_id, access_token, { ...adset, campaign_id: fbCampaignId, status: adset?.status || "PAUSED" });
    await AdsSet.findByIdAndUpdate(draftSet._id, { external_id: fbAdSetId, status: "PAUSED" });
    steps.push(async () => deleteEntity(fbAdSetId, access_token));

    // 4) Creative
    fbCreativeId = await createCreative(ad_account_id, access_token, creative);
    await Creative.findByIdAndUpdate(draftCreative._id, { external_id: fbCreativeId });
    steps.push(async () => deleteEntity(fbCreativeId, access_token));

    // 5) Ad
    fbAdId = await createAd(ad_account_id, access_token, {
      ...ad,
      adset_id: fbAdSetId,
      creative: { creative_id: fbCreativeId },
      status: ad?.status || "PAUSED",
    });
    await Ads.findByIdAndUpdate(draftAd._id, { external_id: fbAdId, status: "PAUSED" });

    return {
      campaign_id: fbCampaignId,
      adset_id: fbAdSetId,
      creative_id: fbCreativeId,
      ad_id: fbAdId,
      drafts: { campaign: draftCamp._id, adset: draftSet._id, creative: draftCreative._id, ad: draftAd._id },
    };
  } catch (err) {
    // Saga compensation: rollback ngược
    for (let i = steps.length - 1; i >= 0; i--) {
      try { await steps[i](); } catch {}
    }
    // Đánh dấu draft fail (nếu muốn lưu lỗi)
    await Ads.findByIdAndUpdate(draftAd._id, { status: "IN_PROCESS", "meta.last_error": err?.message });
    await AdsSet.findByIdAndUpdate(draftSet._id, { status: "IN_PROCESS", "meta.last_error": err?.message });
    await AdsCampaign.findByIdAndUpdate(draftCamp._id, { status: "IN_PROCESS", "meta.last_error": err?.message });

    throw err;
  }
}
