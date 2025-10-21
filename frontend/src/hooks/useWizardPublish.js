import { useState } from "react";
import { useToast } from "./useToast";
import { publishAdsWizard, updateAdsWizard, publishAdsWizardBatch } from "../services/adsWizardService";
import { buildPayload } from "../utils/wizardUtils";
import { FB_OBJECTIVE_MAP, FB_ADSET_DEFAULTS_BY_OBJECTIVE } from "../constants/wizardConstants";

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

  // FUNCTION MỚI - Smart Publish Logic (SỬA LẠI)
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
      // Auto-detect và chọn phương thức tối ưu
      if (campaignsList.length > 1) {
        console.log('🚀 Using Batch API for multiple campaigns');
        
        // ✅ SỬA: Xử lý TẤT CẢ adsets và ads trong mỗi campaign
        const batchPayload = campaignsList.map(campaign => {
          // Tạo array chứa tất cả adsets và ads
          const campaignData = {
            campaign: campaign,
            adsets: [],
            ads: [],
            creatives: []
          };

          // Xử lý tất cả adsets trong campaign
          campaign.adsets.forEach((adset) => {
            campaignData.adsets.push(adset);
            
            // Xử lý tất cả ads trong mỗi adset
            adset.ads.forEach((ad) => {
              campaignData.ads.push(ad);
              campaignData.creatives.push(ad.creative);
            });
          });

          return campaignData;
        });

        const result = await publishAdsWizardBatch({
          campaignsList: batchPayload,
          selectedAccountId,
          mode
        });

        toast.success(`Publish thành công ${result.data.successCount}/${campaignsList.length} chiến dịch!`);
        
      } else {
        console.log('📝 Using Sequential API for single campaign');
        
        const campaign = campaignsList[0];
        
        // ✅ SỬA: Xử lý TẤT CẢ adsets và ads trong single campaign
        let successCount = 0;
        let totalAds = 0;
        
        // Đếm tổng số ads
        campaign.adsets.forEach(adset => {
          totalAds += adset.ads.length;
        });
        
        // Xử lý từng adset và ads
        for (let adsetIndex = 0; adsetIndex < campaign.adsets.length; adsetIndex++) {
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
            
            successCount++;
          }
        }

        toast.success(`Tạo thành công ${successCount}/${totalAds} quảng cáo trong chiến dịch!`);
      }

      setSuccess(true);
      setTimeout(() => {
        setLoading(false);
        onSuccess?.();
        onClose?.();
      }, 1200);

    } catch (err) {
      console.error("❌ Lỗi khi xử lý quảng cáo:", err);
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
