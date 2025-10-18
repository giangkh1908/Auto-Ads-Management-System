import { useState, useEffect, useRef, useCallback } from "react";
import Control from "../CreateAdsWizard/Control/Control.jsx";
import FooterWizard from "../CreateAdsWizard/FooterWizard/FooterWizard.jsx";
import TargetStep from "../CreateAdsWizard/TargetStep/TargetStep.jsx";
import CreateChild from "../CreateAdsWizard/CreateChild/CreateChild.jsx";
import CampaignStep from "../CreateAdsWizard/CampaignStep/CampaignStep.jsx";
import AdsetStep from "../CreateAdsWizard/AdsetStep/AdsetStep.jsx";
import AdStep from "../CreateAdsWizard/AdStep/AdStep.jsx";
import Creative from "./Creative/Creative.jsx";
import "./CreateAdsWizard.css";
import profileService from "../../../services/profileService";
import {
  publishAdsWizard,
  updateAdsWizard,
} from "../../../services/adsWizardService";
import { useToast } from "../../../hooks/useToast";
import axiosInstance from "../../../utils/axios";

function CreateAdsWizard({
  onClose,
  onSuccess = null,
  mode = "create",
  editingItem = null,
  selectedAccountId = null,
  // datasets = null,
  selectedCampaign: _selectedCampaign = null, // eslint-disable-line no-unused-vars
  // selectedAdset: _selectedAdset = null,
  setDatasets: _setDatasets = null, // eslint-disable-line no-unused-vars
}) {
  const toast = useToast();

  // Helper function để extract string ID từ ObjectId format
  function extractObjectId(value) {
    if (!value) return null;
    if (typeof value === "string") {
      const match = value.match(/[0-9a-fA-F]{24}/);
      return match ? match[0] : null;
    }
    if (value.$oid) return value.$oid; // trong trường hợp Mongo xuất ra kiểu { $oid: '...' }
    return value.toString();
  }

  // Helper function để tìm ID trong object
  const findIdInObject = useCallback((obj) => {
    if (!obj || typeof obj !== "object") return null;

    // Danh sách các trường có thể chứa ID
    const idFields = [
      "id",
      "_id",
      "campaign_id",
      "adset_id",
      "ad_id",
      "creative_id",
      "set_id",
      "campaignId",
      "adsetId",
      "adId",
      "creativeId",
      "setId",
    ];

    // Tìm trong các trường trực tiếp
    for (const field of idFields) {
      if (obj[field]) {
        // console.log(`🔍 Found ID in field '${field}':`, obj[field]);
        return obj[field];
      }
    }

    // Tìm trong nested objects
    for (const key in obj) {
      if (obj[key] && typeof obj[key] === "object") {
        const nestedId = findIdInObject(obj[key]);
        if (nestedId) {
          // console.log(`🔍 Found ID in nested field '${key}':`, nestedId);
          return nestedId;
        }
      }
    }

    return null;
  }, []);

  const [wizardStep, setWizardStep] = useState(0);
  const contentRef = useRef(null);
  const [facebookPages, setFacebookPages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ERROR_MESSAGE, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Tab management
  const [activeTab, setActiveTab] = useState("campaign"); // "campaign" or "child"


  // Track completed steps so they don't change once completed
  const [completedSteps, setCompletedSteps] = useState({
    1: false,
    2: false,
    3: false,
    4: false,
  });

  // refs for step validation
  const campaignRef = useRef(null);
  const adsetRef = useRef(null);
  const adRef = useRef(null);

  // ========== Initial Data ==========
  const initialData = {
    campaign: {
      objective: "POST_ENGAGEMENT",
      name: "Chiến dịch mới",
      budgetType: "CAMPAIGN",
      facebookPage: "Fchat.vn",
      facebookPageId: null,
      facebookPageAvatar: null,
    },
    adset: {
      name: "Nhóm quảng cáo mới",
      budgetType: "daily",
      budgetAmount: 2000000,
      placement: "AUTOMATIC",
      targeting: { location: "Việt Nam", ageMin: 18, ageMax: 45 },
      conversion_event: "VIEW_CONTENT",
    },
    ad: {
      // name: "Quảng cáo mới",
      // page: "Fchat.vn",
      // media: "image",
      // mediaUrl: "",
      // primaryText: "Khám phá sản phẩm/dịch vụ tuyệt vời của chúng tôi! Chất lượng cao, giá cả hợp lý và dịch vụ chuyên nghiệp. Liên hệ ngay để được tư vấn miễn phí.",
      // headline: "Sản phẩm/Dịch vụ chất lượng cao",
      // description: "Đội ngũ chuyên nghiệp, kinh nghiệm lâu năm trong lĩnh vực. Cam kết mang đến trải nghiệm tốt nhất cho khách hàng.",
      // cta: "Liên hệ ngay",
      // destinationUrl: "https://fchat.vn",
    },
  };

  // Support multiple campaigns/adsets/ads
  const [campaignsList, setCampaignsList] = useState([initialData.campaign]);
  const [selectedCampaignIndex, setSelectedCampaignIndex] = useState(0);
  const [adsetsByCampaign, setAdsetsByCampaign] = useState([[initialData.adset]]);
  const [adsByAdset, setAdsByAdset] = useState([[initialData.ad]]);
  const [selectedAdsetIndex, setSelectedAdsetIndex] = useState(0);
  const [selectedAdIndex, setSelectedAdIndex] = useState(0);

  // Derived slices for currently selected campaign
  const campaign = campaignsList[selectedCampaignIndex] || initialData.campaign;
  const setCampaign = useCallback((updater) => {
    setCampaignsList((prev) => {
      const next = [...prev];
      const current = prev[selectedCampaignIndex] || {};
      const updated = typeof updater === 'function' ? updater(current) : updater;
      next[selectedCampaignIndex] = updated;
      return next;
    });
  }, [selectedCampaignIndex]);

  const adsetsList = adsetsByCampaign[selectedCampaignIndex] || [initialData.adset];
  const setAdsetsList = useCallback((updater) => {
    setAdsetsByCampaign((prev) => {
      // Ensure prev is an array
      const prevArray = Array.isArray(prev) ? prev : [];
      const next = prevArray.map((arr) => Array.isArray(arr) ? [...arr] : []);
      const currentList = next[selectedCampaignIndex] || [];
      const updatedList = typeof updater === 'function' ? updater(currentList) : updater;
      next[selectedCampaignIndex] = updatedList;
      return next;
    });
  }, [selectedCampaignIndex]);

  const adset = adsetsList[selectedAdsetIndex] || initialData.adset;
  const setAdset = useCallback((updater) => {
    setAdsetsList((prev) => {
      // Ensure prev is an array
      const prevArray = Array.isArray(prev) ? prev : [];
      const next = [...prevArray];
      const current = prevArray[selectedAdsetIndex] || {};
      const updated = typeof updater === 'function' ? updater(current) : updater;
      next[selectedAdsetIndex] = updated;
      return next;
    });
  }, [selectedAdsetIndex, setAdsetsList]);

  const adsList = adsByAdset[0]?.[0] || [initialData.ad];
  const setAdsList = useCallback((updater) => {
    setAdsByAdset((prev) => {
      // Ensure prev is an array
      const prevArray = Array.isArray(prev) ? prev : [];
      const next = prevArray.map((campaignAds) => Array.isArray(campaignAds) ? [...campaignAds] : []);
      const currentCampaignAds = next[0] || [];
      const currentAdsetAds = currentCampaignAds[0] || [];
      const updatedAdsetAds = typeof updater === 'function' ? updater(currentAdsetAds) : updater;
      currentCampaignAds[0] = updatedAdsetAds;
      next[0] = currentCampaignAds;
      return next;
    });
  }, []);

  const ad = adsList[selectedAdIndex] || initialData.ad;
  const setAd = useCallback((updater) => {
    setAdsList((prev) => {
      // Ensure prev is an array
      const prevArray = Array.isArray(prev) ? prev : [];
      const next = [...prevArray];
      const current = prevArray[selectedAdIndex] || {};
      const updated = typeof updater === 'function' ? updater(current) : updater;
      next[selectedAdIndex] = updated;
      return next;
    });
  }, [selectedAdIndex, setAdsList]);

  // Copy/Delete moved into Control component

  // Lock background scroll while wizard is open
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  // Scroll to top when wizard step changes
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }, [wizardStep]);

  // Load connected Facebook pages for selection
  useEffect(() => {
    const loadPages = async () => {
      try {
        // Lấy thông tin shop hiện tại và các page đã kết nối
        const me = await profileService.getCurrentProfile();
        const shop = me?.data?.shop || me?.shop;
        const connectedPages = Array.isArray(shop?.facebook_pages)
          ? shop.facebook_pages
              .filter((p) => p.connected_status === "connected")
              .map((p) => ({
                id: p.page_id,
                name: p.page_info?.name || "Facebook Page",
                avatar:
                  p.page_info?.picture_url ||
                  `https://graph.facebook.com/${p.page_id}/picture?type=square`,
              }))
          : [];
        setFacebookPages(connectedPages);

        // Show success toast if pages are loaded
        if (connectedPages.length > 0) {
          console.log("Tải danh sách Page thành công!");
        } else {
          toast.warning("Không có Page nào được kết nối", {
            description:
              "Vui lòng kết nối ít nhất một Page trước khi tạo quảng cáo",
          });
        }
      } catch (e) {
        // silent fail; selection will just be empty
        console.log("Failed to load connected facebook pages", e);
        toast.error("Không tải được danh sách Page", {
          description: "Vui lòng kiểm tra kết nối mạng và thử lại",
        });
      }
    };
    loadPages();
  }, [toast]);

  // Load data for update/edit mode - Load từ database thay vì Facebook API
  useEffect(() => {
    const loadUpdateData = async () => {
      // console.log("🔍 Debug props:", { mode, editingItem, selectedAccountId });

      if (mode !== "edit" || !editingItem || !selectedAccountId) {
        console.log("🔍 Early return:", {
          mode,
          // hasEditingItem: !!editingItem,
          // hasSelectedAccountId: !!selectedAccountId,
        });
        return;
      }

      // Tìm ID trong các trường có thể có
      let rawItemId = editingItem.id || editingItem._id || editingItem.campaign_id || editingItem.adset_id || editingItem.ad_id || editingItem.creative_id || editingItem.set_id;

      // Nếu không tìm thấy ID, thử tìm trong toàn bộ object
      if (!rawItemId) {
        rawItemId = findIdInObject(editingItem);
      }

      //Mã hóa id từ ObjectId
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
          // Nếu edit campaign, lấy campaign ID trực tiếp từ _id
          campaignId = itemId;
          console.log("📋 Campaign ID:", campaignId);
        } else if (editingItem.type === "adset") {
          // Nếu edit adset, tìm campaign ID từ adset
          const adsetRes = await axiosInstance.get("/api/adsets/database", {
            params: { adset_id: itemId },
          });
          const adsetJson = adsetRes.data;
          console.log("📋 Adset response:", adsetJson);
          adsetData = adsetJson.data;
          campaignId = adsetData?.campaign_id;
        } else if (editingItem.type === "ad") {
          // Nếu edit ad, tìm campaign ID từ ad
          console.log("🔍 Fetching ad data for ID:", itemId);
          const adRes = await axiosInstance.get("/api/ads/database", {
            params: { ad_id: itemId },
          });
          const adJson = adRes.data;
          console.log("📋 Ad response:", adJson);
          adData = adJson.data;

          // Ad không có campaign_id trực tiếp, cần tìm qua set_id
          if (adData && adData.set_id) {
            console.log(
              "🔍 Ad không có campaign_id, tìm qua set_id:",
              adData.set_id
            );
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
            campaignId = adData?.campaign_id; // Fallback nếu có campaign_id trực tiếp
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
  }, [mode, editingItem, selectedAccountId, toast, findIdInObject, setCampaign, setAdset, setAd]);

  // ========== Prefill khi edit (đã được thay thế bằng loadUpdateData) ==========
  // Logic cũ đã được loại bỏ để sử dụng dữ liệu từ database thay vì data tĩnh

  // Set initial wizard step based on editingItem
  useEffect(() => {
    if (mode === "edit" && editingItem) {
      switch (editingItem.type) {
        case "campaign":
          setWizardStep(1);
          break;
        case "adset":
          setWizardStep(2);
          break;
        case "ad":
          setWizardStep(3);
          break;
        default:
          setWizardStep(1);
      }
    }
  }, [mode, editingItem]);

  // ========== Xây payload gửi API ==========
  const buildPayload = () => {
    // const access_token = localStorage.getItem("fb_access_token") || null;
    const fbObjectiveMap = {
      AWARENESS: "OUTCOME_AWARENESS",
      TRAFFIC: "OUTCOME_TRAFFIC",
      ENGAGEMENT: "OUTCOME_ENGAGEMENT",
      LEADS: "OUTCOME_LEADS",
      SALES: "OUTCOME_SALES",
      APP_PROMOTION: "OUTCOME_APP_PROMOTION",
    };

    const fbAdsetDefaultsByObjective = {
      OUTCOME_AWARENESS: {
        optimization_goal: "REACH",
        billing_event: "IMPRESSIONS",
        bid_strategy: "LOWEST_COST_WITH_BID_CAP",
        bid_amount: 1000, // 1000 VND
      },
      OUTCOME_ENGAGEMENT: {
        optimization_goal: "POST_ENGAGEMENT",
        billing_event: "IMPRESSIONS",
        bid_strategy: "LOWEST_COST_WITH_BID_CAP",
        bid_amount: 1000, // 1000 VND
      },
      OUTCOME_TRAFFIC: {
        optimization_goal: "LINK_CLICKS",
        billing_event: "IMPRESSIONS",
        bid_strategy: "LOWEST_COST_WITH_BID_CAP",
        bid_amount: 1000, // 1000 VND
      },
      OUTCOME_LEADS: {
        optimization_goal: "LEAD_GENERATION",
        billing_event: "IMPRESSIONS",
        bid_strategy: "LOWEST_COST_WITH_BID_CAP",
        bid_amount: 1000, // 1000 VND
      },
      OUTCOME_SALES: {
        optimization_goal: "CONVERSIONS",
        billing_event: "IMPRESSIONS",
        bid_strategy: "LOWEST_COST_WITH_BID_CAP",
        bid_amount: 1000, // 1000 VND
      },
    };

    const fbObjective =
      fbObjectiveMap[campaign.objective] || "OUTCOME_ENGAGEMENT";

    const adsetDefaults = fbAdsetDefaultsByObjective[fbObjective] || {
      optimization_goal: "REACH",
      billing_event: "IMPRESSIONS",
      bid_strategy: "LOWEST_COST_WITH_BID_CAP",
      bid_amount: 1000, // 1000 VND
    };

    if (!campaign.facebookPageId) {
      toast.warning("Thiếu thông tin Facebook Page", {
        description: "Vui lòng chọn trang Facebook trước khi tạo quảng cáo",
      });
      throw new Error("Vui lòng chọn Trang Facebook trước khi đăng quảng cáo.");
    }

    const creative = {
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

    return {
      ad_account_id:
        selectedAccountId || localStorage.getItem("selectedAdAccount"),
      // Kèm ID để update đúng bản ghi trong DB và Facebook
      campaign: {
        draftId: campaign.id || editingItem?.data?._id || null,
        external_id:
          campaign.external_id || editingItem?.data?.external_id || null,
        name: campaign.name,
        objective: fbObjective,
        status: "PAUSED",
        special_ad_categories: ["NONE"],
        page_id: campaign.facebookPageId,
        page_name: campaign.facebookPage,
        daily_budget: campaign.daily_budget,
        lifetime_budget: campaign.lifetime_budget,
        start_time: campaign.start_time,
        stop_time: campaign.stop_time,
      },
      adset: {
        draftId: adset.id || null,
        external_id: adset.external_id || null,
        name: adset.name,
        daily_budget: adset.budgetAmount,
        status: "PAUSED",
        ...adsetDefaults,
        targeting: {
          age_min: adset.targeting.ageMin || 18,
          age_max: adset.targeting.ageMax || 65,
          geo_locations: { countries: ["VN"] },
          targeting_automation: {
            advantage_audience: 0, // 0 = tắt Advantage Audience, 1 = bật
          },
        },
        // Thêm start_time và end_time để tránh lỗi
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
        // Pixel/conversion for SALES objective
        ...(fbObjective === "OUTCOME_SALES" && adset.pixel_id
          ? {
              promoted_object: {
                pixel_id: adset.pixel_id,
                ...(adset.conversion_event
                  ? { custom_event_type: adset.conversion_event }
                  : {}),
              },
            }
          : {}),
      },

      ad: {
        draftId: ad.id || null,
        external_id: ad.external_id || null,
        name: ad.name,
        status: "PAUSED",
        creative_id: ad.creative_id,
      },

      creative: {
        draftId: ad.creative_id || null,
        external_id: null, // Sẽ được set sau khi tạo creative
        ...creative,
      },
    };
  };

  // ========== Gọi API tạo/ cập nhật quảng cáo ==========
  const handlePublish = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const payload = buildPayload();

      // Validate ad_account_id
      if (!payload.ad_account_id) {
        throw new Error("Thiếu ad_account_id hoặc access_token.");
      }

      if (mode === "edit") {
        await updateAdsWizard(payload);
      } else {
        await publishAdsWizard(payload);
      }

      setSuccess(true);

      // Show success toast
      if (mode === "edit") {
        toast.success("Cập nhật quảng cáo thành công!");
      } else {
        toast.success("Tạo quảng cáo thành công!");
      }

      setTimeout(() => {
        setLoading(false);
        onSuccess?.();
        onClose?.();
      }, 1200);
    } catch (err) {
      console.error("❌ Lỗi khi xử lý quảng cáo:", err);
      setLoading(false);

      // Chỉ hiển thị thông điệp lỗi từ Facebook (error_user_msg)
      const data = err?.response?.data || {};
      const fbMsg = data.error_user_msg || null;
      setError(fbMsg || null);
      if (fbMsg) {
        toast.error(mode === "edit" ? "Cập nhật quảng cáo thất bại" : "Tạo quảng cáo thất bại", {
          description: fbMsg,
        });
      }
      // Không hiển thị thông báo nào khác nếu không có error_user_msg
    }
  };

  return (
    <div className="ads-modal-overlay" role="dialog" aria-modal="true">
      <div className={`ads-modal ${(activeTab === "child" && wizardStep === 0) ? "child-tab" : "campaign-tab"}`}>
        <div className="ads-modal-header">
          {wizardStep === 0 && (
            <div className="ads-modal-tabs">
              <button 
                className={`tab-button-campaign ${activeTab === "campaign" ? "active" : "inactive"}`}
                onClick={() => setActiveTab("campaign")}
              >
                {mode === "edit"
                  ? `Chỉnh sửa ${
                      editingItem?.type === "campaign"
                        ? "chiến dịch"
                        : editingItem?.type === "adset"
                        ? "nhóm quảng cáo"
                        : "quảng cáo"
                    }`
                  : "Tạo chiến dịch"}
              </button>
              <button 
                className={`tab-button-campaign ${activeTab === "child" ? "active" : "inactive"}`}
                onClick={() => setActiveTab("child")}
              >
                Nhóm quảng cáo hoặc quảng cáo mới
              </button>
            </div>
          )}
          {wizardStep > 0 && (
            <div className="ads-modal-title">
              {mode === "edit"
                ? `Chỉnh sửa ${
                    editingItem?.type === "campaign"
                      ? "chiến dịch"
                      : editingItem?.type === "adset"
                      ? "nhóm quảng cáo"
                      : "quảng cáo"
                  }`
                : "Tạo chiến dịch"}
            </div>
          )}
          {/* <button className="ads-modal-close" onClick={onClose}>✕</button> */}
        </div>

        <div className="ads-modal-body">
          {(activeTab === "campaign" || wizardStep > 0) ? (
            <>
          {/* Unified Left Panel - Campaign Hierarchy (hidden for step 0) */}
          {wizardStep > 0 && (
            <Control
              wizardStep={wizardStep}
              setWizardStep={setWizardStep}
              completedSteps={completedSteps}
              campaignsList={campaignsList}
              setSelectedCampaignIndex={setSelectedCampaignIndex}
              adsetsByCampaign={adsetsByCampaign}
              adsByAdset={adsByAdset}
              setSelectedAdsetIndex={setSelectedAdsetIndex}
              setSelectedAdIndex={setSelectedAdIndex}
            />
          )}

          <div className="wizard-content" ref={contentRef}>
            {wizardStep === 0 && (
                  <TargetStep campaign={campaign} setCampaign={setCampaign} />
            )}

            {/* Campaign Details Panel */}
            {wizardStep === 1 && (
              <CampaignStep
                ref={campaignRef}
                campaign={campaign}
                setCampaign={setCampaign}
                campaignsList={campaignsList}
                setCampaignsList={setCampaignsList}
                selectedCampaignIndex={selectedCampaignIndex}
                setSelectedCampaignIndex={setSelectedCampaignIndex}
                facebookPages={facebookPages}
              />
            )}

            {/* Adset Details Panel */}
            {wizardStep === 2 && (
              <AdsetStep
                ref={adsetRef}
                adset={adset}
                setAdset={setAdset}
                mode={mode}
                objective={campaign.objective}
                adsetsList={adsetsList}
                setAdsetsList={setAdsetsList}
              />
            )}

            {/* Ad Details Panel */}
            {wizardStep === 3 && (
              <AdStep
                ref={adRef}
                ad={ad}
                setAd={setAd}
                mode={mode}
                campaign={campaign}
                adsList={adsList}
                setAdsList={setAdsList}
              />
            )}

            {/* Creative Preview Panel */}
            {wizardStep === 4 && (
              <Creative ad={ad} campaign={campaign} adset={adset} />
            )}
          </div>
            </>
          ) : (
            /* CreateChild Mode - Full Width */
            <div className="create-child-full-mode">
              <CreateChild
                onClose={() => setActiveTab("campaign")}
                onSave={(data) => {
                  console.log("CreateChild data:", data);
                  // Handle save logic here
                  setActiveTab("campaign");
                }}
                isFullMode={true}
              />
            </div>
          )}
        </div>

        {/* Wizard Footer - Show in campaign mode or when wizardStep > 0 */}
        {(activeTab === "campaign" || wizardStep > 0) && (
          <FooterWizard
            wizardStep={wizardStep}
            setWizardStep={setWizardStep}
            completedSteps={completedSteps}
            setCompletedSteps={setCompletedSteps}
            campaign={campaign}
            adset={adset}
            ad={ad}
            campaignRef={campaignRef}
            adsetRef={adsetRef}
            adRef={adRef}
            loading={loading}
            success={success}
            mode={mode}
            onClose={onClose}
            handlePublish={handlePublish}
          />
        )}
      </div>
    </div>
  );
}

export default CreateAdsWizard;
