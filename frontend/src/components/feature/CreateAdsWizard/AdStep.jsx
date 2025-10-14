// AdStep.jsx
import { useRef, useState } from 'react';
import { Circle, Image, ChevronDown, Facebook, FileText, Type, MousePointer } from 'lucide-react';
import axios from '../../../utils/axios'; // ✅ import axios instance

function AdStep({ ad, setAd, campaign }) {
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        try {
            setUploading(true);
            const res = await axios.post('/api/upload/image', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            if (res.data.success) {
                setAd((prev) => ({
                    ...prev,
                    media: 'image',
                    mediaUrl: res.data.url, // ✅ lưu URL Cloudinary
                }));
            } else {
                alert('Upload thất bại!');
            }
        } catch (err) {
            console.error('Upload error:', err);
            alert('Không thể upload file.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="ad-step">
            <div className="config-scroll-container">
                {/* Tên quảng cáo */}
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

                {/* Nhận diện */}
                <div className="config-section">
                    <div className="section-header-ads">
                        <Facebook size={16} color="#2563eb" />
                        <h3 className="section-title-ads">Nhận diện</h3>
                    </div>
                    <div className="identity-field">
                        <label className="field-label">*Trang Facebook</label>
                        <div className="facebook-page-display">
                            {campaign?.facebookPageAvatar ? (
                                <img src={campaign.facebookPageAvatar} alt={campaign.facebookPage} className="page-logo-small" />
                            ) : (
                                <div className="page-logo-small">F</div>
                            )}
                            <div className="page-name-small">{campaign?.facebookPage || 'Chưa chọn'}</div>
                        </div>
                    </div>
                </div>

                {/* Nội dung quảng cáo */}
                <div className="config-section">
                    <div className="section-header-ads">
                        <FileText size={16} color="#2563eb" />
                        <h3 className="section-title-ads">Nội dung quảng cáo</h3>
                    </div>

                    <div className="ad-content-fields">
                        {/* Upload file phương tiện */}
                        <div className="field-group">
                            <label className="field-label">*File phương tiện</label>
                            <div
                                className="media-file-selector"
                                onClick={() => fileInputRef.current.click()}
                            >
                                <Image size={18} className="media-icon" />
                                <span className="media-text">
                                    {uploading
                                        ? 'Đang tải lên...'
                                        : ad.mediaUrl
                                            ? 'Đã chọn file'
                                            : 'Thêm file phương tiện'}
                                </span>
                                <ChevronDown size={16} className="dropdown-arrow" />
                            </div>
                            <input
                                type="file"
                                accept="image/*,video/*"
                                style={{ display: 'none' }}
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                            />
                            {ad.mediaUrl && (
                                <div style={{ marginTop: 10 }}>
                                    <img
                                        src={ad.mediaUrl}
                                        alt="Preview"
                                        style={{ width: 200, borderRadius: 8 }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Văn bản chính */}
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

                        {/* Tiêu đề */}
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

                        {/* Mô tả */}
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

                        {/* CTA */}
                        <div className="field-group">
                            <label className="field-label">Nút kêu gọi hành động</label>
                            <select
                                className="cta-select"
                                value={ad.cta}
                                onChange={(e) => setAd(prev => ({ ...prev, cta: e.target.value }))}
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

                        {/* URL */}
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
