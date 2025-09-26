import React from 'react'

function AdStep({ ad, setAd }) {
    return (
        <div className="panel ad-config-panel">
            <div className="ad-config-layout">
                <div className="ad-configuration">
                    <div className="config-scroll-container">
                    {/* Set Name Ads */}
                        <div className="config-section">
                            <div className="section-header">
                                <div className="section-bullet"></div>
                                <div className="section-title">Tên quảng cáo</div>
                            </div>
                            <div className="section-content">
                                <input
                                    type="text"
                                    value={ad.name}
                                    onChange={(e) => setAd(prev => ({ ...prev, name: e.target.value }))}
                                    className="ad-name-input"
                                    placeholder="Quảng cáo Lượt tương tác mới"
                                />
                            </div>
                        </div>

                    {/* Show Identity */}
                        <div className="config-section">
                            <div className="section-header">
                                <div className="section-bullet"></div>
                                <div className="section-title">Nhận diện</div>
                            </div>
                            <div className="section-content">
                                <div className="identity-field">
                                    <label className="field-label">* Trang Facebook</label>
                                    <div className="facebook-page-display">
                                        <div className="page-logo-small">4A</div>
                                        <div className="page-name-small">AAAA.vn</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    {/* Ads Content */}
                        <div className="config-section">
                            <div className="section-header">
                                <div className="section-bullet"></div>
                                <div className="section-title">Nội dung quảng cáo</div>
                            </div>
                            <div className="section-content">
                                <div className="ad-content-fields">
                                    <div className="field-group">
                                        <label className="field-label required">* File phương tiện</label>
                                        <div className="media-file-selector">
                                            <div className="media-icon">🖼️</div>
                                            <span className="media-text">Thêm file phương tiện</span>
                                            <div className="dropdown-arrow">▼</div>
                                        </div>
                                    </div>
                                    
                                    <div className="field-group">
                                        <label className="field-label">Văn bản chính</label>
                                        <textarea
                                            value={ad.primaryText}
                                            onChange={(e) => setAd(prev => ({ ...prev, primaryText: e.target.value }))}
                                            className="primary-text-input"
                                            placeholder="Hãy giới thiệu về nội dung quảng cáo của bạn"
                                            rows="4"
                                        />
                                    </div>
                                    
                                    <div className="field-group">
                                        <label className="field-label">Tiêu đề</label>
                                        <input
                                            type="text"
                                            value={ad.headline}
                                            onChange={(e) => setAd(prev => ({ ...prev, headline: e.target.value }))}
                                            className="headline-input"
                                            placeholder="Chat trong Messenger"
                                        />
                                    </div>
                                    
                                    <div className="field-group">
                                        <label className="field-label">Nút kêu gọi hành động</label>
                                        <div className="cta-selector">
                                            <span className="cta-text">Gửi tin nhắn</span>
                                            <div className="dropdown-arrow">▼</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AdStep


