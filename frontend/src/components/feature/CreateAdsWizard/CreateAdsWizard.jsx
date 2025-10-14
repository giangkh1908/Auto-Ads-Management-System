import { useState, useEffect, useRef } from "react";
import {
  Megaphone,
  ArrowRight,
} from "lucide-react";
import CampaignStep from "./CampaignStep";
import AdsetStep from "./AdsetStep";
import AdStep from "./AdStep";
import Creative from "./Creative";
import "./CreateAdsWizard.css";
import shopService from "../../../services/shopService";
import {
  publishAdsWizard,
  updateAdsWizard,
} from "../../../services/adsWizardService";

function CreateAdsWizard({
  onClose,
  mode = "create",
  editingItem = null, // { type, data }
  selectedCampaign: _selectedCampaign = null,
  selectedAdset: _selectedAdset = null,
  datasets = null,
  setDatasets: _setDatasets = null,
  selectedAccountId = null,
}) {
  const [wizardStep, setWizardStep] = useState(0);
  const contentRef = useRef(null);
  const [facebookPages, setFacebookPages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // ========== Initial Data ==========
  const initialData = {
    campaign: {
      objective: "POST_ENGAGEMENT",
      name: "Chiến dịch mới",
      budgetType: "CAMPAIGN",
      facebookPage: "Fchat.vn",
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

  // ========== Prefill khi edit ==========
  useEffect(() => {
    if (mode === "edit" && editingItem?.data) {
      const data = editingItem.data;
      if (editingItem.type === "campaign") setCampaign((prev) => ({ ...prev, ...data }));
      if (editingItem.type === "adset") setAdset((prev) => ({ ...prev, ...data }));
      if (editingItem.type === "ad") setAd((prev) => ({ ...prev, ...data }));
    }
  }, [mode, editingItem]);

  // ========== Load FB Pages ==========
  useEffect(() => {
    const loadPages = async () => {
      try {
        const res = await shopService.fetchFacebookPages();
        const pages = res?.data?.pages || [];
        setFacebookPages(
          pages.map((p) => ({
            id: p.id,
            name: p.name,
            avatar:
              p.picture || `https://graph.facebook.com/${p.id}/picture?type=square`,
          }))
        );
      } catch (e) {
        console.error("Failed to load facebook pages", e);
      }
    };
    loadPages();
  }, []);

  // ========== Scroll khi đổi bước ==========
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [wizardStep]);

  // ========== Xây payload gửi API ==========
  const buildPayload = () => {
    const access_token = localStorage.getItem("fb_access_token") || null;
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
      },
      OUTCOME_ENGAGEMENT: {
        optimization_goal: "POST_ENGAGEMENT",
        billing_event: "IMPRESSIONS",
      },
      OUTCOME_TRAFFIC: {
        optimization_goal: "LINK_CLICKS",
        billing_event: "IMPRESSIONS",
      },
      OUTCOME_LEADS: {
        optimization_goal: "LEAD_GENERATION",
        billing_event: "IMPRESSIONS",
      },
      OUTCOME_SALES: {
        optimization_goal: "CONVERSIONS",
        billing_event: "IMPRESSIONS",
      },
    };

    const fbObjective =
      fbObjectiveMap[campaign.objective] || "OUTCOME_ENGAGEMENT";

    const adsetDefaults = fbAdsetDefaultsByObjective[fbObjective] || {
      optimization_goal: "REACH",
      billing_event: "IMPRESSIONS",
    };

    const fbBidStrategyByObjective = {
      OUTCOME_AWARENESS: "LOWEST_COST_WITHOUT_CAP",
      OUTCOME_ENGAGEMENT: "LOWEST_COST_WITHOUT_CAP",
      OUTCOME_TRAFFIC: "LOWEST_COST_WITHOUT_CAP",
      OUTCOME_LEADS: "LOWEST_COST_WITHOUT_CAP",
      OUTCOME_SALES: "LOWEST_COST_WITHOUT_CAP",
    };

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
      ad_account_id: selectedAccountId || localStorage.getItem("selectedAdAccount") || "act_1234567890",

      // ✅ Kèm ID để update đúng bản ghi trong DB và Facebook
      campaign: {
        draftId: editingItem?.data?._id || null,
        external_id: editingItem?.data?.external_id || null,
        name: campaign.name,
        objective: fbObjective,
        status: "PAUSED",
        special_ad_categories: ["NONE"],
      },

      adset: {
        draftId:
          _selectedAdset?._id ||
          editingItem?.data?.adset?._id ||
          datasets?.adsets?.find(a => a.campaignId === editingItem?.data?._id)?._id ||
          null,
        external_id:
          _selectedAdset?.external_id ||
          editingItem?.data?.adset?.external_id ||
          datasets?.adsets?.find(a => a.campaignId === editingItem?.data?._id)?.external_id ||
          null,
        name: adset.name,
        daily_budget: adset.budgetAmount || 2000000,
        status: "PAUSED",
        ...adsetDefaults,
        bid_strategy: "LOWEST_COST_WITHOUT_CAP",
        bid_amount: null,
        targeting: {
          age_min: adset.targeting.ageMin || 18,
          age_max: adset.targeting.ageMax || 45,
          geo_locations: { countries: ["VN"] },
          targeting_automation: {
            advantage_audience: 0, // ✅ BẮT BUỘC - disable Advantage Audience
          },
        },
      },

      creative: {
        draftId: editingItem?.data?.creative?._id || null,
        external_id: editingItem?.data?.creative?.external_id || null,
        ...creative,
      },

      ad: {
        draftId:
          editingItem?.data?.ad?._id ||
          datasets?.ads?.find(a => a.adsetId === _selectedAdset?._id)?._id ||
          null,
        external_id:
          editingItem?.data?.ad?.external_id ||
          datasets?.ads?.find(a => a.adsetId === _selectedAdset?._id)?.external_id ||
          null,
        name: ad.name,
        status: "PAUSED",
      },
    };

  };

  // ========== Gọi API tạo / cập nhật quảng cáo ==========
  const handlePublish = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const payload = buildPayload();

      let result;
      if (mode === "edit") {
        console.log("🛠 Gửi yêu cầu cập nhật Wizard:", payload);
        result = await updateAdsWizard(payload);
      } else {
        console.log("🚀 Gửi yêu cầu tạo mới Wizard:", payload);
        result = await publishAdsWizard(payload);
      }

      console.log("✅ Thành công:", result);
      setSuccess(true);
      setTimeout(() => {
        setLoading(false);
        onClose?.();
      }, 1200);
    } catch (err) {
      console.error("❌ Lỗi khi xử lý quảng cáo:", err);
      setLoading(false);
      setError(err.message || "Không thể xử lý quảng cáo");
    }
  };

  // ========== Render Wizard ==========
  return (
    <div className="ads-modal-overlay" role="dialog" aria-modal="true">
      <div className="ads-modal">
        {/* Header */}
        <div className="ads-modal-header">
          <div className="ads-modal-title">
            {mode === "edit"
              ? "Chỉnh sửa quảng cáo"
              : "Tạo chiến dịch quảng cáo mới"}
          </div>
        </div>

        {/* Body */}
        <div className="ads-modal-body">
          <div className="wizard-content" ref={contentRef}>
            {wizardStep === 0 && (
              <div className="panel objectives-panel">
                <h3 className="text-center text-lg font-semibold my-4">
                  Chọn mục tiêu chiến dịch
                </h3>
                <div className="objectives-list">
                  {Object.entries({
                    AWARENESS: "Nhận biết thương hiệu",
                    TRAFFIC: "Lưu lượng truy cập",
                    ENGAGEMENT: "Tương tác",
                    LEADS: "Khách hàng tiềm năng",
                    SALES: "Doanh số",
                  }).map(([key, label]) => (
                    <div
                      key={key}
                      className={`objective-item ${campaign.objective === key ? "selected" : ""
                        }`}
                      onClick={() =>
                        setCampaign((prev) => ({ ...prev, objective: key }))
                      }
                    >
                      <Megaphone size={18} />
                      <span>{label}</span>
                      {campaign.objective === key && (
                        <ArrowRight size={16} color="#2563eb" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {wizardStep === 1 && (
              <CampaignStep
                campaign={campaign}
                setCampaign={setCampaign}
                facebookPages={facebookPages}
              />
            )}
            {wizardStep === 2 && (
              <AdsetStep adset={adset} setAdset={setAdset} mode={mode} />
            )}
            {wizardStep === 3 && (
              <AdStep ad={ad} setAd={setAd} campaign={campaign} mode={mode} />
            )}
            {wizardStep === 4 && (
              <Creative ad={ad} campaign={campaign} adset={adset} />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="ads-modal-footer">
          {wizardStep < 4 ? (
            <>
              <button className="btn-secondary" onClick={onClose}>
                Đóng
              </button>
              <div className="spacer" />
              {wizardStep > 0 && (
                <button
                  className="btn-secondary"
                  onClick={() =>
                    setWizardStep((prev) => Math.max(0, prev - 1))
                  }
                >
                  Quay lại
                </button>
              )}
              <button
                className="btn-primary"
                onClick={() => setWizardStep((prev) => prev + 1)}
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
              <button
                className={`btn-post ${loading ? "loading" : ""}`}
                onClick={handlePublish}
                disabled={loading}
              >
                {loading
                  ? mode === "edit"
                    ? "Đang cập nhật..."
                    : "Đang đăng..."
                  : success
                    ? mode === "edit"
                      ? "Đã cập nhật thành công!"
                      : "Đã đăng thành công!"
                    : mode === "edit"
                      ? "Cập nhật quảng cáo"
                      : "Đăng quảng cáo"}
              </button>
            </>
          )}
        </div>

        {error && <div className="publish-error text-center">{error}</div>}
      </div>
    </div>
  );
}

export default CreateAdsWizard;
