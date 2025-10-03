
function CampaignStep({ campaign, setCampaign }) {
    return (
        <div className="panel campaign-details-panel">
            <div className="campaign-details-layout">
                <div className="campaign-configuration">
                    <div className="config-section">
                        <div className="section-header">
                            <div className="section-bullet"></div>
                            <div className="section-title">Tên chiến dịch</div>
                        </div>
                        <div className="section-content">
                            <input
                                type="text"
                                value={campaign.name}
                                onChange={(e) => setCampaign(prev => ({ ...prev, name: e.target.value }))}
                                className="campaign-name-input"
                            />
                        </div>
                    </div>

                    <div className="config-section">
                        <div className="section-header">
                            <div className="section-bullet"></div>
                            <div className="section-title">Chi tiết chiến dịch</div>
                        </div>
                        <div className="section-content">
                            <label className="field-label">Cách mua</label>
                            <select className="readonly-input">
                                <option value="Đấu giá">Đấu giá</option>
                                <option value="Mua bán">Đặt trước</option>
                            </select>
                        </div>
                    </div>

                    <div className="config-section">
                        <div className="section-header">
                            <div className="section-bullet"></div>
                            <div className="section-title">Ngân sách</div>
                        </div>
                        <div className="section-content">
                            <div className="budget-options">
                                <label className="budget-option">
                                    <input
                                        type="radio"
                                        name="budgetType"
                                        value="CAMPAIGN"
                                        checked={campaign.budgetType === 'CAMPAIGN'}
                                        onChange={(e) => setCampaign(prev => ({ ...prev, budgetType: e.target.value }))}
                                    />
                                    <div className="option-content">
                                        <div className="option-title">Ngân sách chiến dịch</div>
                                        <div className="option-description">
                                            Ngân sách được tự động phân bổ cho các cơ hội tốt nhất trên toàn bộ chiến dịch. Còn được gọi là ngân sách chiến dịch Avantage+.
                                            <a href="#" className="learn-more-link">Tìm hiểu thêm</a>
                                        </div>
                                    </div>
                                </label>
                                <label className="budget-option">
                                    <input
                                        type="radio"
                                        name="budgetType"
                                        value="ADSET"
                                        checked={campaign.budgetType === 'ADSET'}
                                        onChange={(e) => setCampaign(prev => ({ ...prev, budgetType: e.target.value }))}
                                    />
                                    <div className="option-content">
                                        <div className="option-title">Ngân sách nhóm quảng cáo</div>
                                        <div className="option-description">
                                            Đặt chiến lược đấu giá hoặc lên lịch điều chỉnh chính sách riêng cho từng nhóm quảng cáo.
                                        </div>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CampaignStep


