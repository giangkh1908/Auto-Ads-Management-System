import { useState, useEffect, useRef, useCallback } from "react";
import AdsDropdown from "../../common/AdsDropdown/AdsDropdown.jsx";
import {
  Megaphone,
  ArrowRight,
  MessageCircle,
  Search,
  Users,
  ShoppingBag,
  Folder,
  Grid,
  FileText,
} from "lucide-react";
import CampaignStep from "./CampaignStep";
import AdsetStep from "./AdsetStep";
import AdStep from "./AdStep";
import Creative from "./Creative";
import "./CreateAdsWizard.css";
import profileService from "../../../services/profileService";
import { publishAdsWizard, updateAdsWizard } from "../../../services/adsWizardService";
import { useToast } from "../../../hooks/useToast";

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
    if (typeof value === 'string') {
      const match = value.match(/[0-9a-fA-F]{24}/);
      return match ? match[0] : null;
    }
    if (value.$oid) return value.$oid; // trong trường hợp Mongo xuất ra kiểu { $oid: '...' }
    return value.toString();
  }
  
  // Helper function để tìm ID trong object
  const findIdInObject = useCallback((obj) => {
    if (!obj || typeof obj !== 'object') return null;
    
    // Danh sách các trường có thể chứa ID
    const idFields = [
      'id', '_id', 'campaign_id', 'adset_id', 'ad_id', 'creative_id', 'set_id',
      'campaignId', 'adsetId', 'adId', 'creativeId', 'setId'
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
      if (obj[key] && typeof obj[key] === 'object') {
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
  
  // State để quản lý dropdown trong Left Panel
  const [openDropdown, setOpenDropdown] = useState({
    campaign: false,
    adset: false,
    ad: false,
  });

  //Objectives data with descriptions and suitable tags
  // const objectivesData = {
  //   AWARENESS: {
  //     title: "Mức độ nhận biết",
  //     description:
  //       "Hiển thị quảng cáo cho những người có nhiều khả năng nhớ đến quảng cáo nhất",
  //     suitableTags: [
  //       "Số người tiếp cận",
  //       "Mức độ nhận biết thương hiệu",
  //       "Lượt xem video",
  //       "Mức độ nhận biết về vị trí của hàng",
  //     ],
  //   },
  //   TRAFFIC: {
  //     title: "Lưu lượng truy cập",
  //     description:
  //       "Chuyển mọi người tới một đích đến nào đó, chẳng hạn như trang web, ứng dụng, trang cá nhân Instagram hoặc sự kiện trên Facebook",
  //     suitableTags: [
  //       "Lượt click vào liên kết",
  //       "Lượt xem trang đích",
  //       "Lượt truy cập vào trang cá nhân Instagram",
  //       "Messenger, Instagram và WhatsApp",
  //       "Cuộc gọi",
  //     ],
  //   },
  //   ENGAGEMENT: {
  //     title: "Lượt tương tác",
  //     description:
  //       "Tăng số tin nhắn, lượt mua qua tin nhắn, lượt xem video, lượt tương tác với bài viết, lượt thích Trang hoặc lượt phản hồi sự kiện",
  //     suitableTags: [
  //       "Messenger, Instagram và WhatsApp",
  //       "Lượt xem video",
  //       "Lượt tương tác với bài viết",
  //       "Lượt chuyển đổi",
  //       "Cuộc gọi",
  //     ],
  //   },
  //   LEADS: {
  //     title: "Khách hàng tiềm năng",
  //     description:
  //       "Tìm kiếm khách hàng tiềm năng cho doanh nghiệp hoặc thương hiệu của bạn",
  //     suitableTags: [
  //       "Trang web và mẫu phản hồi tức thì",
  //       "Mẫu phản hồi tức thì",
  //       "Messenger, Instagram và WhatsApp",
  //       "Lượt chuyển dổi    ",
  //       "Cuộc gọi",
  //     ],
  //   },
  //   APP_PROMOTION: {
  //     title: "Quảng cáo ứng dụng",
  //     description:
  //       "Thu hút những người mới cài đặt và tiếp tục sử dụng ứng dụng của bạnbạn",
  //     suitableTags: ["Lượt cài đặt ứng dụng", "Sự kiện trong ứng dụng"],
  //   },
  //   SALES: {
  //     title: "Doanh số",
  //     description:
  //       "Tìm những người có khả năng sẽ mua sản phẩm hoặc dịch vụ của bạn",
  //     suitableTags: [
  //       "Lượt chuyển đổi",
  //       "Doanh số theo danh mục",
  //       "Messenger, Instagram và WhatsApp",
  //       "Cuộc gọi",
  //     ],
  //   },
  // };

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
          },
          ad: {
            name: "Quảng cáo mới",
            page: "Fchat.vn",
            media: "image",
      mediaUrl: "",
            primaryText: "Hãy giới thiệu về nội dung quảng cáo của bạn",
            headline: "Chat trong Messenger",
      description: "Khám phá dịch vụ của chúng tôi ngay!",
            cta: "Gửi tin nhắn",
      destinationUrl: "https://fchat.vn",
    },
  };

  const [campaign, setCampaign] = useState(initialData.campaign);
  const [adset, setAdset] = useState(initialData.adset);
  const [ad, setAd] = useState(initialData.ad);

  // 🟢 Định nghĩa các hàm xử lý (ở đây bạn có thể gọi API, mở modal, v.v.)
  const onCopy = () => {
    console.log("Copy campaign:", campaign.id);
    // Gọi API copy campaign hoặc clone logic tại đây
  };

  const onDelete = () => {
    console.log("Delete campaign:", campaign.id);
    // Gọi API xóa campaign tại đây
  };

  // ========== Tạo nhóm quảng cáo ==========
  const createAdset = () => {
    console.log("Tạo ad set mới cho campaign:", campaign.id);
    // Mở dropdown của campaign và chuyển đến step 2
    setOpenDropdown({
      campaign: true,
      adset: false,
      ad: false,
    });
    setWizardStep(2);
  };

  // ========== Tạo quảng cáo ==========
  const createAd = () => {
    console.log("Tạo ad mới cho ad set:", adset.id);
    // Mở dropdown của adset và chuyển đến step 3
    setOpenDropdown({
      campaign: false,
      adset: true,
      ad: false,
    });
    setWizardStep(3);
  };

  // Function để đóng tất cả dropdown
  const closeAllDropdowns = () => {
    setOpenDropdown({
      campaign: false,
      adset: false,
      ad: false,
    });
  };
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
    // Đóng tất cả dropdown khi chuyển step
    closeAllDropdowns();
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
          toast.success("Tải danh sách Page...", {
            description: `Thành công!`
          });
        } else {
          toast.warning("Không có Page nào được kết nối", {
            description: "Vui lòng kết nối ít nhất một Page trước khi tạo quảng cáo"
          });
        }
      } catch (e) {
        // silent fail; selection will just be empty
        console.log("Failed to load connected facebook pages", e);
        toast.error("Không tải được danh sách Page", {
          description: "Vui lòng kiểm tra kết nối mạng và thử lại"
        });
      }
    };
    loadPages();
  }, [toast]);

  // Load data for update/edit mode - Load từ database thay vì Facebook API
  useEffect(() => {
    const loadUpdateData = async () => {
      // console.log("🔍 Debug props:", { mode, editingItem, selectedAccountId });
      
      if ((mode !== "update" && mode !== "edit") || !editingItem || !selectedAccountId) {
        console.log("🔍 Early return:", { 
          mode, 
          hasEditingItem: !!editingItem, 
          hasSelectedAccountId: !!selectedAccountId 
        });
        return;
      }
      
      // Tìm ID trong các trường có thể có
      let rawItemId = editingItem.id || 
                     editingItem._id || 
                     editingItem.campaign_id || 
                     editingItem.adset_id || 
                     editingItem.ad_id ||
                     editingItem.creative_id ||
                     editingItem.set_id;
      
      // Nếu không tìm thấy ID, thử tìm trong toàn bộ object
      if (!rawItemId) {
        rawItemId = findIdInObject(editingItem);
      }

      //Mã hóa id từ ObjectId
      const itemId = extractObjectId(rawItemId);
      
      setLoading(true);
      toast.info("Vui lòng chờ", {
        description: "Đang tải dữ liệu ..."
      });
      try {
        const token =
          localStorage.getItem("accessToken") ||
          localStorage.getItem("auth_token") ||
          localStorage.getItem("token");
        if (!token) return;

        const headers = { Authorization: `Bearer ${token}` };
        const API_BASE = "http://localhost:5001/api";

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
  
          const adsetRes = await fetch(
            `${API_BASE}/adsets/database?adset_id=${itemId}`,
            { headers }
          );
          const adsetJson = await adsetRes.json();
          console.log("📋 Adset response:", adsetJson);
          adsetData = adsetJson.data;
          campaignId = adsetData?.campaign_id;
        } else if (editingItem.type === "ad") {
          // Nếu edit ad, tìm campaign ID từ ad
          console.log("🔍 Fetching ad data for ID:", itemId);
          const adRes = await fetch(
            `${API_BASE}/ads/database?ad_id=${itemId}`,
            { headers }
          );
          const adJson = await adRes.json();
          console.log("📋 Ad response:", adJson);
          adData = adJson.data;
          
          // Ad không có campaign_id trực tiếp, cần tìm qua set_id
          if (adData && adData.set_id) {
            console.log("🔍 Ad không có campaign_id, tìm qua set_id:", adData.set_id);
            const adsetRes = await fetch(
              `${API_BASE}/adsets/database?adset_id=${adData.set_id}`,
              { headers }
            );
            const adsetJson = await adsetRes.json();
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
        const campaignRes = await fetch(
          `${API_BASE}/campaigns/database?campaign_id=${campaignId}`,
          { headers }
        );
        const campaignJson = await campaignRes.json();
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
          const adsetsRes = await fetch(
            `${API_BASE}/adsets/database?campaign_id=${campaignId}`,
            { headers }
          );
          const adsetsJson = await adsetsRes.json();
          const adsetsData = adsetsJson.data || [];
          adsetData = editingItem.type === "adset" 
            ? adsetsData.find(adset => adset._id === itemId) || adsetsData[0]
            : adsetsData[0];
        }

        if (adsetData) {
          setAdset({
            id: adsetData._id,
            external_id: adsetData.external_id,
            name: adsetData.name || "Nhóm quảng cáo mới",
            budgetType: adsetData.daily_budget ? "daily" : "lifetime",
            budgetAmount: adsetData.daily_budget || adsetData.lifetime_budget || 2000000,
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
              ageMax: 45,
            },
            optimization_goal: adsetData.optimization_goal,
            billing_event: adsetData.billing_event,
            bid_strategy: adsetData.bid_strategy,
            bid_amount: adsetData.bid_amount,
          });
        }

        // Fetch ad data từ database
        if (!adData) {
          const adsRes = await fetch(
            `${API_BASE}/ads/database?campaign_id=${campaignId}`,
            { headers }
          );
          const adsJson = await adsRes.json();
          const adsData = adsJson.data || [];
          adData = editingItem.type === "ad" 
            ? adsData.find(ad => ad._id === itemId) || adsData[0]
            : adsData[0];
        }

        if (adData) {
          // Fetch creative data từ database
          if (adData.creative_id) {
            const creativeRes = await fetch(
              `${API_BASE}/creatives/database?creative_id=${adData.creative_id}`,
              { headers }
            );
            const creativeJson = await creativeRes.json();
            creativeData = creativeJson.data;
          }

          setAd({
            id: adData._id,
            external_id: adData.external_id,
            name: adData.name || "Quảng cáo mới",
            page: campaignData?.page_name || "Facebook Page",
            media: creativeData?.object_story_spec?.link_data?.picture ? "image" : "text",
            mediaUrl: creativeData?.object_story_spec?.link_data?.picture || null,
            primaryText: creativeData?.object_story_spec?.link_data?.message || "Hãy giới thiệu về nội dung quảng cáo của bạn",
            headline: creativeData?.object_story_spec?.link_data?.name || "Chat trong Messenger",
            description: creativeData?.object_story_spec?.link_data?.description || "Khám phá dịch vụ của chúng tôi ngay!",
            cta: creativeData?.object_story_spec?.link_data?.call_to_action?.type || "Gửi tin nhắn",
            destinationUrl: creativeData?.object_story_spec?.link_data?.link || "https://fchat.vn",
            creative_id: adData.creative_id,
          });
        }
        
        // Show success toast for loading data
        toast.success("Đã xong!", {
          description: `Tải thành công dữ liệu`
        });
      } catch (e) {
        console.log("Failed to load update data from database:", e);
        toast.error("Không tải được dữ liệu", {
          description: "Vui lòng thử lại hoặc kiểm tra kết nối mạng"
        });
      } finally {
        setLoading(false);
      }
    };
    loadUpdateData();
  }, [mode, editingItem, selectedAccountId, toast, findIdInObject]);

  // ========== Prefill khi edit (đã được thay thế bằng loadUpdateData) ==========
  // Logic cũ đã được loại bỏ để sử dụng dữ liệu từ database thay vì data tĩnh

  // Set initial wizard step based on editingItem
  useEffect(() => {
    if ((mode === "edit" || mode === "update") && editingItem) {
      // Trong update mode, luôn bắt đầu từ step 1 để hiển thị tất cả 4 steps
      if (mode === "update") {
        setWizardStep(1);
      } else if (mode === "edit") {
        if (editingItem.type === "campaign") {
          setWizardStep(1);
        } else if (editingItem.type === "adset") {
          setWizardStep(2);
        } else if (editingItem.type === "ad") {
          setWizardStep(3);
        }
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

    // const fbBidStrategyByObjective = {
    //   OUTCOME_AWARENESS: "LOWEST_COST_WITHOUT_CAP",
    //   OUTCOME_ENGAGEMENT: "LOWEST_COST_WITHOUT_CAP",
    //   OUTCOME_TRAFFIC: "LOWEST_COST_WITHOUT_CAP",
    //   OUTCOME_LEADS: "LOWEST_COST_WITHOUT_CAP",
    //   OUTCOME_SALES: "LOWEST_COST_WITHOUT_CAP",
    // };

    if (!campaign.facebookPageId) {
      toast.warning("Thiếu thông tin Facebook Page", {
        description: "Vui lòng chọn trang Facebook trước khi tạo quảng cáo"
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
      ad_account_id: selectedAccountId || localStorage.getItem("selectedAdAccount"),
      // Kèm ID để update đúng bản ghi trong DB và Facebook
      campaign: {
        draftId: campaign.id || editingItem?.data?._id || null,
        external_id: campaign.external_id || editingItem?.data?.external_id || null,
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
        daily_budget: adset.budgetAmount || 2000000,
        status: "PAUSED",
        ...adsetDefaults,
        targeting: {
          age_min: adset.targeting.ageMin || 18,
          age_max: adset.targeting.ageMax || 45,
          geo_locations: { countries: ["VN"] },
          targeting_automation: {
            advantage_audience: 0, // 0 = tắt Advantage Audience, 1 = bật
          },
        },
        // Thêm start_time và end_time để tránh lỗi
        start_time: adset.schedule?.start ? new Date(adset.schedule.start).toISOString() : new Date().toISOString(),
        end_time: adset.schedule?.end ? new Date(adset.schedule.end).toISOString() : null,
        optimization_goal: adset.optimization_goal,
        billing_event: adset.billing_event,
        bid_strategy: adset.bid_strategy,
        bid_amount: adset.bid_amount,
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
    
    // Show loading toast
    toast.info("Đang tạo quảng cáo...", {
      description: "Vui lòng chờ trong giây lát"
    });
    
    try {
      const payload = buildPayload();
      
      // Validate ad_account_id
      if (!payload.ad_account_id) {
        toast.warning("Thiếu thông tin tài khoản quảng cáo", {
          description: "Vui lòng chọn tài khoản quảng cáo hợp lệ"
        });
        throw new Error("Thiếu ad_account_id hoặc access_token.");
      }

      let result;
      if (mode === "edit") {
        console.log("🛠 Gửi yêu cầu cập nhật Wizard:", payload);
        toast.info("Đang cập nhật quảng cáo...", {
          description: "Đang đồng bộ dữ liệu với Facebook"
        });
        result = await updateAdsWizard(payload);
      } else {
        console.log("🚀 Gửi yêu cầu tạo mới Wizard:", payload);
        toast.info("Đang tạo quảng cáo mới...", {
          description: "Đang tạo campaign, adset, creative và ad"
        });
        result = await publishAdsWizard(payload);
      }

      console.log("✅ Thành công:", result);
      setSuccess(true);
      
      // Show success toast
      if (mode === "edit") {
        toast.success("Cập nhật quảng cáo thành công!", {
          description: "Quảng cáo đã được cập nhật trên Facebook"
        });
      } else {
        toast.success("Tạo quảng cáo thành công!", {
          // description: ""
        });
      }
      
      setTimeout(() => {
        setLoading(false);
        onSuccess?.(); // Call refresh callback
        onClose?.();
      }, 1200);
    } catch (err) {
      console.error("❌ Lỗi khi xử lý quảng cáo:", err);
      setLoading(false);
      setError(err.message || "Không thể xử lý quảng cáo");
      
      // Show error toast based on error type
      let errorMessage = "Không thể xử lý quảng cáo";
      let errorDescription = "Vui lòng thử lại sau";
      
      if (err.message) {
        if (err.message.includes("facebookPageId")) {
          errorMessage = "Thiếu thông tin Facebook Page";
          errorDescription = "Vui lòng chọn trang Facebook trước khi tạo quảng cáo";
          toast.warning(errorMessage, { description: errorDescription });
        } else if (err.message.includes("ad_account_id")) {
          errorMessage = "Thiếu thông tin tài khoản quảng cáo";
          errorDescription = "Vui lòng chọn tài khoản quảng cáo hợp lệ";
          toast.warning(errorMessage, { description: errorDescription });
        } else if (err.message.includes("Bad signature") || err.message.includes("190")) {
          errorMessage = "Lỗi xác thực Facebook";
          errorDescription = "Token Facebook không hợp lệ hoặc đã hết hạn";
          toast.error(errorMessage, { description: errorDescription });
        } else if (err.message.includes("Invalid parameter") || err.message.includes("100")) {
          errorMessage = "Tham số không hợp lệ";
          errorDescription = "Vui lòng kiểm tra lại thông tin nhập vào";
          toast.warning(errorMessage, { description: errorDescription });
        } else if (err.message.includes("bid") || err.message.includes("2490487")) {
          errorMessage = "Thiếu thông tin giá thầu";
          errorDescription = "Đã cấu hình chiến lược giá thầu LOWEST_COST_WITH_BID_CAP với bid_amount = 1000 VND";
          toast.warning(errorMessage, { description: errorDescription });
        } else {
          toast.error(errorMessage, { description: err.message });
        }
      } else {
        toast.error(errorMessage, { description: errorDescription });
      }
    }
  };

  return (
    <div className="ads-modal-overlay" role="dialog" aria-modal="true">
      <div className="ads-modal">
        <div className="ads-modal-header">
          <div className="ads-modal-title">
            {mode === "edit" || mode === "update"
              ? `Chỉnh sửa ${
                  editingItem?.type === "campaign"
                    ? "chiến dịch"
                    : editingItem?.type === "adset"
                    ? "nhóm quảng cáo"
                    : "quảng cáo"
                }`
              : "Tạo chiến dịch"}
          </div>
          {/* <button className="ads-modal-close" onClick={onClose}>✕</button> */}
        </div>

        <div className="ads-modal-body">
          {/* Unified Left Panel - Campaign Hierarchy (hidden for step 0) */}
          {wizardStep > 0 && (
            <div className="wizard-sidebar">
              <div className="hierarchy-container">
                <div className="hierarchy-list">
                  <div
                    className={`hierarchy-item campaign-item ${
                      wizardStep === 1
                        ? "current"
                        : wizardStep > 1
                        ? "completed"
                        : ""
                    }`}
                    onClick={() => setWizardStep(1)}
                  >
                    <div className="hierarchy-icon">
                      <Folder size={16} />
                    </div>
                    <div className="hierarchy-content">
                      <div className="hierarchy-label">Chiến dịch</div>
                      <div className="hierarchy-name">{campaign.name}</div>
                    </div>
                    <div
                      className="hierarchy-status-actions"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="hierarchy-status">
                        {wizardStep > 1 ? "✓" : wizardStep === 1 ? "●" : ""}
                      </div>
                      {/* Dropdown cho campaign */}
                      {/* Campaign */}
                      <AdsDropdown
                        onCopy={onCopy}
                        onDelete={onDelete}
                        onCreateAdset={createAdset}
                        isOpen={openDropdown.campaign}
                        onClose={() =>
                          setOpenDropdown((prev) => ({
                            ...prev,
                            campaign: false,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div
                    className={`hierarchy-item adset-item ${
                      wizardStep === 2
                        ? "current"
                        : wizardStep > 2
                        ? "completed"
                        : ""
                    }`}
                    onClick={() => setWizardStep(2)}
                  >
                    <div className="hierarchy-icon">
                      <Grid size={16} />
                    </div>
                    <div className="hierarchy-content">
                      <div className="hierarchy-label">Nhóm quảng cáo</div>
                      <div className="hierarchy-name">{adset.name}</div>
                    </div>
                    <div
                      className="hierarchy-status-actions"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="hierarchy-status">
                        {wizardStep > 2 ? "✓" : wizardStep === 2 ? "●" : ""}
                      </div>
                      {/* Dropdown cho adset */}
                      {/* Adset */}
                      <AdsDropdown
                        onCopy={onCopy}
                        onDelete={onDelete}
                        onCreateAd={createAd}
                        isOpen={openDropdown.adset}
                        onClose={() =>
                          setOpenDropdown((prev) => ({ ...prev, adset: false }))
                        }
                      />
                    </div>
                  </div>

                  <div
                    className={`hierarchy-item ad-item ${
                      wizardStep === 3
                        ? "current"
                        : wizardStep > 3
                        ? "completed"
                        : ""
                    }`}
                    onClick={() => setWizardStep(3)}
                  >
                    <div className="hierarchy-icon">
                      <FileText size={16} />
                    </div>
                    <div className="hierarchy-content">
                      <div className="hierarchy-label">Quảng cáo</div>
                      <div className="hierarchy-name">{ad.name}</div>
                    </div>
                    <div
                      className="hierarchy-status-actions"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="hierarchy-status">
                        {wizardStep > 3 ? "✓" : wizardStep === 3 ? "●" : ""}
                      </div>
                      {/* Dropdown cho ad */}
                      {/* Ad */}
                      <AdsDropdown onCopy={onCopy} onDelete={onDelete} />
                    </div>
                  </div>

                  <div
                    className={`hierarchy-item creative-item ${
                      wizardStep === 4 ? "current" : ""
                    }`}
                    onClick={() => setWizardStep(4)}
                  >
                    <div className="hierarchy-icon">
                      <FileText size={16} />
                    </div>
                    <div className="hierarchy-content">
                      <div className="hierarchy-label">Xem trước</div>
                      <div className="hierarchy-name">Creative Preview</div>
                    </div>
                    <div
                      className="hierarchy-status-actions"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="hierarchy-status">
                        {wizardStep === 4 ? "●" : ""}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="wizard-content" ref={contentRef}>
            {wizardStep === 0 && (
              <div className="panel objectives-panel">
                <div className="objectives-layout">
                  {/* Left Panel - Objectives List */}
                  <div className="objectives-sidebar">
                    <div className="objectives-title">
                      Chọn mục tiêu chiến dịch
                    </div>
                    <div className="objectives-list">
                      {[
                        {
                          key: "AWARENESS",
                          icon: <Megaphone size={16} />,
                          label: "Nhận biết thương hiệu",
                        },
                        {
                          key: "TRAFFIC",
                          icon: <ArrowRight size={16} />,
                          label: "Lưu lượng truy cập",
                        },
                        {
                          key: "ENGAGEMENT",
                          icon: <MessageCircle size={16} />,
                          label: "Tương tác",
                        },
                        {
                          key: "LEADS",
                          icon: <Search size={16} />,
                          label: "Khách hàng tiềm năng",
                        },
                        {
                          key: "APP_PROMOTION",
                          icon: <Users size={16} />,
                          label: "Quảng bá ứng dụng",
                        },
                        {
                          key: "SALES",
                          icon: <ShoppingBag size={16} />,
                          label: "Doanh số",
                        },
                      ].map((item) => (
                        <label
                          key={item.key}
                          className={`objective-item ${
                            campaign.objective === item.key ? "selected" : ""
                          }`}
                        >
                          <input
                            type="radio"
                            name="objective"
                            value={item.key}
                            checked={campaign.objective === item.key}
                            onChange={(e) =>
                              setCampaign((prev) => ({
                                ...prev,
                                objective: e.target.value,
                              }))
                            }
                          />
                          <div className="objective-icon">{item.icon}</div>
                          <div className="objective-label">
                            <span className="objective-name">{item.label}</span>
                            {item.key === "ENGAGEMENT" && (
                              <span className="recommended-tag">Đề xuất</span>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Right Panel - Objective Details */}
                  <div className="objective-details">
                    <div className="objective-image-placeholder">
                      <div className="placeholder-circle"></div>
                    </div>
                    <div className="objective-detail-title">
                      {{
                        AWARENESS: "Nhận biết thương hiệu",
                        TRAFFIC: "Lưu lượng truy cập",
                        ENGAGEMENT: "Tương tác",
                        LEADS: "Khách hàng tiềm năng",
                        APP_PROMOTION: "Quảng bá ứng dụng",
                        SALES: "Doanh số",
                      }[campaign.objective] || "Chọn mục tiêu"}
                    </div>
                    <div className="objective-description">
                      {{
                        AWARENESS:
                          "Tăng mức độ nhận biết thương hiệu hoặc sản phẩm của bạn.",
                        TRAFFIC:
                          "Tăng lượng truy cập vào website, app hoặc trang đích.",
                        ENGAGEMENT:
                          "Khuyến khích người dùng tương tác với bài viết, trang, hoặc tin nhắn.",
                        LEADS:
                          "Thu thập thông tin khách hàng tiềm năng qua form, tin nhắn hoặc gọi điện.",
                        APP_PROMOTION:
                          "Khuyến khích người dùng cài đặt hoặc tương tác với ứng dụng.",
                        SALES:
                          "Tăng doanh số thông qua website, app hoặc cửa hàng trực tuyến.",
                      }[campaign.objective] ||
                        "Hãy chọn một mục tiêu để xem mô tả chi tiết."}
                    </div>
                    <div className="suitable-for-section">
                      <div className="suitable-for-title">Phù hợp với</div>
                      <div className="suitable-tags">
                        {{
                          AWARENESS: [
                            "Doanh nghiệp mới",
                            "Thương hiệu cần lan tỏa",
                          ],
                          TRAFFIC: ["Website", "Landing page", "Ứng dụng"],
                          ENGAGEMENT: ["Fanpage", "Bài đăng", "Cộng đồng"],
                          LEADS: ["Form đăng ký", "Tin nhắn", "Tư vấn"],
                          APP_PROMOTION: [
                            "Nhà phát triển app",
                            "Công ty công nghệ",
                          ],
                          SALES: ["Thương mại điện tử", "Cửa hàng online"],
                        }[campaign.objective]?.map((tag, index) => (
                            <span key={index} className="suitable-tag">
                              {tag}
                            </span>
                        )) || <span className="suitable-tag">—</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Campaign Details Panel */}
            {wizardStep === 1 && (
              <CampaignStep
                campaign={campaign}
                setCampaign={setCampaign}
                facebookPages={facebookPages}
              />
            )}

            {/* Adset Details Panel */}
            {wizardStep === 2 && (
              <AdsetStep adset={adset} setAdset={setAdset} mode={mode} />
            )}

            {/* Ad Details Panel */}
            {wizardStep === 3 && (
              <AdStep ad={ad} setAd={setAd} mode={mode} campaign={campaign} />
            )}

            {/* Creative Preview Panel */}
            {wizardStep === 4 && (
              <Creative ad={ad} campaign={campaign} adset={adset} />
            )}
          </div>
        </div>

        {/* Wizard Footer */}
        <div className="ads-modal-footer">
          {wizardStep === 0 ? (
            <>
              <button className="btn-secondary" onClick={onClose}>
                Hủy
              </button>
              <div className="spacer" />
              <button
                className="btn-primary"
                onClick={() => setWizardStep((prev) => Math.min(3, prev + 1))}
              >
                Tiếp tục
              </button>
            </>
          ) : (
            <>
              <button className="btn-secondary" onClick={onClose}>
                Đóng
              </button>
              <div className="spacer" />
              {wizardStep > 0 && (
                <button
                  className="btn-secondary"
                  onClick={() => setWizardStep((prev) => Math.max(0, prev - 1))}
                >
                  Quay lại
                </button>
              )}
              {wizardStep < 3 && (
                <button
                  className="btn-primary"
                  onClick={() => setWizardStep((prev) => Math.min(4, prev + 1))}
                >
                  Tiếp tục
                </button>
              )}
              {wizardStep === 3 && (
                <button
                  className="btn-primary"
                  onClick={() => setWizardStep(4)}
                >
                  Xem trước
                </button>
              )}
              {wizardStep === 4 && (
                <>
                  <button
                    className="btn-post"
                    onClick={handlePublish}
                    disabled={loading}
                  >
                    {loading
                      ? "Đang xử lý..."
                      : success
                      ? "Thành công!"
                      : mode === "update"
                      ? "Cập nhật"
                      : "Đăng quảng cáo"}
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default CreateAdsWizard;
