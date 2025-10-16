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
import axios from "axios";
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

  // 🧱 1) Khởi tạo draft (nháp) với đầy đủ thông tin
  const draftCamp = campaignDraftId
    ? await AdsCampaign.findById(campaignDraftId)
    : await AdsCampaign.create({
        name: campaign?.name,
        objective: campaign?.objective,
        status: "IN_PROCESS",
        account_id: campaign?.account_id,
        shop_id: campaign?.shop_id,
        page_id: campaign?.page_id,
        page_name: campaign?.page_name,
        daily_budget: campaign?.daily_budget,
        lifetime_budget: campaign?.lifetime_budget,
        start_time: campaign?.start_time,
        stop_time: campaign?.stop_time,
        created_by: campaign?.created_by,
      });

  const draftSet = adsetDraftId
    ? await AdsSet.findById(adsetDraftId)
    : await AdsSet.create({
        campaign_id: draftCamp._id,
        name: adset?.name,
        status: "IN_PROCESS",
        optimization_goal: adset?.optimization_goal,
        billing_event: adset?.billing_event,
        bid_strategy: adset?.bid_strategy,
        bid_amount: adset?.bid_amount,
        targeting: adset?.targeting,
        daily_budget: adset?.daily_budget,
        lifetime_budget: adset?.lifetime_budget,
        start_time: adset?.start_time,
        end_time: adset?.end_time,
      });

  const draftCreative = creativeDraftId
    ? await Creative.findById(creativeDraftId)
    : await Creative.create({
        name: creative?.name,
        title: creative?.object_story_spec?.link_data?.name,
        body: creative?.object_story_spec?.link_data?.message,
        creative_type: "LINK",
        page_id: creative?.object_story_spec?.page_id || null,
        object_story_spec: creative?.object_story_spec,
        cta: creative?.object_story_spec?.link_data?.call_to_action?.type,
        created_by: creative?.created_by,
      });

  const draftAd = adDraftId
    ? await Ads.findById(adDraftId)
    : await Ads.create({
        set_id: draftSet._id,
        account_id: campaign?.account_id,
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
    if (!ad?.name) {
      throw new Error("Thiếu tên quảng cáo (ad.name).");
    }
    if (!ad_account_id) {
      throw new Error("Thiếu ad_account_id.");
    }
    if (!access_token) {
      throw new Error("Thiếu access_token.");
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

    // Lưu Campaign vào database
    console.log(`💾 Lưu Campaign vào database: ${draftCamp._id} -> ${fbCampaignId}`);
    await AdsCampaign.findByIdAndUpdate(draftCamp._id, {
      external_id: fbCampaignId,
      external_account_id: ad_account_id,
      status: "PAUSED",
      synced_at: now,
      updated_at: now,
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
        bid_strategy: adset?.bid_strategy || "LOWEST_COST_WITH_BID_CAP",
        bid_amount: adset?.bid_amount || 1000,
        billing_event: adset?.billing_event || "IMPRESSIONS", // Thêm billing_event bắt buộc
      });
      steps.push(async () => deleteEntity(fbAdSetId, access_token));
    }

    // Lưu AdSet vào database
    console.log(`💾 Lưu AdSet vào database: ${draftSet._id} -> ${fbAdSetId}`);
    await AdsSet.findByIdAndUpdate(draftSet._id, {
      external_id: fbAdSetId,
      external_account_id: ad_account_id,
      status: "PAUSED",
      synced_at: now,
      updated_at: now,
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

    // Lưu Creative vào database
    console.log(`💾 Lưu Creative vào database: ${draftCreative._id} -> ${fbCreativeId}`);
    await Creative.findByIdAndUpdate(draftCreative._id, {
      external_id: fbCreativeId,
      synced_at: now,
      updated_at: now,
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

    // Lưu Ad vào database
    console.log(`💾 Lưu Ad vào database: ${draftAd._id} -> ${fbAdId}`);
    await Ads.findByIdAndUpdate(draftAd._id, {
      external_id: fbAdId,
      external_account_id: ad_account_id,
      status: "PAUSED",
      synced_at: now,
      updated_at: now,
    });

    // 🎁 6) Return dữ liệu đầy đủ cho FE
    console.log(`✅ Hoàn thành lưu tất cả quảng cáo vào database: Campaign(${fbCampaignId}), AdSet(${fbAdSetId}), Creative(${fbCreativeId}), Ad(${fbAdId})`);
    return {
      success: true,
      message: dry_run
        ? "Dry run thành công (chưa publish thật)"
        : "Publish thành công và đã lưu vào database.",
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

/**
 * 🧠 Update wizard (Campaign → AdSet → Creative → Ad)
 */
export async function updateWizard({
  ad_account_id,
  access_token,
  campaign,
  adset,
  creative,
  ad,
  dry_run = false,
}) {
  const FB_API = "https://graph.facebook.com/v23.0";
  const now = new Date();
  const result = {};

  async function fbUpdate(entityId, body, type) {
    if (!entityId || dry_run) {
      console.log(`⚪ Skip ${type} update (no external_id or dry_run)`);
      return false;
    }
    try {
      console.log(`🔵 Updating ${type} on Facebook:`, entityId);
      await axios.post(`${FB_API}/${entityId}`, body, {
        params: { access_token },
      });
      return true;
    } catch (e) {
      console.warn(
        `⚠️ Facebook ${type} update failed:`,
        e.response?.data || e.message
      );
      return false;
    }
  }

  // ✅ Campaign
  if (campaign) {
    const { external_id, draftId, ...rawFields } = campaign;
    // Whitelist updateable fields for Campaign
    const fields = {
      ...(rawFields?.name ? { name: rawFields.name } : {}),
      ...(rawFields?.status ? { status: rawFields.status } : {}),
    };
    if (external_id && Object.keys(fields).length > 0) {
      await fbUpdate(external_id, fields, "campaign");
    }
    const updated =
      (draftId &&
        (await AdsCampaign.findByIdAndUpdate(
          draftId,
          { ...fields, updated_at: now },
          { new: true }
        ))) ||
      (await AdsCampaign.findOneAndUpdate(
        { external_id },
        { ...fields, updated_at: now },
        { new: true }
      ));
    result.campaign = updated;
  }

  // ✅ AdSet
  if (adset) {
    const { external_id, draftId, ...rawFields } = adset;
    // Whitelist updateable fields for AdSet
    const fields = {
      ...(rawFields?.name ? { name: rawFields.name } : {}),
      ...(rawFields?.status ? { status: rawFields.status } : {}),
      ...(rawFields?.daily_budget ? { daily_budget: rawFields.daily_budget } : {}),
      ...(rawFields?.lifetime_budget ? { lifetime_budget: rawFields.lifetime_budget } : {}),
      ...(rawFields?.start_time ? { start_time: rawFields.start_time } : {}),
      ...(rawFields?.end_time ? { end_time: rawFields.end_time } : {}),
      ...(rawFields?.targeting ? { targeting: rawFields.targeting } : {}),
      ...(rawFields?.optimization_goal ? { optimization_goal: rawFields.optimization_goal } : {}),
      ...(rawFields?.billing_event ? { billing_event: rawFields.billing_event } : {}),
      ...(rawFields?.bid_strategy ? { bid_strategy: rawFields.bid_strategy } : {}),
      ...(rawFields?.bid_amount ? { bid_amount: rawFields.bid_amount } : {}),
    };
    let fbAdSetId = external_id;

    if (!fbAdSetId) {
      console.log("⚪ AdSet chưa có external_id → tạo mới trên Facebook...");
      try {
        const newAdSet = await createAdSet(ad_account_id, access_token, {
          ...adset,
          campaign_id: campaign?.external_id,
          bid_strategy: adset?.bid_strategy || "LOWEST_COST_WITH_BID_CAP",
          bid_amount: adset?.bid_amount || 1000,
          billing_event: adset?.billing_event || "IMPRESSIONS", // Thêm billing_event bắt buộc
        });
        fbAdSetId = newAdSet?.id || newAdSet;
        if (fbAdSetId)
          await AdsSet.findByIdAndUpdate(draftId, { external_id: fbAdSetId });
      } catch (err) {
        console.error(
          "❌ Không thể tạo lại AdSet:",
          err.response?.data || err.message
        );
      }
    }

    if (fbAdSetId && Object.keys(fields).length > 0) {
      const ok = await fbUpdate(fbAdSetId, fields, "adset");
      if (!ok) {
        console.log("⚠️ Update adset thất bại → thử tạo mới lại...");
        const newAdSet = await createAdSet(ad_account_id, access_token, {
          ...adset,
          campaign_id: campaign?.external_id,
          bid_strategy: adset?.bid_strategy || "LOWEST_COST_WITH_BID_CAP",
          bid_amount: adset?.bid_amount || 1000,
          billing_event: adset?.billing_event || "IMPRESSIONS",
        });
        fbAdSetId = newAdSet?.id || newAdSet;
        await AdsSet.findByIdAndUpdate(draftId, { external_id: fbAdSetId });
      }
    }

    const updated =
      (draftId &&
        (await AdsSet.findByIdAndUpdate(
          draftId,
          { ...fields, updated_at: now, external_id: fbAdSetId },
          { new: true }
        ))) ||
      (await AdsSet.findOneAndUpdate(
        { external_id: fbAdSetId },
        { ...fields, updated_at: now },
        { new: true }
      )) ||
      (await AdsSet.findOneAndUpdate(
        { campaign_id: campaign?.draftId || campaign?._id },
        { ...fields, updated_at: now },
        { new: true }
      ));
    result.adset = updated;
  }

  // ✅ Creative
  if (creative) {
    const { external_id, draftId, ...fields } = creative;
    let fbCreativeId = external_id;

    if (!fbCreativeId) {
      console.log(
        "⚪ Creative chưa có external_id → tạo mới lại trên Facebook..."
      );
      try {
        const newCreative = await createCreative(ad_account_id, access_token, {
          ...creative,
          name: `${creative.name || "Creative"}_${Date.now()}`, // ✅ đảm bảo unique
        });
        fbCreativeId = newCreative?.id || newCreative;
        if (fbCreativeId)
          await Creative.findByIdAndUpdate(draftId, {
            external_id: fbCreativeId,
          });
      } catch (err) {
        console.error(
          "❌ Không thể tạo lại creative:",
          err.response?.data || err.message
        );
      }
    }

    if (fbCreativeId) await fbUpdate(fbCreativeId, fields, "creative");

    const updated =
      (draftId &&
        (await Creative.findByIdAndUpdate(
          draftId,
          { ...fields, updated_at: now, external_id: fbCreativeId },
          { new: true }
        ))) ||
      (await Creative.findOneAndUpdate(
        { external_id: fbCreativeId },
        { ...fields, updated_at: now },
        { new: true }
      ));
    result.creative = updated;
  }

  // ✅ Ad
  if (ad) {
    const { external_id, draftId, ...fields } = ad;
    let fbAdId = external_id;

    if (!fbAdId && adset?.external_id && creative?.external_id) {
      console.log("⚪ Ad chưa có external_id → tạo mới trên Facebook...");
      try {
        const newAd = await createAd(ad_account_id, access_token, {
          ...ad,
          name: ad.name || "Quảng cáo mới",
          adset_id: adset.external_id,
          creative: { creative_id: creative.external_id },
          status: ad?.status || "PAUSED",
        });
        fbAdId = newAd?.id || newAd;
        if (fbAdId)
          await Ads.findByIdAndUpdate(draftId, { external_id: fbAdId });
      } catch (err) {
        console.error(
          "❌ Không thể tạo lại Ad:",
          err.response?.data || err.message
        );
      }
    }

    if (fbAdId) await fbUpdate(fbAdId, fields, "ad");

    const updated =
      (draftId &&
        (await Ads.findByIdAndUpdate(
          draftId,
          { ...fields, updated_at: now, external_id: fbAdId },
          { new: true }
        ))) ||
      (await Ads.findOneAndUpdate(
        { external_id: fbAdId },
        { ...fields, updated_at: now },
        { new: true }
      )) ||
      (await Ads.findOneAndUpdate(
        { set_id: adset?.draftId || adset?._id },
        { ...fields, updated_at: now },
        { new: true }
      ));
    result.ad = updated;
  }

  return result;
}
