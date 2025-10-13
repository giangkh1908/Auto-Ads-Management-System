import { Circle, Image, ChevronDown, Facebook, FileText, Type, MousePointer } from 'lucide-react';

function AdStep({ ad, setAd, mode = "create" }) {
    return (
        <div className="ad-step">
            <div className="config-scroll-container">
                {/* Ad Name Section */}
                <div className="config-section">
                    <div className="section-header-ads">
                        <Circle size={8} fill="#2563eb" color="#2563eb" />
                        <h3 className="section-title-ads">Tên quảng cáo</h3>
                    </div>
                    <input
                        type="text"
                        className="ad-name-input"
                        value={ad.name}
                        onChange={(e) => setAd(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Quảng cáo Lượt tương tác mới"
                    />
                </div>

                {/* Identity Section */}
                <div className="config-section">
                    <div className="section-header-ads">
                        <Facebook size={16} color="#2563eb" />
                        <h3 className="section-title-ads">Nhận diện</h3>
                    </div>
                    <div className="identity-field">
                        <label className="field-label">*Trang Facebook</label>
                        <div className="facebook-page-display">
                            <div className="page-logo-small">F</div>
                            <div className="page-name-small">Fchat.vn</div>
                        </div>
                    </div>
                </div>

                {/* Ad Content Section */}
                <div className="config-section">
                    <div className="section-header-ads">
                        <FileText size={16} color="#2563eb" />
                        <h3 className="section-title-ads">Nội dung quảng cáo</h3>
                    </div>
                    <div className="ad-content-fields">
                        {/* Media File */}
                        <div className="field-group">
                            <label className="field-label">*File phương tiện</label>
                            <div className="media-file-selector">
                                <Image size={18} className="media-icon" />
                                <span className="media-text">Thêm file phương tiện</span>
                                <ChevronDown size={16} className="dropdown-arrow" />
                            </div>
                        </div>

                        {/* Primary Text */}
                        <div className="field-group">
                            <label className="field-label">Văn bản chính</label>
                            <textarea
                                className="primary-text-input"
                                value={ad.primaryText}
                                onChange={(e) => setAd(prev => ({ ...prev, primaryText: e.target.value }))}
                                placeholder="Hãy giới thiệu về nội dung quảng cáo của bạn"
                                rows={4}
                            />
                        </div>

                        {/* Headline */}
                        <div className="field-group">
                            <label className="field-label">Tiêu đề</label>
                            <input
                                type="text"
                                className="headline-input"
                                value={ad.headline}
                                onChange={(e) => setAd(prev => ({ ...prev, headline: e.target.value }))}
                                placeholder="Chat trong Messenger"
                            />
                        </div>

                        {/* Description */}
                        <div className="field-group">
                            <label className="field-label">Mô tả</label>
                            <textarea
                                className="description-input"
                                value={ad.description || ""}
                                onChange={(e) => setAd(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Mô tả ngắn gọn về sản phẩm/dịch vụ"
                                rows={3}
                            />
                        </div>

                        {/* Call to Action */}
                        <div className="field-group">
                            <label className="field-label">Nút kêu gọi hành động</label>
                            <div className="cta-selector">
                                <span className="cta-text">{ad.cta}</span>
                                <ChevronDown size={16} className="dropdown-arrow" />
                            </div>
                            <select
                                className="cta-select"
                                value={ad.cta}
                                onChange={(e) => setAd(prev => ({ ...prev, cta: e.target.value }))}
                                style={{ display: 'none' }}
                            >
                                <option value="Gửi tin nhắn">Gửi tin nhắn</option>
                                <option value="Tìm hiểu thêm">Tìm hiểu thêm</option>
                                <option value="Mua ngay">Mua ngay</option>
                                <option value="Đăng ký">Đăng ký</option>
                                <option value="Xem ngay">Xem ngay</option>
                                <option value="Truy cập ngay">Truy cập ngay</option>
                                <option value="Liên hệ ngay">Liên hệ ngay</option>
                            </select>
                        </div>

                        {/* Destination URL */}
                        <div className="field-group">
                            <label className="field-label">URL đích</label>
                            <input
                                type="url"
                                className="url-input"
                                value={ad.destinationUrl || ""}
                                onChange={(e) => setAd(prev => ({ ...prev, destinationUrl: e.target.value }))}
                                placeholder="https://example.com"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdStep;