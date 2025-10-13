import { useState, useEffect, useRef } from "react";
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
import shopService from "../../../services/shopService";

function CreateAdsWizard({ 
  onClose, 
  mode = "create", 
  editingItem = null, 
  selectedCampaign: _selectedCampaign = null, // eslint-disable-line no-unused-vars
  selectedAdset: _selectedAdset = null, // eslint-disable-line no-unused-vars
  datasets = null,
  setDatasets: _setDatasets = null // eslint-disable-line no-unused-vars
}) {
  const [wizardStep, setWizardStep] = useState(0);
  const contentRef = useRef(null);
  const [facebookPages, setFacebookPages] = useState([]);

  // Objectives data with descriptions and suitable tags
  const objectivesData = {
    AWARENESS: {
      title: "Mức độ nhận biết",
      description:
        "Hiển thị quảng cáo cho những người có nhiều khả năng nhớ đến quảng cáo nhất",
      suitableTags: [
        "Số người tiếp cận",
        "Mức độ nhận biết thương hiệu",
        "Lượt xem video",
        "Mức độ nhận biết về vị trí của hàng",
      ],
    },
    TRAFFIC: {
      title: "Lưu lượng truy cập",
      description:
        "Chuyển mọi người tới một đích đến nào đó, chẳng hạn như trang web, ứng dụng, trang cá nhân Instagram hoặc sự kiện trên Facebook",
      suitableTags: [
        "Lượt click vào liên kết",
        "Lượt xem trang đích",
        "Lượt truy cập vào trang cá nhân Instagram",
        "Messenger, Instagram và WhatsApp",
        "Cuộc gọi",
      ],
    },
    ENGAGEMENT: {
      title: "Lượt tương tác",
      description:
        "Tăng số tin nhắn, lượt mua qua tin nhắn, lượt xem video, lượt tương tác với bài viết, lượt thích Trang hoặc lượt phản hồi sự kiện",
      suitableTags: [
        "Messenger, Instagram và WhatsApp",
        "Lượt xem video",
        "Lượt tương tác với bài viết",
        "Lượt chuyển đổi",
        "Cuộc gọi",
      ],
    },
    LEADS: {
      title: "Khách hàng tiềm năng",
      description:
        "Tìm kiếm khách hàng tiềm năng cho doanh nghiệp hoặc thương hiệu của bạn",
      suitableTags: [
        "Trang web và mẫu phản hồi tức thì",
        "Mẫu phản hồi tức thì",
        "Messenger, Instagram và WhatsApp",
        "Lượt chuyển dổi    ",
        "Cuộc gọi",
      ],
    },
    APP_PROMOTION: {
      title: "Quảng cáo ứng dụng",
      description:
        "Thu hút những người mới cài đặt và tiếp tục sử dụng ứng dụng của bạnbạn",
      suitableTags: ["Lượt cài đặt ứng dụng", "Sự kiện trong ứng dụng"],
    },
    SALES: {
      title: "Doanh số",
      description:
        "Tìm những người có khả năng sẽ mua sản phẩm hoặc dịch vụ của bạn",
      suitableTags: [
        "Lượt chuyển đổi",
        "Doanh số theo danh mục",
        "Messenger, Instagram và WhatsApp",
        "Cuộc gọi",
      ],
    },
  };

  // Initialize data based on mode and editingItem
  const getInitialData = () => {
    if (mode === "edit" && editingItem && datasets) {
      if (editingItem.type === "campaign") {
        const campaign = datasets.campaigns.find(c => c.id === editingItem.id);
        return {
          campaign: {
            id: campaign.id,
            objective: campaign.objective,
            name: campaign.name,
            budgetType: campaign.budgetType,
            facebookPage: campaign.facebookPage,
          },
          adset: {
            name: "Nhóm quảng cáo mới",
            schedule: { start: "", end: "" },
            budget: 2000000,
            placement: "AUTOMATIC",
            targeting: { location: "Việt Nam", ageMin: 18, ageMax: 45 },
          },
          ad: {
            name: "Quảng cáo mới",
            page: "Fchat.vn",
            media: "image",
            primaryText: "Hãy giới thiệu về nội dung quảng cáo của bạn",
            headline: "Chat trong Messenger",
            description: "Khám phá dịch vụ của chúng tôi và trải nghiệm những điều tuyệt vời nhất",
            cta: "Gửi tin nhắn",
            destinationUrl: "https://fchat.vn"
          }
        };
      } else if (editingItem.type === "adset") {
        const adset = datasets.adsets.find(a => a.id === editingItem.id);
        const campaign = datasets.campaigns.find(c => c.id === adset.campaignId);
        return {
          campaign: {
            id: campaign.id,
            objective: campaign.objective,
            name: campaign.name,
            budgetType: campaign.budgetType,
            facebookPage: campaign.facebookPage,
          },
          adset: {
            id: adset.id,
            name: adset.name,
            conversion: adset.conversion,
            performanceGoal: adset.performanceGoal,
            budgetType: adset.budgetType,
            budgetAmount: adset.budgetAmount,
            startDate: adset.startDate,
            endDate: adset.endDate,
            targeting: adset.targeting,
          },
          ad: {
            name: "Quảng cáo mới",
            page: "Fchat.vn",
            media: "image",
            primaryText: "Hãy giới thiệu về nội dung quảng cáo của bạn",
            headline: "Chat trong Messenger",
            description: "Khám phá dịch vụ của chúng tôi và trải nghiệm những điều tuyệt vời nhất",
            cta: "Gửi tin nhắn",
            destinationUrl: "https://fchat.vn"
          }
        };
      } else if (editingItem.type === "ad") {
        const ad = datasets.ads.find(a => a.id === editingItem.id);
        const adset = datasets.adsets.find(a => a.id === ad.adsetId);
        const campaign = datasets.campaigns.find(c => c.id === ad.campaignId);
        return {
          campaign: {
            id: campaign.id,
            objective: campaign.objective,
            name: campaign.name,
            budgetType: campaign.budgetType,
            facebookPage: campaign.facebookPage,
          },
          adset: {
            id: adset.id,
            name: adset.name,
            conversion: adset.conversion,
            performanceGoal: adset.performanceGoal,
            budgetType: adset.budgetType,
            budgetAmount: adset.budgetAmount,
            startDate: adset.startDate,
            endDate: adset.endDate,
            targeting: adset.targeting,
          },
          ad: {
            id: ad.id,
            name: ad.name,
            page: ad.facebookPage,
            media: ad.media,
            primaryText: ad.primaryText,
            headline: ad.headline,
            description: ad.description,
            cta: ad.cta,
            destinationUrl: ad.destinationUrl,
          }
        };
      }
    }
    
    // Default data for create mode
    return {
      campaign: {
        objective: "ENGAGEMENT",
        name: "Lead Mess Chatbot Fchat",
        budgetType: "CAMPAIGN",
        facebookPage: "Fchat.vn",
      },
      adset: {
        name: "Nhóm quảng cáo Lượt tương tác mới",
        schedule: { start: "", end: "" },
        budget: 2000000,
        placement: "AUTOMATIC",
        targeting: { location: "Việt Nam", ageMin: 18, ageMax: 45 },
      },
      ad: {
        name: "Quảng cáo Lượt tương tác mới",
        page: "Fchat.vn",
        media: "image",
        primaryText: "Hãy giới thiệu về nội dung quảng cáo của bạn",
        headline: "Chat trong Messenger",
        cta: "Gửi tin nhắn",
      }
    };
  };

  const initialData = getInitialData();
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

  const createAdset = () => {
    console.log("Tạo ad set mới cho campaign:", campaign.id);
    // Chuyển đến step 2 để tạo adset
    setWizardStep(2);
  };

  const createAd = () => {
    console.log("Tạo ad mới cho ad set:", adset.id);
    // Chuyển đến step 3 để tạo ad
    setWizardStep(3);
  };
  // Lock background scroll while wizard is open
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  // Load connected Facebook pages for selection
  useEffect(() => {
    const loadPages = async () => {
      try {
        const res = await shopService.fetchFacebookPages();
        const pages = res?.data?.pages || [];
        setFacebookPages(
          pages.map((p) => ({
            id: p.id,
            name: p.name,
            avatar: p.picture || `https://graph.facebook.com/${p.id}/picture?type=square`,
          }))
        );
      } catch (e) {
        // silent fail; selection will just be empty
        console.error("Failed to load facebook pages", e);
      }
    };
    loadPages();
  }, []);

  // Set initial wizard step based on editingItem
  useEffect(() => {
    if (mode === "edit" && editingItem) {
      if (editingItem.type === "campaign") {
        setWizardStep(1);
      } else if (editingItem.type === "adset") {
        setWizardStep(2);
      } else if (editingItem.type === "ad") {
        setWizardStep(3);
      }
    }
  }, [mode, editingItem]);

  // Scroll to top when wizard step changes
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }, [wizardStep]);

  return (
    <div className="ads-modal-overlay" role="dialog" aria-modal="true">
      <div className="ads-modal">
        <div className="ads-modal-header">
          <div className="ads-modal-title">
            {mode === "edit" 
              ? `Chỉnh sửa ${editingItem?.type === "campaign" ? "chiến dịch" : editingItem?.type === "adset" ? "nhóm quảng cáo" : "quảng cáo"}`
              : "Tạo chiến dịch"
            }
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
                      />
                    </div>
                  </div>

                  <div
                    className={`hierarchy-item ad-item ${
                      wizardStep === 3 ? "current" : wizardStep > 3 ? "completed" : ""
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
                        { key: "AWARENESS", icon: <Megaphone size={16} /> },
                        { key: "TRAFFIC", icon: <ArrowRight size={16} /> },
                        {
                          key: "ENGAGEMENT",
                          icon: <MessageCircle size={16} />,
                        },
                        { key: "LEADS", icon: <Search size={16} /> },
                        { key: "APP_PROMOTION", icon: <Users size={16} /> },
                        { key: "SALES", icon: <ShoppingBag size={16} /> },
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
                            <span className="objective-name">
                              {objectivesData[item.key].title}
                            </span>
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
                      {objectivesData[campaign.objective].title}
                    </div>
                    <div className="objective-description">
                      {objectivesData[campaign.objective].description}
                    </div>
                    <div className="suitable-for-section">
                      <div className="suitable-for-title">Phù hợp với</div>
                      <div className="suitable-tags">
                        {objectivesData[campaign.objective].suitableTags.map(
                          (tag, index) => (
                            <span key={index} className="suitable-tag">
                              {tag}
                            </span>
                          )
                        )}
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
            {wizardStep === 4 && <Creative ad={ad} campaign={campaign} adset={adset} />}
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
                <button className="btn-post" onClick={onClose}>Đăng</button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default CreateAdsWizard;