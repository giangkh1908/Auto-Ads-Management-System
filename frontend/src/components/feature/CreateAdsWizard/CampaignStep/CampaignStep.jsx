import { useState, useEffect, forwardRef, useImperativeHandle, useCallback } from "react";
import { Circle, DollarSign, Settings, Facebook, Edit2 } from "lucide-react";
import no_avatar from "../../../../assets/no-avatar.jpg";
import "./CampaignStep.css";
import { useToast } from "../../../../hooks/useToast";
import { validateNonEmpty } from "../../../../utils/validation";

function CampaignStepInner({ campaign, setCampaign, facebookPages = [] }, ref) {
  const [showPageSelect, setShowPageSelect] = useState(false);
  const toast = useToast();

  // Hàm xử lý tập trung khi chọn một Page
  const handlePageChange = useCallback((selectedPage) => {
    setCampaign((prevCampaign) => {
      // 1. Cập nhật thông tin Page ở cấp chiến dịch
      const updatedCampaign = {
        ...prevCampaign,
        facebookPage: selectedPage.name,
        facebookPageId: selectedPage.id,
        facebookPageAvatar: selectedPage.avatar,
      };

      // 2. Cập nhật `promoted_object` cho tất cả adset con và `page_id` cho ad con
      const updatedAdsets = updatedCampaign.adsets.map((adset) => {
        const newAdset = { ...adset };

        // Cập nhật adset nếu cần
        if (
          updatedCampaign.objective === "ENGAGEMENT" ||
          updatedCampaign.objective === "LEADS"
        ) {
          newAdset.promoted_object = {
            ...newAdset.promoted_object,
            page_id: selectedPage.id,
          };
        }

        // Cập nhật tất cả ad bên trong adset
        const updatedAds = newAdset.ads.map((ad) => ({
          ...ad,
          page_id: selectedPage.id,
          object_story_spec: {
            ...ad.object_story_spec,
            page_id: selectedPage.id,
          },
        }));
        newAdset.ads = updatedAds;

        return newAdset;
      });

      // 3. Trả về state cuối cùng
      return {
        ...updatedCampaign,
        adsets: updatedAdsets,
      };
    });

    // Ẩn dropdown sau khi chọn
    setShowPageSelect(false);
  }, [setCampaign]);

  useEffect(() => {
    // Tự động chọn page đầu tiên nếu chưa có page nào được chọn
    if (facebookPages.length > 0 && !campaign.facebookPageId) {
      handlePageChange(facebookPages[0]);
    }
    // Thêm campaign.objective vào dependency array để đảm bảo logic chạy đúng
    // khi objective thay đổi và component này vẫn được mount.
  }, [facebookPages, campaign.facebookPageId, campaign.objective, handlePageChange]);

  // This new useEffect ensures that if the objective changes AFTER a page has been selected,
  // the adsets' promoted_object is kept in sync with the selected page.
  // This prevents a mismatch where the adset is for ENGAGEMENT but its promoted_object
  // doesn't have the page_id set correctly.
  useEffect(() => {
    if (campaign.facebookPageId) {
      const needsPage = campaign.objective === "ENGAGEMENT" || campaign.objective === "LEADS";
      
      setCampaign(prev => {
        // Avoid unnecessary re-renders if the state is already correct
        const isAlreadySynced = prev.adsets.every(adset => 
          !needsPage || (adset.promoted_object && adset.promoted_object.page_id === prev.facebookPageId)
        );
        if (isAlreadySynced) return prev;

        const updatedAdsets = prev.adsets.map(adset => {
          if (needsPage) {
            return {
              ...adset,
              promoted_object: {
                ...adset.promoted_object,
                page_id: prev.facebookPageId,
              },
            };
          }
          return adset; // Return unchanged if objective doesn't need a page
        });

        return {
          ...prev,
          adsets: updatedAdsets,
        };
      });
    }
  }, [campaign.objective, campaign.facebookPageId, setCampaign]);

  // Expose validate() to parent (CreateAdsWizard)
  useImperativeHandle(ref, () => ({
    validate: () => {
      const okName = !!campaign?.name && String(campaign.name).trim() !== "";
      const okPage = !!campaign?.facebookPageId;
      if (!okName) validateNonEmpty(campaign.name, 'tên chiến dịch', toast);
      if (!okPage) toast.warning('Vui lòng chọn Trang Facebook');
      return okName && okPage;
    }
  }), [campaign, toast]);

  return (
    <div className="campaign-step">
      <div className="step-content">
        {/* Campaign Name Section */}
        <div className="config-section-ads">
          <div className="section-header-campaign">
            <Circle size={8} fill="#2563eb" color="#2563eb" />
            <h3 className="section-title-ads">Tên chiến dịch</h3>
          </div>
          <input
            type="text"
            className="campaign-name-input"
            value={campaign.name}
            onChange={(e) => setCampaign((prev) => ({ ...prev, name: e.target.value }))}
            onBlur={() => validateNonEmpty(campaign.name, 'tên chiến dịch', toast)}
            placeholder="Nhập tên chiến dịch"
          />
        </div>

        {/* Campaign Details Section */}
        <div className="config-section-ads">
          <div className="section-header-campaign">
            <Settings size={16} color="#2563eb" />
            <h3 className="section-title-ads">Chi tiết chiến dịch</h3>
          </div>
          <div className="section-content">
            <label className="field-label">Cách mua</label>
            <select className="conversion-select">
              <option value="Đấu giá">Đấu giá</option>
              <option value="Đặt trước">Đặt trước</option>
            </select>
          </div>
        </div>

        {/* Budget Section */}
        <div className="config-section-ads">
          <div className="section-header-campaign">
            <DollarSign size={16} color="#2563eb" />
            <h3 className="section-title-ads">Ngân sách</h3>
          </div>
          <div className="budget-options">
            <label
              className={`budget-option ${campaign.budgetType === "CAMPAIGN" ? "selected" : ""
                }`}
            >
              <input
                type="radio"
                name="budgetType"
                value="CAMPAIGN"
                checked={campaign.budgetType === "CAMPAIGN"}
                onChange={(e) =>
                  setCampaign((prev) => ({
                    ...prev,
                    budgetType: e.target.value,
                  }))
                }
              />
              <div className="option-content">
                <div className="option-title">Ngân sách chiến dịch</div>
                <div className="option-description">
                  Tự động phân bổ ngân sách cho những cơ hội tốt nhất trên toàn
                  chiến dịch. Bây còn gọi là ngân sách chiến dịch Avantage+.
                  Giới thiệu về ngân sách chiến dịch
                </div>
              </div>
            </label>

            <label className={`budget-option ${campaign.budgetType === "ADSET" ? "selected" : ""}`}>
              <input
                type="radio"
                name="budgetType"
                value="ADSET"
                checked={campaign.budgetType === "ADSET"}
                onChange={(e) =>
                  setCampaign((prev) => ({
                    ...prev,
                    budgetType: e.target.value,
                  }))
                }
              />
              <div className="option-content">
                <div className="option-title">Ngân sách nhóm quảng cáo</div>
                <div className="option-description">
                  Đặt chiến lược giá thầu hoặc lên lịch điều chỉnh chính sách
                  riêng cho từng nhóm quảng cáo.
                </div>
              </div>
            </label>
            {/* Facebook Page Section */}
            <div className="config-section">
              <div className="section-header-campaign">
                <Facebook size={16} color="#2563eb" />
                <h3 className="section-title-ads">Trang Facebook</h3>
              </div>

              <div
                className="facebook-page-selector"
                style={{ cursor: "pointer", position: "relative" }}
                onClick={() => setShowPageSelect((prev) => !prev)}
              >
                {/* Nội dung hiển thị chính */}
                {facebookPages.length > 0 ? (
                  (() => {
                    const current = facebookPages.find(
                      (p) => p.id === campaign.facebookPageId
                    );
                    return (
                      <>
                        <img
                          src={current?.avatar || no_avatar}
                          alt={current?.name || "Facebook Page"}
                          className="page-logo"
                        />
                        <div className="page-info">
                          <div className="page-type">Trang Facebook</div>
                          <div className="page-name">
                            {current?.name || "Chưa chọn Page"}
                          </div>
                        </div>
                      </>
                    );
                  })()
                ) : (
                  <div className="page-info">
                    <div className="page-type">Trang Facebook</div>
                    <div className="page-name">Chưa có Page nào</div>
                  </div>
                )}

                {/* Dropdown list khi click */}
                {showPageSelect && facebookPages.length > 0 && (
                  <div
                    className="dropdown-list"
                    onClick={(ev) => ev.stopPropagation()}
                  >
                    {facebookPages.map((p) => (
                      <div
                        key={p.id}
                        className="dropdown-item-campaign"
                        onClick={() => handlePageChange(p)} // Sử dụng hàm xử lý mới
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "8px 10px",
                          cursor: "pointer",
                          background:
                            campaign.facebookPageId === p.id
                              ? "#f3f4f6"
                              : "white",
                          zIndex: 9999,
                        }}
                      >
                        <img
                          src={p.avatar}
                          alt={p.name}
                          style={{ width: 28, height: 28, borderRadius: "50%" }}
                        />
                        <span>{p.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const CampaignStep = forwardRef(CampaignStepInner);
export default CampaignStep;
