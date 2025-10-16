import { useState, useEffect } from "react";
import { Circle, DollarSign, Settings, Facebook, Edit2 } from "lucide-react";
import no_avatar from "../../../assets/no-avatar.jpg";

function CampaignStep({ campaign, setCampaign, facebookPages = [] }) {
  const [showPageSelect, setShowPageSelect] = useState(false);

  useEffect(() => {
    if (facebookPages.length > 0 && !campaign.facebookPageId) {
      const firstPage = facebookPages[0];
      setCampaign(prev => ({
        ...prev,
        facebookPageId: firstPage.id,
        facebookPage: firstPage.name,
        facebookPageAvatar: firstPage.avatar,
      }));
    }
  }, [facebookPages]);

  return (
    <div className="campaign-step">
      <div className="step-content">
        {/* Campaign Name Section */}
        <div className="config-section-ads">
          <div className="section-header-ads">
            <Circle size={8} fill="#2563eb" color="#2563eb" />
            <h3 className="section-title-ads">Tên chiến dịch</h3>
          </div>
          <input
            type="text"
            className="campaign-name-input"
            value={campaign.name}
            onChange={(e) => setCampaign((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Nhập tên chiến dịch"
          />
        </div>

        {/* Campaign Details Section */}
        <div className="config-section-ads">
          <div className="section-header-ads">
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
          <div className="section-header-ads">
            <DollarSign size={16} color="#2563eb" />
            <h3 className="section-title-ads">Ngân sách</h3>
          </div>
          <div className="budget-options">
            <label
              className={`budget-option ${
                campaign.budgetType === "CAMPAIGN" ? "selected" : ""
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

            <label className={`budget-option ${ campaign.budgetType === "ADSET" ? "selected" : ""}`}>
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
              <div className="section-header-ads">
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
                        onClick={() => {
                          setCampaign((prev) => ({
                            ...prev,
                            facebookPage: p.name,
                            facebookPageId: p.id,
                            facebookPageAvatar: p.avatar,
                          }));
                          setShowPageSelect(false);
                        }}
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

export default CampaignStep;
