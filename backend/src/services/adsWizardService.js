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
import logger from "../utils/logger.js";

export async function publishWizard({
  ad_account_id,
  page_id,
  access_token,
  campaign,   // payload cho FB
  adset,      // payload cho FB
  creative,   // payload cho FB
  ad,         // payload cho FB
  // (tuỳ chọn) ids draft có sẵn trong DB để cập nhật lại:
  campaignDraftId, adsetDraftId, creativeDraftId, adDraftId,
}) {
  const steps = [];
  const actionLogs = [];
  let fbCampaignId,
    fbAdSetId,
    fbCreativeId,
    fbAdId;

  // 1) Nếu chưa có draft, tạo nháp trong DB (IN_PROCESS)
  const draftCamp = campaignDraftId
    ? await AdsCampaign.findById(campaignDraftId)
    : await AdsCampaign.create({ name: campaign?.name, status: "IN_PROCESS" });
  actionLogs.push({ step: "create_local_draft_campaign", message: `Draft campaign id ${draftCamp._id}` });
  logger.info("Draft campaign created", { draftCampId: draftCamp._id });

  const draftSet = adsetDraftId
    ? await AdsSet.findById(adsetDraftId)
    : await AdsSet.create({ campaign_id: draftCamp._id, name: adset?.name, status: "IN_PROCESS" });
  actionLogs.push({ step: "create_local_draft_adset", message: `Draft adset id ${draftSet._id}` });
  logger.info("Draft adset created", { draftSetId: draftSet._id });

  const draftCreative = creativeDraftId
    ? await Creative.findById(creativeDraftId)
    : await Creative.create({ name: creative?.name, object_story_spec: creative?.object_story_spec });
  actionLogs.push({ step: "create_local_draft_creative", message: `Draft creative id ${draftCreative._id}` });
  logger.info("Draft creative created", { draftCreativeId: draftCreative._id });

  const draftAd = adDraftId
    ? await Ads.findById(adDraftId)
    : await Ads.create({ set_id: draftSet._id, name: ad?.name, creative_id: draftCreative._id, status: "IN_PROCESS" });
  actionLogs.push({ step: "create_local_draft_ad", message: `Draft ad id ${draftAd._id}` });
  logger.info("Draft ad created", { draftAdId: draftAd._id });

  try {
    // 2) Create campaign on FB
    actionLogs.push({ step: "create_campaign_request", message: `Creating campaign on FB account ${ad_account_id}` });
    logger.info("Publishing campaign to FB", { ad_account_id, campaignName: campaign?.name });
    fbCampaignId = await createCampaign(ad_account_id, access_token, { ...campaign, status: campaign?.status || "PAUSED" });
    actionLogs.push({ step: "create_campaign_result", message: `Created campaign ${fbCampaignId}` });
    await AdsCampaign.findByIdAndUpdate(draftCamp._id, { external_id: fbCampaignId, status: "PAUSED" });
    steps.push(async () => deleteEntity(fbCampaignId, access_token));

    // 3) Create adset on FB
    actionLogs.push({ step: "create_adset_request", message: `Creating adset on FB account ${ad_account_id} for campaign ${fbCampaignId}` });
    fbAdSetId = await createAdSet(ad_account_id, access_token, { ...adset, campaign_id: fbCampaignId, status: adset?.status || "PAUSED" });
    actionLogs.push({ step: "create_adset_result", message: `Created adset ${fbAdSetId}` });
    await AdsSet.findByIdAndUpdate(draftSet._id, { external_id: fbAdSetId, status: "PAUSED" });
    steps.push(async () => deleteEntity(fbAdSetId, access_token));

    // 4) Create creative on FB
    actionLogs.push({ step: "create_creative_request", message: `Creating creative on FB account ${ad_account_id}` });
    // Ensure object_story_spec contains page_id when creating creative
    const creativePayload = { ...creative };
    if (creativePayload && creativePayload.object_story_spec) {
      creativePayload.object_story_spec = { ...creativePayload.object_story_spec };
      if (!creativePayload.object_story_spec.page_id && page_id) {
        creativePayload.object_story_spec.page_id = page_id;
      }
    } else if (page_id) {
      creativePayload.object_story_spec = { page_id };
    }

    fbCreativeId = await createCreative(ad_account_id, access_token, creativePayload);
    actionLogs.push({ step: "create_creative_result", message: `Created creative ${fbCreativeId}` });
    await Creative.findByIdAndUpdate(draftCreative._id, { external_id: fbCreativeId });
    steps.push(async () => deleteEntity(fbCreativeId, access_token));

    // 5) Create ad on FB
    actionLogs.push({ step: "create_ad_request", message: `Creating ad on FB account ${ad_account_id}` });
    fbAdId = await createAd(ad_account_id, access_token, {
      ...ad,
      adset_id: fbAdSetId,
      creative: { creative_id: fbCreativeId },
      status: ad?.status || "PAUSED",
    });
    actionLogs.push({ step: "create_ad_result", message: `Created ad ${fbAdId}` });
    await Ads.findByIdAndUpdate(draftAd._id, { external_id: fbAdId, status: "PAUSED" });

    const result = {
      campaign_id: fbCampaignId,
      adset_id: fbAdSetId,
      creative_id: fbCreativeId,
      ad_id: fbAdId,
      drafts: { campaign: draftCamp._id, adset: draftSet._id, creative: draftCreative._id, ad: draftAd._id },
      logs: actionLogs,
    };

    logger.info("Publish wizard finished successfully", { result });
    return result;
  } catch (err) {
    // rollback created FB entities in reverse order
    for (let i = steps.length - 1; i >= 0; i--) {
      try {
        await steps[i]();
      } catch (e) {
        logger.warn("Saga compensation failed", { error: e?.message });
      }
    }

    // mark drafts as failed/in-process and store error
    try {
      await Ads.findByIdAndUpdate(draftAd._id, { status: "IN_PROCESS", "meta.last_error": err?.message });
      await AdsSet.findByIdAndUpdate(draftSet._id, { status: "IN_PROCESS", "meta.last_error": err?.message });
      await AdsCampaign.findByIdAndUpdate(draftCamp._id, { status: "IN_PROCESS", "meta.last_error": err?.message });
    } catch (e) {
      logger.warn("Failed to mark drafts after publish error", { error: e?.message });
    }

    err.logs = actionLogs;
    logger.error("Publish wizard failed", { error: err.response?.data || err.message, logs: actionLogs });
    throw err;
  }
}
