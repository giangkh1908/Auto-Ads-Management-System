import { useRef, useState, forwardRef, useImperativeHandle } from "react";
import {
  Circle,
  Image,
  ChevronDown,
  Facebook,
  FileText,
  Type,
  MousePointer,
} from "lucide-react";
import AiPopup from "../AiPopup/AiPopup";
import "../AiPopup/AiPopup.css";
import axiosInstance from "../../../../utils/axios";
import "./AdStep.css";
import { useToast } from "../../../../hooks/useToast";
import { validateNonEmpty } from "../../../../utils/validation";

function AdStepInner({ ad, setAd }, ref) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [showAIGeneration, setShowAIGeneration] = useState(false);
  const [aiImages, setAiImages] = useState([]);
  const [selectedAiImages, setSelectedAiImages] = useState([]);
  const [showAIConfig, setShowAIConfig] = useState(false);
  const toast = useToast();

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    try {
      setUploading(true);
      const res = await axiosInstance.post("/api/upload/media", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.success && res.data?.url) {
        // Lấy file đầu tiên trong formData
        const file = formData.get("file") || formData.get("media");
        const fileType = file?.type || "";

        // Xác định loại media
        const mediaType = fileType.startsWith("video/")
          ? "video"
          : fileType.startsWith("image/")
          ? "image"
          : "unknown";

        setAd((prev) => ({
          ...prev,
          media: mediaType,
          mediaUrl: res.data.url,
        }));

        toast.success("Tải file thành công");
      } else {
        toast.error(res.data?.message || "Upload thất bại");
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Không thể upload file. Vui lòng thử lại.");
    } finally {
      setUploading(false);
    }
  };

  // Expose validate() to parent
  useImperativeHandle(
    ref,
    () => ({
      validate: () => {
        const okName = !!ad?.name && String(ad.name).trim() !== "";
        const okMedia = !!ad?.mediaUrl;
        const okUrl =
          !!ad?.destinationUrl && String(ad.destinationUrl).trim() !== "";
        if (!okName) validateNonEmpty(ad.name, "tên quảng cáo", toast);
        if (!okMedia) toast.warning("Vui lòng chọn file phương tiện");
        if (!okUrl) validateNonEmpty(ad.destinationUrl, "URL đích", toast);
        return okName && okMedia && okUrl;
      },
    }),
    [ad, toast]
  );

  return (
    <div className="ad-step">
      <div className="config-scroll-container">
        <div className="btn-generate-ai-container">
          <button
            className="btn-generate-ai"
            onClick={() => {
              setShowAIConfig(!showAIConfig);
            }}
          >
            Tạo bằng AI
          </button>

          {/* AI Config Modal */}
          <AiPopup
            isOpen={showAIConfig}
            onClose={() => setShowAIConfig(false)}
            onConfirm={(config) => {
              console.log("AI Config:", config);
              setShowAIGeneration(true);
            }}
          />
        </div>
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
            onChange={(e) =>
              setAd((prev) => ({ ...prev, name: e.target.value }))
            }
            onBlur={() => validateNonEmpty(ad.name, "tên quảng cáo", toast)}
            placeholder="Quảng cáo mới"
          />
        </div>

        {/* Ad Content Section */}
        <div className="config-section">
          <div className="section-header-ads">
            <FileText size={16} color="#2563eb" />
            <h3 className="section-title-ads">Nội dung quảng cáo</h3>
          </div>
          <div className="ad-content-fields">
            {/* Headline */}
            <div className="field-group">
              <label className="field-label">Tiêu đề</label>
              <input
                type="text"
                className="headline-input"
                value={ad.headline}
                onChange={(e) =>
                  setAd((prev) => ({ ...prev, headline: e.target.value }))
                }
                placeholder="Sản phẩm/Dịch vụ chất lượng cao"
              />
            </div>
            {/* Primary Text */}
            <div className="field-group">
              <label className="field-label">Văn bản chính</label>
              <textarea
                className="primary-text-input"
                value={ad.primaryText}
                onChange={(e) =>
                  setAd((prev) => ({ ...prev, primaryText: e.target.value }))
                }
                rows={4}
              />
            </div>

            {/* Description */}
            <div className="field-group">
              <label className="field-label">Mô tả</label>
              <textarea
                className="description-input"
                value={ad.description || ""}
                onChange={(e) =>
                  setAd((prev) => ({ ...prev, description: e.target.value }))
                }
                rows={3}
              />
            </div>

            {/* Call to Action */}
            <div className="field-group">
              <label className="field-label">Nút kêu gọi hành động</label>
              <select
                className="cta-select"
                value={ad.cta}
                onChange={(e) =>
                  setAd((prev) => ({ ...prev, cta: e.target.value }))
                }
                // style={{ display: 'none' }}
              >
                <option value="Liên hệ ngay">Liên hệ ngay</option>
                <option value="Xem thêm">Xem thêm</option>
                <option value="Nhận báo giá">Nhận báo giá</option>
                <option value="Đăng ký ngay">Đăng ký ngay</option>
                <option value="Đặt ngay">Đặt ngay</option>
                <option value="Liên hệ với chúng tôi">
                  Liên hệ với chúng tôi
                </option>
                <option value="Tải xuống">Tải xuống</option>
                <option value="Nhận ưu đãi">Nhận ưu đãi</option>
                <option value="Xem khuyến mãi">Xem khuyến mãi</option>
                <option value="Xem suất chiếu">Xem suất chiếu</option>
                <option value="Tìm hiểu thêm">Tìm hiểu thêm</option>
                <option value="Nghe ngay">Nghe ngay</option>
                <option value="Đặt hàng ngay">Đặt hàng ngay</option>
                <option value="Nhận quyền truy cập">Nhận quyền truy cập</option>
                <option value="Đặt lịch hẹn">Đặt lịch hẹn</option>
                <option value="Xem menu">Xem menu</option>
                <option value="Nhận thông tin mới">Nhận thông tin mới</option>
                <option value="Mua ngay">Mua ngay</option>
                <option value="Đăng ký">Đăng ký</option>
                <option value="Đăng ký dài hạn">Đăng ký dài hạn</option>
              </select>
            </div>

            {/* Destination URL */}
            <div className="field-group">
              <label className="field-label">* URL đích</label>
              <input
                type="url"
                className="url-input"
                value={ad.destinationUrl || ""}
                onChange={(e) =>
                  setAd((prev) => ({ ...prev, destinationUrl: e.target.value }))
                }
                onBlur={() =>
                  validateNonEmpty(ad.destinationUrl, "URL đích", toast)
                }
                placeholder="https://example.com"
              />
            </div>
            {/* Media File */}
            <div className="field-group">
              <label className="field-label">* File phương tiện</label>
              <div className="media-buttons-container">
                <button
                  className="media-button upload-button"
                  onClick={() => fileInputRef.current.click()}
                  disabled={uploading}
                >
                  <Image size={18} className="media-icon" />
                  
                    {uploading
                      ? "Đang tải lên..."
                      : ad.mediaUrl
                      ? "Đã chọn file"
                      : "Thêm file phương tiện"}
                </button>
                <button
                  className="media-button ai-button"
                  onClick={() => {
                    setShowAIGeneration(!showAIGeneration);
                    if (!showAIGeneration) {
                      // Simulate AI image generation
                      const mockImages = Array.from({ length: 10 }, (_, i) => ({
                        id: i + 1,
                        url: `https://picsum.photos/200/200?random=${i}`,
                        selected: i === 0, // First image selected by default
                      }));
                      setAiImages(mockImages);
                      setSelectedAiImages([mockImages[0]]);
                    }
                  }}
                  disabled={uploading}
                >
                  <Image size={18} className="button-icon" />
                  AI tạo ảnh
                </button>
              </div>
              {/* AI Generation Section */}
              {showAIGeneration && (
                <div className="ai-generation-section">
                  <div className="ai-images-grid">
                    {aiImages.map((image) => (
                      <div
                        key={image.id}
                        className={`ai-image-cell ${
                          image.selected ? "selected" : ""
                        }`}
                        onClick={() => {
                          const newImages = aiImages.map((img) =>
                            img.id === image.id
                              ? { ...img, selected: !img.selected }
                              : img
                          );
                          setAiImages(newImages);
                          setSelectedAiImages(
                            newImages.filter((img) => img.selected)
                          );
                        }}
                      >
                        {image.selected && <div className="checkmark">✓</div>}
                      </div>
                    ))}
                  </div>

                  <div className="ai-info-section">
                    <div className="ai-info-text">
                      <div className="ai-info-line">
                        Ảnh đã tạo {aiImages.length}/{aiImages.length}
                      </div>
                      <div className="ai-info-line">
                        Ảnh có thể thêm {10 - aiImages.length}
                      </div>
                      <div className="ai-info-line">
                        Ảnh đã chọn {selectedAiImages.length}/
                        {selectedAiImages.length}
                      </div>
                    </div>
                    <button
                      className="auto-select-button"
                      onClick={() => {
                        // Auto select all images
                        const allSelected = aiImages.map((img) => ({
                          ...img,
                          selected: true,
                        }));
                        setAiImages(allSelected);
                        setSelectedAiImages(allSelected);
                      }}
                    >
                      Chọn ảnh tự động
                    </button>
                  </div>
                </div>
              )}

              {/* File input */}
              <input
                className="image-input"
                type="file"
                accept="image/*,video/*"
                ref={fileInputRef}
                onChange={handleFileSelect}
              />
              {ad.mediaUrl && ad.media === "image" && (
                <div className="image-frame">
                  <img src={ad.mediaUrl} alt="Preview" />
                </div>
              )}
              {ad.mediaUrl && ad.media === "video" && (
                <div className="image-frame">
                  <video
                    src={ad.mediaUrl}
                    controls
                    style={{ width: "100%", borderRadius: 8 }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const AdStep = forwardRef(AdStepInner);
export default AdStep;
