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

  // 🧱 1️⃣ Tạo hoặc lấy draft
  const draftCamp =
    campaignDraftId && (await AdsCampaign.findById(campaignDraftId))
      ? await AdsCampaign.findById(campaignDraftId)
      : await AdsCampaign.create({
          name: campaign?.name,
          status: "IN_PROCESS",
          account_id: campaign?.account_id,
          shop_id: campaign?.shop_id,
        });

  const draftSet =
    adsetDraftId && (await AdsSet.findById(adsetDraftId))
      ? await AdsSet.findById(adsetDraftId)
      : await AdsSet.create({
          campaign_id: draftCamp._id,
          name: adset?.name,
          status: "IN_PROCESS",
        });

  const draftCreative =
    creativeDraftId && (await Creative.findById(creativeDraftId))
      ? await Creative.findById(creativeDraftId)
      : await Creative.create({
          name: creative?.name,
          object_story_spec: creative?.object_story_spec,
          page_id: creative?.object_story_spec?.page_id || null,
        });

  const draftAd =
    adDraftId && (await Ads.findById(adDraftId))
      ? await Ads.findById(adDraftId)
      : await Ads.create({
          set_id: draftSet._id,
          name: ad?.name,
          creative_id: draftCreative._id,
          status: "IN_PROCESS",
        });

  try {
    // ✅ Validate cơ bản
    if (!campaign?.name || !campaign?.objective)
      throw new Error("Thiếu dữ liệu campaign (name, objective)");
    if (!adset?.name) throw new Error("Thiếu tên nhóm quảng cáo");
    if (!creative?.object_story_spec)
      throw new Error("Thiếu nội dung creative.object_story_spec");

    // 🚀 2️⃣ Campaign
    if (!dry_run) {
      fbCampaignId = await createCampaign(ad_account_id, access_token, {
        ...campaign,
        status: campaign?.status || "PAUSED",
        special_ad_categories: campaign?.special_ad_categories || ["NONE"],
      });
      if (!fbCampaignId)
        throw new Error("Không tạo được Campaign trên Facebook");
      steps.push(async () => deleteEntity(fbCampaignId, access_token));
    } else fbCampaignId = "dry_" + Date.now();

    await AdsCampaign.findByIdAndUpdate(draftCamp._id, {
      external_id: fbCampaignId,
      status: "PAUSED",
      synced_at: now,
    });

    // 🚀 3️⃣ Ad Set
    if (!dry_run) {
      fbAdSetId = await createAdSet(ad_account_id, access_token, {
        ...adset,
        campaign_id: fbCampaignId,
        status: adset?.status || "PAUSED",
        bid_strategy: adset?.bid_strategy || "LOWEST_COST_WITHOUT_CAP",
        bid_amount: adset?.bid_amount || null, // ✅ thêm dòng này
        targeting: {
          ...adset.targeting,
          targeting_automation: {
            advantage_audience:
              adset?.targeting?.targeting_automation?.advantage_audience ?? 0, // ✅ mặc định tắt
          },
        },
      });
      if (!fbAdSetId) throw new Error("Không tạo được AdSet trên Facebook");
      steps.push(async () => deleteEntity(fbAdSetId, access_token));
    } else fbAdSetId = "dry_" + (Date.now() + 1);

    await AdsSet.findByIdAndUpdate(draftSet._id, {
      external_id: fbAdSetId,
      status: "PAUSED",
      synced_at: now,
    });

    // 🚀 4️⃣ Creative
    if (!dry_run) {
      fbCreativeId = await createCreative(
        ad_account_id,
        access_token,
        creative
      );
      if (!fbCreativeId)
        throw new Error("Không nhận được Creative ID từ Facebook");
      steps.push(async () => deleteEntity(fbCreativeId, access_token));
    } else fbCreativeId = "dry_" + (Date.now() + 2);

    await Creative.findByIdAndUpdate(draftCreative._id, {
      external_id: fbCreativeId,
      synced_at: now,
    });

    // 🚀 5️⃣ Ad
    if (!dry_run) {
      fbAdId = await createAd(ad_account_id, access_token, {
        ...ad,
        adset_id: fbAdSetId,
        creative: { creative_id: fbCreativeId },
        status: ad?.status || "PAUSED",
      });
      if (!fbAdId) throw new Error("Không tạo được Ad trên Facebook");
      steps.push(async () => deleteEntity(fbAdId, access_token));
    } else fbAdId = "dry_" + (Date.now() + 3);

    await Ads.findByIdAndUpdate(draftAd._id, {
      external_id: fbAdId,
      status: "PAUSED",
      synced_at: now,
    });

    return {
      success: true,
      message: dry_run
        ? "Dry run thành công (chưa publish thật)"
        : "Publish thành công.",
      campaign: { id: fbCampaignId, name: campaign.name },
      adset: { id: fbAdSetId, name: adset.name },
      creative: { id: fbCreativeId, name: creative?.name },
      ad: { id: fbAdId, name: ad?.name },
      drafts: {
        campaign: draftCamp._id,
        adset: draftSet._id,
        creative: draftCreative._id,
        ad: draftAd._id,
      },
    };
  } catch (err) {
    console.error("❌ Wizard Publish Error:", err.message);
    for (let i = steps.length - 1; i >= 0; i--) {
      try {
        await steps[i]();
      } catch (rollbackErr) {
        console.warn("⚠️ Rollback step failed:", rollbackErr.message);
      }
    }

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
      return;
    }
    try {
      console.log(`🔵 Updating ${type} on Facebook:`, entityId);
      await axios.post(`${FB_API}/${entityId}`, body, {
        headers: { Authorization: `Bearer ${access_token}` },
      });
    } catch (e) {
      console.warn(
        `⚠️ Facebook ${type} update failed:`,
        e.response?.data || e.message
      );
    }
  }

  // ✅ Campaign
  if (campaign) {
    const { external_id, draftId, ...fields } = campaign;
    if (external_id) await fbUpdate(external_id, fields, "campaign");
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
    const { external_id, draftId, ...fields } = adset;
    let fbAdSetId = external_id;

    if (!fbAdSetId) {
      console.log("⚪ AdSet chưa có external_id → tạo mới trên Facebook...");
      try {
        const newAdSet = await createAdSet(ad_account_id, access_token, {
          ...adset,
          campaign_id: campaign?.external_id,
          bid_strategy: adset?.bid_strategy || "LOWEST_COST_WITHOUT_CAP",
          bid_amount: adset?.bid_amount || null,
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

    if (fbAdSetId) {
      try {
        await fbUpdate(fbAdSetId, fields, "adset");
      } catch (err) {
        const msg = err?.response?.data?.error?.error_user_title || "";
        if (msg.includes("đã bị xóa") || msg.includes("deleted")) {
          console.log("⚠️ AdSet bị xóa → tạo mới lại thay thế...");
          const newAdSet = await createAdSet(ad_account_id, access_token, {
            ...adset,
            campaign_id: campaign?.external_id,
          });
          fbAdSetId = newAdSet?.id || newAdSet;
          await AdsSet.findByIdAndUpdate(draftId, { external_id: fbAdSetId });
        } else {
          throw err;
        }
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
