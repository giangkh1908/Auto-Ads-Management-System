import { useEffect } from "react";
import axiosInstance from "../utils/axios";
import { useToast } from "./useToast";
import { extractObjectId, findIdInObject } from "../utils/wizardUtils";

/**
 * Custom hook để xử lý logic edit mode
 */
export function useEditMode({
  mode,
  editingItem,
  selectedAccountId,
  setCampaign,
  setAdset,
  setAd,
  setLoading,
}) {
  const toast = useToast();

  useEffect(() => {
    const loadUpdateData = async () => {
      if (mode !== "edit" || !editingItem || !selectedAccountId) {
        console.log("🔍 Early return:", { mode });
        return;
      }

      // Tìm ID trong các trường có thể có
      let rawItemId = editingItem.id || editingItem._id || editingItem.campaign_id || 
                     editingItem.adset_id || editingItem.ad_id || editingItem.creative_id || 
                     editingItem.set_id;

      // Nếu không tìm thấy ID, thử tìm trong toàn bộ object
      if (!rawItemId) {
        rawItemId = findIdInObject(editingItem);
      }

      // Mã hóa id từ ObjectId
      const itemId = extractObjectId(rawItemId);

      setLoading(true);
      try {
        // Determine campaign ID based on editing item type
        let campaignId = null;
        let campaignData = null;
        let adsetData = null;
        let adData = null;
        let creativeData = null;

        if (editingItem.type === "campaign") {
          campaignId = itemId;
          console.log("📋 Campaign ID:", campaignId);
        } else if (editingItem.type === "adset") {
          const adsetRes = await axiosInstance.get("/api/adsets/database", {
            params: { adset_id: itemId },
          });
          const adsetJson = adsetRes.data;
          console.log("📋 Adset response:", adsetJson);
          adsetData = adsetJson.data;
          campaignId = adsetData?.campaign_id;
        } else if (editingItem.type === "ad") {
          console.log("🔍 Fetching ad data for ID:", itemId);
          const adRes = await axiosInstance.get("/api/ads/database", {
            params: { ad_id: itemId },
          });
          const adJson = adRes.data;
          console.log("📋 Ad response:", adJson);
          adData = adJson.data;

          // Ad không có campaign_id trực tiếp, cần tìm qua set_id
          if (adData && adData.set_id) {
            console.log("🔍 Ad không có campaign_id, tìm qua set_id:", adData.set_id);
            const adsetRes = await axiosInstance.get("/api/adsets/database", {
              params: { adset_id: adData.set_id },
            });
            const adsetJson = adsetRes.data;
            console.log("📋 Adset response for campaign lookup:", adsetJson);

            if (adsetJson.success && adsetJson.data) {
              campaignId = adsetJson.data.campaign_id;
              console.log("📋 Found campaign_id through adset:", campaignId);
            }
          } else {
            campaignId = adData?.campaign_id;
          }
        }

        if (!campaignId) {
          throw new Error("Không tìm thấy campaign ID");
        }

        // Fetch campaign data từ database
        console.log("🔍 Fetching campaign data for ID:", campaignId);
        const campaignRes = await axiosInstance.get("/api/campaigns/database", {
          params: { campaign_id: campaignId },
        });
        const campaignJson = campaignRes.data;
        console.log("📋 Campaign response:", campaignJson);
        campaignData = campaignJson.data;

        if (campaignData) {
          setCampaign({
            id: campaignData._id,
            external_id: campaignData.external_id,
            name: campaignData.name || "Chiến dịch mới",
            objective: campaignData.objective || "POST_ENGAGEMENT",
            budgetType: campaignData.daily_budget ? "CAMPAIGN" : "ADSET",
            facebookPage: campaignData.page_name || "Facebook Page",
            facebookPageId: campaignData.page_id,
            facebookPageAvatar: campaignData.page_id
              ? `https://graph.facebook.com/${campaignData.page_id}/picture?type=square`
              : null,
            daily_budget: campaignData.daily_budget,
            lifetime_budget: campaignData.lifetime_budget,
            start_time: campaignData.start_time,
            stop_time: campaignData.stop_time,
          });
        }

        // Fetch adset data từ database
        if (!adsetData) {
          const adsetsRes = await axiosInstance.get("/api/adsets/database", {
            params: { campaign_id: campaignId },
          });
          const adsetsJson = adsetsRes.data;
          const adsetsData = adsetsJson.data || [];
          adsetData =
            editingItem.type === "adset"
              ? adsetsData.find((adset) => adset._id === itemId) ||
                adsetsData[0]
              : adsetsData[0];
        }

        if (adsetData) {
          setAdset({
            id: adsetData._id,
            external_id: adsetData.external_id,
            name: adsetData.name || "Nhóm quảng cáo mới",
            budgetType: adsetData.daily_budget ? "daily" : "lifetime",
            budgetAmount: adsetData.daily_budget || adsetData.lifetime_budget,
            start_time: adsetData.start_time,
            end_time: adsetData.end_time,
            schedule: {
              start: adsetData.start_time
                ? new Date(adsetData.start_time).toISOString().split("T")[0]
                : "",
              end: adsetData.end_time
                ? new Date(adsetData.end_time).toISOString().split("T")[0]
                : "",
            },
            placement: "AUTOMATIC",
            targeting: adsetData.targeting || {
              location: "Việt Nam",
              ageMin: 18,
              ageMax: 65,
            },
            optimization_goal: adsetData.optimization_goal,
            conversion_event: adsetData.conversion_event,
            billing_event: adsetData.billing_event,
            bid_strategy: adsetData.bid_strategy,
            bid_amount: adsetData.bid_amount,  
          });
        }

        // Fetch ad data từ database
        if (!adData) {
          const adsRes = await axiosInstance.get("/api/ads/database", {
            params: { campaign_id: campaignId },
          });
          const adsJson = adsRes.data;
          const adsData = adsJson.data || [];
          adData =
            editingItem.type === "ad"
              ? adsData.find((ad) => ad._id === itemId) || adsData[0]
              : adsData[0];
        }

        if (adData) {
          // Fetch creative data từ database
          if (adData.creative_id) {
            const creativeRes = await axiosInstance.get(
              "/api/creatives/database",
              {
                params: { creative_id: adData.creative_id },
              }
            );
            const creativeJson = creativeRes.data;
            creativeData = creativeJson.data;
          }

          setAd({
            id: adData._id,
            external_id: adData.external_id,
            name: adData.name || "Quảng cáo mới",
            page: campaignData?.page_name || "Facebook Page",
            media: creativeData?.object_story_spec?.link_data?.picture
              ? "image"
              : "text",
            mediaUrl:
              creativeData?.object_story_spec?.link_data?.picture || null,
            primaryText:
              creativeData?.object_story_spec?.link_data?.message ||
              "Hãy giới thiệu về nội dung quảng cáo của bạn",
            headline:
              creativeData?.object_story_spec?.link_data?.name ||
              "Chat trong Messenger",
            description:
              creativeData?.object_story_spec?.link_data?.description ||
              "Khám phá dịch vụ của chúng tôi ngay!",
            cta:
              creativeData?.object_story_spec?.link_data?.call_to_action
                ?.type || "Gửi tin nhắn",
            destinationUrl:
              creativeData?.object_story_spec?.link_data?.link ||
              "https://fchat.vn",
            creative_id: adData.creative_id,
          });
        }
      } catch (e) {
        console.log("Failed to load update data from database:", e);
        if (e?.response?.status === 401) {
          toast.error("Phiên đăng nhập đã hết hạn", {
            description: "Vui lòng đăng nhập lại để tiếp tục",
          });
        } else {
          toast.error("Không tải được dữ liệu", {
            description: "Vui lòng thử lại hoặc kiểm tra kết nối mạng",
          });
        }
      } finally {
        setLoading(false);
      }
    };
    loadUpdateData();
  }, [mode, editingItem, selectedAccountId, toast, setCampaign, setAdset, setAd, setLoading]);
}
