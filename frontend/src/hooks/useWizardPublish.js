import { useState } from "react";
import { useToast } from "./useToast";
import { useAuth } from "./useAuth";
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
 * Kiểm tra xem ID có phải ObjectId hợp lệ (24 ký tự hex)
 * Loại bỏ các temp ID như "temp_adset_123456"
 */
function isValidMongoId(id) {
  if (!id || typeof id !== 'string') return false;
  // ObjectId là 24 ký tự hex
  return /^[0-9a-fA-F]{24}$/.test(id);
}

/**
 * Custom hook để xử lý logic publish/update quảng cáo
 */
export function useWizardPublish() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const toast = useToast();
  // const { user } = useAuth(); // Not used in this hook

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
  const { user } = useAuth();

  /**
   * Publish toàn bộ cấu trúc linh hoạt
   * Sử dụng API mới: /api/ads-wizard/publish-flexible
   */
  const handleFlexiblePublish = async ({
    campaignsList,
    selectedAccountId,
    onSuccess,
    onClose, // ✅ Callback để đóng wizard
    updateProgress, // Callback để update progress UI
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
          // ✅ CHỈ gửi _id và draftId nếu là ObjectId hợp lệ (không phải temp_xxx)
          ...(isValidMongoId(campaign._id) && { _id: campaign._id }),
          ...(isValidMongoId(campaign.draftId) && { draftId: campaign.draftId }),
          external_id: campaign.external_id,
          ...buildCampaignPayload(campaign, user?._id),
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
              // ✅ CHỈ gửi _id và draftId nếu là ObjectId hợp lệ (không phải temp_xxx)
              ...(isValidMongoId(adset._id) && { _id: adset._id }),
              ...(isValidMongoId(adset.draftId) && { draftId: adset.draftId }),
              external_id: adset.external_id,
              ...buildAdsetPayload(adset, campaign, user?._id),
              ads: filteredAds.map((ad) => ({
                // ✅ CHỈ gửi _id và draftId nếu là ObjectId hợp lệ (không phải temp_xxx)
                ...(isValidMongoId(ad._id) && { _id: ad._id }),
                ...(isValidMongoId(ad.draftId) && { draftId: ad.draftId }),
                external_id: ad.external_id,
                ...buildAdPayload(ad, user?._id),
                creative: {
                  // ✅ CHỈ gửi các ID hợp lệ
                  ...(isValidMongoId(ad.creative_id || ad.creative?._id) && {
                    _id: ad.creative_id || ad.creative?._id
                  }),
                  ...(isValidMongoId(ad.creativeDraftId || ad.creative?.draftId) && {
                    draftId: ad.creativeDraftId || ad.creative?.draftId
                  }),
                  external_id: ad.creative?.external_id,
                  ...buildCreativePayload(ad, campaign, user?._id),
                },
              })),
            };
          }),
        })),
        dry_run: false,
      };

      // Đếm tổng số entities để track progress
      const totalEntities = campaignsList.reduce((sum, camp) => {
        const adsetsCount = camp.adsets?.length || 0;
        const adsCount = camp.adsets?.reduce((s, adset) => s + (adset.ads?.length || 0), 0) || 0;
        return sum + 1 + adsetsCount + adsCount; // campaign + adsets + ads
      }, 0);

      // Update progress: Đang gửi request
      updateProgress?.({
        current: 0,
        total: totalEntities,
        message: `Đang gửi yêu cầu tạo ${totalEntities} entities...`,
      });

      // Simulate progress với tốc độ smooth hơn
      let simulatedProgress = 0;
      const progressInterval = setInterval(() => {
        if (simulatedProgress < totalEntities * 0.85) {
          // Tăng nhanh ở đầu (10% mỗi lần)
          simulatedProgress += Math.ceil(totalEntities * 0.1);
        } else if (simulatedProgress < totalEntities * 0.95) {
          // Chậm lại ở cuối (5% mỗi lần)
          simulatedProgress += Math.ceil(totalEntities * 0.05);
        }
        
        if (simulatedProgress < totalEntities * 0.98) {
          updateProgress?.({
            current: Math.min(simulatedProgress, totalEntities),
            message: `Đang xử lý ${Math.min(simulatedProgress, totalEntities)}/${totalEntities} quảng cáo...`,
          });
        }
      }, 800); // Mỗi 0.8 giây update

      // Gọi API mới
      const response = await axiosInstance.post(
        "/api/ads-wizard/publish-flexible",
        payload,
        {
          timeout: 120000, // 120 giây = 2 phút (đủ cho tạo nhiều ads)
        }
      );

      // Clear interval khi API response
      clearInterval(progressInterval);

      if (response.data.success) {
        const { totalSuccess, totalErrors, errors } = response.data.data;

        // Update progress: Hoàn thành 100%
        if (totalErrors === 0) {
          updateProgress?.({
            status: 'success',
            current: totalEntities,
            percentage: 100, // ✅ Force 100%
            message: 'Tạo quảng cáo thành công!',
            successCount: totalSuccess,
            errorCount: 0,
          });
          
          toast.success(
            `Tạo thành công ${totalSuccess} quảng cáo trong ${campaignsList.length} chiến dịch!`
          );
        } else {
          updateProgress?.({
            status: 'partial',
            current: totalEntities,
            percentage: 100, // ✅ Force 100%
            message: `Hoàn thành với ${totalErrors} lỗi`,
            successCount: totalSuccess,
            errorCount: totalErrors,
            errors: errors || [],
          });
          
          toast.warning(
            `Tạo thành công ${totalSuccess}/${
              totalSuccess + totalErrors
            } quảng cáo. Có ${totalErrors} lỗi.`
          );
          console.warn("Một số quảng cáo tạo thất bại:", errors);
        }

        setSuccess(true);
        setLoading(false);
        onSuccess?.(response.data.data);
        
        // ✅ Đóng wizard cùng lúc với ProgressPopup sau 2 giây
        setTimeout(() => {
          onClose?.();
        }, 2000);
      } else {
        throw new Error(response.data.message || "Tạo quảng cáo thất bại");
      }
    } catch (err) {
      console.error("❌ Lỗi khi xử lý quảng cáo:", err);
      setLoading(false);

      const data = err?.response?.data || {};
      const fbMsg = data.error_user_msg || data.message || err.message || null;
      setError(fbMsg || null);

      // Update progress: Error
      updateProgress?.({
        status: 'error',
        message: fbMsg || 'Có lỗi xảy ra khi tạo quảng cáo',
        errors: data.errors || [{ error: fbMsg || err.message }],
      });

      // ✅ Luôn hiển thị toast error
      toast.error("Tạo quảng cáo thất bại", {
        description: fbMsg || 'Có lỗi xảy ra, vui lòng thử lại',
      });
      
      // ✅ Đóng wizard cùng lúc với ProgressPopup sau 3 giây
      setTimeout(() => {
        onClose?.();
      }, 3000);
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
          campaign: buildCampaignPayload(campaign, user?._id),
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
            adset: buildAdsetPayload(adset, campaign, user?._id),
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
              creative: buildCreativePayload(ad, campaign, user?._id),
              ad: buildAdPayload(ad, user?._id),
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
    onClose, // ✅ Callback để đóng wizard
    updateProgress, // Callback để update progress UI
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
          // ✅ CHỈ gửi _id và draftId nếu là ObjectId hợp lệ (không phải temp_xxx)
          ...(isValidMongoId(campaign._id) && { _id: campaign._id }),
          ...(isValidMongoId(campaign.draftId) && { draftId: campaign.draftId }),
          external_id: campaign.external_id,
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
              // ✅ CHỈ gửi _id và draftId nếu là ObjectId hợp lệ (không phải temp_xxx)
              ...(isValidMongoId(adset._id) && { _id: adset._id }),
              ...(isValidMongoId(adset.draftId) && { draftId: adset.draftId }),
              external_id: adset.external_id,
              ...buildAdsetPayload(adset, campaign, user?._id),
              ads: filteredAds.map((ad) => ({
                // ✅ CHỈ gửi _id và draftId nếu là ObjectId hợp lệ (không phải temp_xxx)
                ...(isValidMongoId(ad._id) && { _id: ad._id }),
                ...(isValidMongoId(ad.draftId) && { draftId: ad.draftId }),
                external_id: ad.external_id,
                ...buildAdPayload(ad, user?._id),
                creative: {
                  // ✅ CHỈ gửi các ID hợp lệ
                  ...(isValidMongoId(ad.creative_id || ad.creative?._id) && {
                    _id: ad.creative_id || ad.creative?._id
                  }),
                  ...(isValidMongoId(ad.creativeDraftId || ad.creative?.draftId) && {
                    draftId: ad.creativeDraftId || ad.creative?.draftId
                  }),
                  external_id: ad.creative?.external_id,
                  ...buildCreativePayload(ad, campaign, user?._id),
                },
              })),
            };
          }),
        })),
      };

      // Đếm tổng số entities để track progress
      const totalEntities = campaignsList.reduce((sum, camp) => {
        const adsetsCount = camp.adsets?.length || 0;
        const adsCount = camp.adsets?.reduce((s, adset) => s + (adset.ads?.length || 0), 0) || 0;
        return sum + 1 + adsetsCount + adsCount;
      }, 0);

      // Update progress: Đang gửi request
      updateProgress?.({
        current: 0,
        total: totalEntities,
        message: `Đang gửi yêu cầu cập nhật ${totalEntities} entities...`,
      });

      // Simulate progress với tốc độ smooth hơn
      let simulatedProgress = 0;
      const progressInterval = setInterval(() => {
        if (simulatedProgress < totalEntities * 0.85) {
          // Tăng nhanh ở đầu (10% mỗi lần)
          simulatedProgress += Math.ceil(totalEntities * 0.1);
        } else if (simulatedProgress < totalEntities * 0.95) {
          // Chậm lại ở cuối (5% mỗi lần)
          simulatedProgress += Math.ceil(totalEntities * 0.05);
        }
        
        if (simulatedProgress < totalEntities * 0.98) {
          updateProgress?.({
            current: Math.min(simulatedProgress, totalEntities),
            message: `Đang cập nhật ${Math.min(simulatedProgress, totalEntities)}/${totalEntities} quảng cáo...`,
          });
        }
      }, 800); // Mỗi 0.8 giây update

      // Gọi API update
      const response = await axiosInstance.put(
        "/api/ads-wizard/update-flexible",
        payload,
        {
          timeout: 120000, // 120 giây = 2 phút
        }
      );

      clearInterval(progressInterval);

      if (response.data.success) {
        const { totalUpdated, totalCreated, totalErrors, errors, details } = response.data.data;

        // Update progress: Hoàn thành 100%
        if (totalErrors === 0) {
          updateProgress?.({
            status: 'success',
            current: totalEntities,
            percentage: 100, // ✅ Force 100%
            message: 'Cập nhật thành công!',
            successCount: totalUpdated + totalCreated,
            errorCount: 0,
          });
          
          toast.success(
            `Cập nhật thành công ${details.updated.campaigns.length + details.updated.adsets.length + details.updated.ads.length} entities, tạo mới ${details.created.campaigns.length + details.created.adsets.length + details.created.ads.length} entities!`
          );
        } else {
          updateProgress?.({
            status: 'partial',
            current: totalEntities,
            percentage: 100, // ✅ Force 100%
            message: `Hoàn thành với ${totalErrors} lỗi`,
            successCount: totalUpdated + totalCreated,
            errorCount: totalErrors,
            errors: errors || [],
          });
          
          toast.warning(
            `Cập nhật ${totalUpdated} entities, tạo mới ${totalCreated} entities. Có ${totalErrors} lỗi.`
          );
          console.warn("Một số cập nhật thất bại:", errors);
        }

        setSuccess(true);
        setLoading(false);
        onSuccess?.(response.data.data);
        
        // ✅ Đóng wizard cùng lúc với ProgressPopup sau 2 giây
        setTimeout(() => {
          onClose?.();
        }, 2000);
      } else {
        throw new Error(response.data.message || "Cập nhật thất bại");
      }
    } catch (err) {
      console.error("❌ Lỗi khi cập nhật quảng cáo:", err);
      setLoading(false);

      const data = err?.response?.data || {};
      const fbMsg = data.error_user_msg || data.message || err.message || null;
      setError(fbMsg || null);

      // Update progress: Error
      updateProgress?.({
        status: 'error',
        message: fbMsg || 'Có lỗi xảy ra khi cập nhật',
        errors: data.errors || [{ error: fbMsg || err.message }],
      });

      // ✅ Luôn hiển thị toast error
      toast.error("Cập nhật thất bại", {
        description: fbMsg || 'Có lỗi xảy ra, vui lòng thử lại',
      });
      
      // ✅ Đóng wizard cùng lúc với ProgressPopup sau 3 giây
      setTimeout(() => {
        onClose?.();
      }, 3000);
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
function buildCampaignPayload(campaign, userId) {
  const fbObjective =
    FB_OBJECTIVE_MAP[campaign.objective] || "OUTCOME_ENGAGEMENT";

  return {
    name: campaign.name,
    objective: fbObjective,
    status: campaign.status === "DRAFT" ? "PAUSED" : campaign.status,
    special_ad_categories: ["NONE"],
    page_id: campaign.facebookPageId,
    page_name: campaign.facebookPage,
    daily_budget: campaign.daily_budget,
    lifetime_budget: campaign.lifetime_budget,
    start_time: campaign.start_time,
    stop_time: campaign.stop_time,
    created_by: userId,
  };
}

/**
 * Xây dựng payload cho AdSet
 */
function buildAdsetPayload(adset, campaign, userId) {
  const fbObjective =
    FB_OBJECTIVE_MAP[campaign.objective] || "OUTCOME_ENGAGEMENT";
  const adsetDefaults = FB_ADSET_DEFAULTS_BY_OBJECTIVE[fbObjective] || {
    optimization_goal: "REACH",
    billing_event: "IMPRESSIONS",
    bid_strategy: "LOWEST_COST_WITH_BID_CAP",
    bid_amount: 1000,
  };

  return {
    // _id: adset._id,
    name: adset.name,
    daily_budget: adset.budgetAmount,
    status: adset.status === "DRAFT" ? "PAUSED" : (adset.status || "PAUSED"),
    ...adsetDefaults,
    targeting: {
      age_min: adset.targeting?.ageMin || 18,
      age_max: adset.targeting?.ageMax || 65,
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
    created_by: userId,
  };
}

/**
 * Xây dựng payload cho Creative
 */
function buildCreativePayload(ad, campaign, userId) {
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
          type: "LEARN_MORE",
          value: { link: ad.destinationUrl || "https://fchat.vn" },
        },
        ...(ad.mediaUrl && { picture: ad.mediaUrl }),
      },
    },
    created_by: userId,
  };
}

/**
 * Xây dựng payload cho Ad
 */
function buildAdPayload(ad, userId) {
  return {
    adset_id: ad.adset_id,
    name: ad.name,
    status: ad.status === "DRAFT" ? "PAUSED" : (ad.status || "PAUSED"),
    created_by: userId,
  };
}
