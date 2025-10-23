import { useState } from "react";
import { useToast } from "./useToast";
import {
  publishAdsWizard,
  updateAdsWizard,
} from "../services/adsWizardService";
import { buildPayload } from "../utils/wizardUtils";
import {
  FB_OBJECTIVE_MAP,
  FB_ADSET_DEFAULTS_BY_OBJECTIVE,
} from "../constants/wizardConstants";
import axiosInstance from "../utils/axios";

/**
 * Custom hook để xử lý logic publish/update quảng cáo
 */
export function useWizardPublish() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const toast = useToast();

  // const handlePublish = async ({
  //   campaign,
  //   adset,
  //   ad,
  //   selectedAccountId,
  //   editingItem,
  //   mode,
  //   onSuccess,
  //   onClose,
  // }) => {
  //   setLoading(true);
  //   setError(null);
  //   setSuccess(false);

  //   try {
  //     const payload = buildPayload({
  //       campaign,
  //       adset,
  //       ad,
  //       selectedAccountId,
  //       editingItem,
  //       fbObjectiveMap: FB_OBJECTIVE_MAP,
  //       fbAdsetDefaultsByObjective: FB_ADSET_DEFAULTS_BY_OBJECTIVE,
  //     });

  //     // Validate ad_account_id
  //     if (!payload.ad_account_id) {
  //       throw new Error("Thiếu ad_account_id hoặc access_token.");
  //     }

  //     if (mode === "edit") {
  //       await updateAdsWizard(payload);
  //     } else {
  //       await publishAdsWizard(payload);
  //     }

  //     setSuccess(true);

  //     // Show success toast
  //     if (mode === "edit") {
  //       toast.success("Cập nhật quảng cáo thành công!");
  //     } else {
  //       toast.success("Tạo quảng cáo thành công!");
  //     }

  //     setTimeout(() => {
  //       setLoading(false);
  //       onSuccess?.();
  //       onClose?.();
  //     }, 1200);
  //   } catch (err) {
  //     console.error("❌ Lỗi khi xử lý quảng cáo:", err);
  //     setLoading(false);

  //     // Chỉ hiển thị thông điệp lỗi từ Facebook (error_user_msg)
  //     const data = err?.response?.data || {};
  //     const fbMsg = data.error_user_msg || null;
  //     setError(fbMsg || null);
  //     if (fbMsg) {
  //       toast.error(mode === "edit" ? "Cập nhật quảng cáo thất bại" : "Tạo quảng cáo thất bại", {
  //         description: fbMsg,
  //       });
  //     }
  //   }
  // };

  // Sequential Publish Logic - Xử lý từng campaign một cách tuần tự
  const handleSmartPublish = async ({
    campaignsList,
    selectedAccountId,
    mode,
    onSuccess,
    onClose,
  }) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      console.log("📝 Using Sequential API for all campaigns");

      let totalSuccessCount = 0;
      let totalAds = 0;

      // Đếm tổng số ads trong tất cả campaigns
      campaignsList.forEach((campaign) => {
        campaign.adsets.forEach((adset) => {
          totalAds += adset.ads.length;
        });
      });

      // Xử lý từng campaign
      for (
        let campaignIndex = 0;
        campaignIndex < campaignsList.length;
        campaignIndex++
      ) {
        const campaign = campaignsList[campaignIndex];

        // Xử lý từng adset và ads trong campaign
        for (
          let adsetIndex = 0;
          adsetIndex < campaign.adsets.length;
          adsetIndex++
        ) {
          const adset = campaign.adsets[adsetIndex];

          for (let adIndex = 0; adIndex < adset.ads.length; adIndex++) {
            const ad = adset.ads[adIndex];

            const payload = buildPayload({
              campaign,
              adset,
              ad,
              selectedAccountId,
              editingItem: null,
              fbObjectiveMap: FB_OBJECTIVE_MAP,
              fbAdsetDefaultsByObjective: FB_ADSET_DEFAULTS_BY_OBJECTIVE,
            });

            if (mode === "edit") {
              await updateAdsWizard(payload);
            } else {
              await publishAdsWizard(payload);
            }

            totalSuccessCount++;
          }
        }
      }

      toast.success(
        `Tạo thành công ${totalSuccessCount}/${totalAds} quảng cáo trong ${campaignsList.length} chiến dịch!`
      );

      setSuccess(true);
      setTimeout(() => {
        setLoading(false);
        onSuccess?.();
        onClose?.();
      }, 1200);
    } catch (err) {
      console.error("Lỗi khi xử lý quảng cáo:", err);
      setLoading(false);

      const data = err?.response?.data || {};
      const fbMsg = data.error_user_msg || null;
      setError(fbMsg || null);

      if (fbMsg) {
        toast.error(mode === "edit" ? "Cập nhật thất bại" : "Đăng thất bại", {
          description: fbMsg,
        });
      }
    }
  };

  return {
    loading,
    error,
    success,
    handleSmartPublish, // FUNCTION MỚI
  };
}

/**
 * 🎯 NEW FLEXIBLE PUBLISH LOGIC
 * Hỗ trợ tất cả mô hình: 1-1-1, 1-nhiều-nhiều, nhiều-nhiều-nhiều
 */
export function useFlexibleWizardPublish() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const toast = useToast();

  /**
   * Publish toàn bộ cấu trúc linh hoạt
   * Sử dụng API mới: /api/ads-wizard/publish-flexible
   */
  const handleFlexiblePublish = async ({
    campaignsList,
    selectedAccountId,
    onSuccess,
    onClose,
  }) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      console.log("🚀 Using Flexible API for all campaigns");

      // Log campaign structure BEFORE building payload
      console.log(
        "📊 Campaign Structure BEFORE building payload:",
        campaignsList.map((campaign) => ({
          name: campaign.name,
          adsets: campaign.adsets.map((adset) => ({
            name: adset.name,
            _id: adset._id,
            ads_count: adset.ads.length,
            ads: adset.ads.map((ad) => ({
              name: ad.name,
              adset_id: ad.adset_id,
              match: ad.adset_id === adset._id ? "✅" : "❌",
            })),
          })),
        }))
      );

      // Chuẩn bị dữ liệu cho API
      const payload = {
        ad_account_id: selectedAccountId,
        campaignsList: campaignsList.map((campaign) => ({
          ...buildCampaignPayload(campaign, selectedAccountId),
          adsets: campaign.adsets.map((adset) => {
            console.log(
              `🔍 Processing adset: ${adset.name}, _id: ${adset._id}`
            );

            const filteredAds = adset.ads.filter((ad) => {
              const match = ad.adset_id === adset._id;
              console.log(
                `  Ad: ${ad.name}, adset_id: ${ad.adset_id}, match: ${match}`
              );
              return match;
            });

            console.log(`  ✅ Filtered ads count: ${filteredAds.length}`);

            return {
              ...buildAdsetPayload(adset, campaign),
              ads: filteredAds.map((ad) => ({
                ...buildAdPayload(ad),
                creative: buildCreativePayload(ad, campaign),
              })),
            };
          }),
        })),
        dry_run: false,
      };

      // Gọi API mới
      const response = await axiosInstance.post(
        "/api/ads-wizard/publish-flexible",
        payload,
        {
          timeout: 120000, // 120 giây = 2 phút (đủ cho tạo nhiều ads)
        }
      );

      if (response.data.success) {
        const { totalSuccess, totalErrors, errors } = response.data.data;

        if (totalErrors === 0) {
          toast.success(
            `Tạo thành công ${totalSuccess} quảng cáo trong ${campaignsList.length} chiến dịch!`
          );
        } else {
          toast.warning(
            `Tạo thành công ${totalSuccess}/${
              totalSuccess + totalErrors
            } quảng cáo. Có ${totalErrors} lỗi.`
          );
          console.warn("Một số quảng cáo tạo thất bại:", errors);
        }

        setSuccess(true);
        setTimeout(() => {
          setLoading(false);
          onSuccess?.(response.data.data);
          onClose?.();
        }, 1200);
      } else {
        throw new Error(response.data.message || "Tạo quảng cáo thất bại");
      }
    } catch (err) {
      console.error("❌ Lỗi khi xử lý quảng cáo:", err);
      setLoading(false);

      const data = err?.response?.data || {};
      const fbMsg = data.error_user_msg || data.message || null;
      setError(fbMsg || null);

      if (fbMsg) {
        toast.error("Tạo quảng cáo thất bại", {
          description: fbMsg,
        });
      }
    }
  };

  /**
   * 🎯 Publish từng bước riêng biệt (cho các trường hợp đặc biệt)
   */
  const handleStepByStepPublish = async ({
    campaignsList,
    selectedAccountId,
    onSuccess,
    onClose,
  }) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      console.log("🎯 Using Step-by-Step API for all campaigns");

      let totalSuccessCount = 0;
      const results = {
        campaigns: [],
        adsets: [],
        ads: [],
      };

      // Xử lý từng campaign
      for (
        let campaignIndex = 0;
        campaignIndex < campaignsList.length;
        campaignIndex++
      ) {
        const campaign = campaignsList[campaignIndex];

        // ✅ Bước 1: Tạo Campaign
        const campaignPayload = {
          ad_account_id: selectedAccountId,
          campaign: buildCampaignPayload(campaign, selectedAccountId),
          dry_run: false,
        };

        const campaignResponse = await axiosInstance.post(
          "/api/ads-wizard/publish-campaign",
          campaignPayload
        );
        const campaignResult = campaignResponse.data.data;
        results.campaigns.push(campaignResult);

        // ✅ Bước 2: Tạo AdSets cho Campaign này
        for (
          let adsetIndex = 0;
          adsetIndex < campaign.adsets.length;
          adsetIndex++
        ) {
          const adset = campaign.adsets[adsetIndex];

          const adsetPayload = {
            ad_account_id: selectedAccountId,
            campaignId: campaignResult.campaignId,
            adset: buildAdsetPayload(adset, campaign),
            dry_run: false,
          };

          const adsetResponse = await axiosInstance.post(
            "/api/ads-wizard/publish-adset",
            adsetPayload
          );
          const adsetResult = adsetResponse.data.data;
          results.adsets.push(adsetResult);

          // ✅ Bước 3: Tạo Ads cho AdSet này
          for (let adIndex = 0; adIndex < adset.ads.length; adIndex++) {
            const ad = adset.ads[adIndex];

            const adPayload = {
              ad_account_id: selectedAccountId,
              adsetId: adsetResult.adsetId,
              creative: buildCreativePayload(ad, campaign),
              ad: buildAdPayload(ad),
              dry_run: false,
            };

            const adResponse = await axiosInstance.post(
              "/api/ads-wizard/publish-ad",
              adPayload
            );
            const adResult = adResponse.data.data;
            results.ads.push(adResult);
            totalSuccessCount++;
          }
        }
      }

      toast.success(
        `Tạo thành công ${totalSuccessCount} quảng cáo trong ${campaignsList.length} chiến dịch!`
      );
      setSuccess(true);

      setTimeout(() => {
        setLoading(false);
        onSuccess?.(results);
        onClose?.();
      }, 1200);
    } catch (err) {
      console.error("❌ Lỗi khi xử lý quảng cáo:", err);
      setLoading(false);

      const data = err?.response?.data || {};
      const fbMsg = data.error_user_msg || data.message || null;
      setError(fbMsg || null);

      if (fbMsg) {
        toast.error("Tạo quảng cáo thất bại", {
          description: fbMsg,
        });
      }
    }
  };

  /**
   * 🔄 Update toàn bộ cấu trúc linh hoạt (cascade update)
   * Hỗ trợ update matching entities, tạo mới nếu chưa có
   */
  const handleFlexibleUpdate = async ({
    campaignsList,
    selectedAccountId,
    onSuccess,
    onClose,
  }) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      console.log("🔄 Using Flexible Update API for all campaigns");

      // Log campaign structure BEFORE building payload
      console.log(
        "📊 Campaign Structure BEFORE update:",
        campaignsList.map((campaign) => ({
          name: campaign.name,
          _id: campaign._id,
          external_id: campaign.external_id,
          adsets: campaign.adsets?.map((adset) => ({
            name: adset.name,
            _id: adset._id,
            external_id: adset.external_id,
            ads_count: adset.ads?.length || 0,
            ads: adset.ads?.map((ad) => ({
              name: ad.name,
              _id: ad._id,
              external_id: ad.external_id,
              adset_id: ad.adset_id,
              match: ad.adset_id === adset._id ? "✅" : "❌",
            })),
          })),
        }))
      );

      // Chuẩn bị dữ liệu cho API
      const payload = {
        ad_account_id: selectedAccountId,
        campaignsList: campaignsList.map((campaign) => ({
          _id: campaign._id, // MongoDB _id để update
          external_id: campaign.external_id, // Facebook ID để update
          draftId: campaign.draftId,
          ...buildCampaignPayload(campaign, selectedAccountId),
          adsets: (campaign.adsets || []).map((adset) => {
            console.log(
              `🔍 Processing adset for update: ${adset.name}, _id: ${adset._id}, external_id: ${adset.external_id}`
            );

            const filteredAds = (adset.ads || []).filter((ad) => {
              const match = ad.adset_id === adset._id;
              console.log(
                `  Ad: ${ad.name}, adset_id: ${ad.adset_id}, match: ${match}`
              );
              return match;
            });

            console.log(`  ✅ Filtered ads count: ${filteredAds.length}`);

            return {
              _id: adset._id,
              external_id: adset.external_id,
              draftId: adset.draftId,
              ...buildAdsetPayload(adset, campaign),
              ads: filteredAds.map((ad) => ({
                _id: ad._id,
                external_id: ad.external_id,
                draftId: ad.draftId,
                ...buildAdPayload(ad),
                creative: buildCreativePayload(ad, campaign),
              })),
            };
          }),
        })),
      };

      // Gọi API update
      const response = await axiosInstance.put(
        "/api/ads-wizard/update-flexible",
        payload,
        {
          timeout: 120000, // 120 giây = 2 phút
        }
      );

      if (response.data.success) {
        const { totalUpdated, totalCreated, totalErrors, errors, details } = response.data.data;

        if (totalErrors === 0) {
          toast.success(
            `Cập nhật thành công ${details.updated.campaigns.length + details.updated.adsets.length + details.updated.ads.length} entities, tạo mới ${details.created.campaigns.length + details.created.adsets.length + details.created.ads.length} entities!`
          );
        } else {
          toast.warning(
            `Cập nhật ${totalUpdated} entities, tạo mới ${totalCreated} entities. Có ${totalErrors} lỗi.`
          );
          console.warn("Một số cập nhật thất bại:", errors);
        }

        setSuccess(true);
        setTimeout(() => {
          setLoading(false);
          onSuccess?.(response.data.data);
          onClose?.();
        }, 1200);
      } else {
        throw new Error(response.data.message || "Cập nhật thất bại");
      }
    } catch (err) {
      console.error("❌ Lỗi khi cập nhật quảng cáo:", err);
      setLoading(false);

      const data = err?.response?.data || {};
      const fbMsg = data.error_user_msg || data.message || null;
      setError(fbMsg || null);

      if (fbMsg) {
        toast.error("Cập nhật thất bại", {
          description: fbMsg,
        });
      }
    }
  };

  return {
    loading,
    error,
    success,
    handleFlexiblePublish, // API mới - nhanh hơn
    handleFlexibleUpdate, // API update - cascade update
    handleStepByStepPublish, // API từng bước - chi tiết hơn
  };
}

// ========================================
// 🛠️ HELPER FUNCTIONS FOR PAYLOAD BUILDING
// ========================================

/**
 * Xây dựng payload cho Campaign
 */
function buildCampaignPayload(campaign) {
  const fbObjective =
    FB_OBJECTIVE_MAP[campaign.objective] || "OUTCOME_ENGAGEMENT";

  return {
    name: campaign.name,
    objective: fbObjective,
    status: campaign.status,
    special_ad_categories: ["NONE"],
    page_id: campaign.facebookPageId,
    page_name: campaign.facebookPage,
    daily_budget: campaign.daily_budget,
    lifetime_budget: campaign.lifetime_budget,
    start_time: campaign.start_time,
    stop_time: campaign.stop_time,
  };
}

/**
 * Xây dựng payload cho AdSet
 */
function buildAdsetPayload(adset, campaign) {
  const fbObjective =
    FB_OBJECTIVE_MAP[campaign.objective] || "OUTCOME_ENGAGEMENT";
  const adsetDefaults = FB_ADSET_DEFAULTS_BY_OBJECTIVE[fbObjective] || {
    optimization_goal: "REACH",
    billing_event: "IMPRESSIONS",
    bid_strategy: "LOWEST_COST_WITH_BID_CAP",
    bid_amount: 1000,
  };

  return {
    _id: adset._id,
    name: adset.name,
    daily_budget: adset.budgetAmount,
    status: "PAUSED",
    ...adsetDefaults,
    targeting: {
      age_min: adset.targeting.ageMin || 18,
      age_max: adset.targeting.ageMax || 65,
      geo_locations: { countries: ["VN"] },
      targeting_automation: {
        advantage_audience: 0,
      },
    },
    start_time: adset.schedule?.start
      ? new Date(adset.schedule.start).toISOString()
      : new Date().toISOString(),
    end_time: adset.schedule?.end
      ? new Date(adset.schedule.end).toISOString()
      : null,
    optimization_goal: adset.optimization_goal,
    conversion_event: adset.conversion_event,
    billing_event: adset.billing_event,
    bid_strategy: adset.bid_strategy,
    bid_amount: adset.bid_amount,
  };
}

/**
 * Xây dựng payload cho Creative
 */
function buildCreativePayload(ad, campaign) {
  return {
    name: ad.name,
    object_story_spec: {
      page_id: campaign.facebookPageId || "fb_page_id_placeholder",
      link_data: {
        message: ad.primaryText,
        link: ad.destinationUrl || "https://fchat.vn",
        caption: "fchat.vn",
        name: ad.headline,
        description: ad.description,
        call_to_action: {
          type: "MESSAGE_PAGE",
          value: { link: ad.destinationUrl || "https://fchat.vn" },
        },
        ...(ad.mediaUrl && { picture: ad.mediaUrl }),
      },
    },
  };
}

/**
 * Xây dựng payload cho Ad
 */
function buildAdPayload(ad) {
  return {
    adset_id: ad.adset_id,
    name: ad.name,
    status: "PAUSED",
  };
}
