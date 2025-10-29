import { useRef, useState, forwardRef, useImperativeHandle } from "react";
import {
  Circle,
  Image,
  ChevronDown,
  Facebook,
  FileText,
  Bot,
  MousePointer,
  X,
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
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const toast = useToast();

  // AI context tracking
  const [contextId, setContextId] = useState(null);
  const [isGenerating, setIsGenerating] = useState({
    headline: false,
    primaryText: false,
    description: false,
  });

  // Function to handle file upload
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

  // Function to generate text content using AI
  const generateAIContent = async (field, maxLength = 100) => {
    if (!contextId) {
      toast.warning("Vui lòng thiết lập AI trước", {
        description: "Hãy nhấn 'Tạo bằng AI' để thiết lập tham số AI",
      });
      return;
    }

    try {
      setIsGenerating(prev => ({ ...prev, [field]: true }));

      const target = field === 'primaryText' ? 'body' : field;

      const response = await axiosInstance.post('/api/ai/generate-text', {
        context_id: contextId,
        target,
        constraints: { max_len: maxLength }
      });

      if (response.data && response.data.success) {
        setAd(prev => ({ ...prev, [field]: response.data.chosen }));
        toast.success(`Đã tạo ${field === 'headline' ? 'tiêu đề' :
          field === 'primaryText' ? 'văn bản chính' :
            field === 'description' ? 'mô tả' : 'nội dung'}`);
      } else {
        toast.error("Không thể tạo nội dung", {
          description: response.data?.message || "Vui lòng thử lại"
        });
      }
    } catch (error) {
      console.error(`Error generating ${field}:`, error);
      toast.error(`Không thể tạo ${field}`, {
        description: error.message
      });
    } finally {
      setIsGenerating(prev => ({ ...prev, [field]: false }));
    }
  };

  // Function to generate AI images based on context
  const generateAIImages = async () => {
    if (!contextId) {
      toast.warning("Vui lòng thiết lập AI trước", {
        description: "Hãy nhấn 'Tạo bằng AI' để thiết lập tham số AI",
      });
      return;
    }

    try {
      setIsGeneratingImages(true);
      setShowAIGeneration(true);

      // Gọi API để tạo hình ảnh dựa trên context_id sẵn có
      const response = await axiosInstance.post('/api/ai/images/generate', {
        context_id: contextId,
        count: 4, // Số lượng ảnh cần tạo
        aspect_ratio: '1:1' // Tỉ lệ khung hình
      }, {
        timeout: 60000 // 60 giây
      }
      );

      if (response.data && response.data.success && response.data.previews) {
        const generatedImages = response.data.previews.map((img, index) => ({
          id: `ai-${Date.now()}-${index}`,
          url: img.preview_url,
          selected: index === 0 // Mặc định chọn ảnh đầu tiên
        }));

        setAiImages(generatedImages);
        setSelectedAiImages([generatedImages[0]]);

        // Tự động sử dụng ảnh đầu tiên cho quảng cáo
        setAd(prev => ({
          ...prev,
          media: 'image',
          mediaUrl: generatedImages[0].url
        }));

        toast.success(`Đã tạo ${generatedImages.length} hình ảnh dựa trên ngữ cảnh`);
      } else {
        // Fallback to placeholder images for testing
        const placeholderImages = Array.from({ length: 4 }, (_, i) => ({
          id: `placeholder-${Date.now()}-${i}`,
          url: `https://picsum.photos/512/512?random=${Date.now() + i}`,
          selected: i === 0
        }));

        setAiImages(placeholderImages);
        setSelectedAiImages([placeholderImages[0]]);

        setAd(prev => ({
          ...prev,
          media: 'image',
          mediaUrl: placeholderImages[0].url
        }));

        toast.info("Đang sử dụng hình ảnh mẫu", {
          description: response.data?.message || "API chưa sẵn sàng"
        });
      }
    } catch (error) {
      console.error("Error generating AI images:", error);

      // Thông báo lỗi cụ thể hơn
      let errorMessage = "Không thể tạo hình ảnh AI";
      if (error.code === "ECONNABORTED") {
        errorMessage = "Quá thời gian chờ khi tạo ảnh. Vui lòng thử lại sau.";
      } else if (error.response) {
        errorMessage = `Lỗi máy chủ: ${error.response.status}`;
      }

      // Fall back to placeholder images
      const placeholderImages = Array.from({ length: 4 }, (_, i) => ({
        id: `fallback-${Date.now()}-${i}`,
        url: `https://picsum.photos/512/512?random=${Date.now() + i}`,
        selected: i === 0
      }));

      setAiImages(placeholderImages);
      setSelectedAiImages([placeholderImages[0]]);

      setAd(prev => ({
        ...prev,
        media: 'image',
        mediaUrl: placeholderImages[0].url
      }));

      toast.error(errorMessage, {
        description: error.code === "ECONNABORTED"
          ? "Việc tạo ảnh AI có thể mất nhiều thời gian. Đang sử dụng ảnh mẫu thay thế."
          : error.message
      });
    } finally {
      setIsGeneratingImages(false);
    }
  };

  // Function to handle AI image selection
  const handleImageSelection = (imageId) => {
    const newImages = aiImages.map((img) => ({
      ...img,
      selected: img.id === imageId
    }));

    setAiImages(newImages);

    const selectedImage = newImages.find(img => img.id === imageId);
    if (selectedImage) {
      setAd(prev => ({
        ...prev,
        media: 'image',
        mediaUrl: selectedImage.url
      }));
      setSelectedAiImages([selectedImage]);
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
              // Xử lý config và gọi API để lấy context_id
              const languageMap = {
                "Tiếng Việt": "vi",
                "English": "en",
                "中文": "zh"
              };

              const mainKeywords = config.mainKeywords.split(',')
                .map(kw => kw.trim())
                .filter(kw => kw.length > 0);

              if (mainKeywords.length === 0) {
                toast.warning("Vui lòng nhập ít nhất một từ khóa chính");
                return;
              }

              // Gọi API để xác nhận context
              axiosInstance.post('/api/ai/context/confirm', {
                language: languageMap[config.language] || "vi",
                tone: config.tone,
                personalization: config.personalization,
                main_keywords: mainKeywords
              })
                .then(response => {
                  if (response.data && response.data.success) {
                    setContextId(response.data.context_id);
                    toast.success("Đã thiết lập AI thành công");
                  }
                })
                .catch(error => {
                  console.error("Error confirming AI context:", error);
                  toast.error("Không thể thiết lập AI", {
                    description: error.message
                  });
                });
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="field-label">Tiêu đề</label>
                <button
                  onClick={() => generateAIContent('headline', 40)}
                  disabled={isGenerating.headline || !contextId}
                  style={{
                    background: '#f3f4f6',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    padding: '4px 12px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Bot size={14} />
                  {isGenerating.headline ? 'Đang tạo...' : 'AI'}
                </button>
              </div>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="field-label">Văn bản chính</label>
                <button
                  onClick={() => generateAIContent('primaryText', 125)}
                  disabled={isGenerating.primaryText || !contextId}
                  style={{
                    background: '#f3f4f6',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    padding: '4px 12px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Bot size={14} />
                  {isGenerating.primaryText ? 'Đang tạo...' : 'AI'}
                </button>
              </div>
              <textarea
                className="primary-text-input"
                value={ad.primaryText}
                onChange={(e) =>
                  setAd((prev) => ({ ...prev, primaryText: e.target.value }))
                }
                rows={4}
                placeholder="Nội dung chính của quảng cáo..."
              />
            </div>

            {/* Description */}
            <div className="field-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="field-label">Mô tả</label>
                <button
                  onClick={() => generateAIContent('description', 30)}
                  disabled={isGenerating.description || !contextId}
                  style={{
                    background: '#f3f4f6',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    padding: '4px 12px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Bot size={14} />
                  {isGenerating.description ? 'Đang tạo...' : 'AI'}
                </button>
              </div>
              <textarea
                className="description-input"
                value={ad.description || ""}
                onChange={(e) =>
                  setAd((prev) => ({ ...prev, description: e.target.value }))
                }
                rows={3}
                placeholder="Mô tả ngắn gọn bổ sung..."
              />
            </div>

            {/* Call to Action */}
            <div className="field-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="field-label">Nút kêu gọi hành động</label>
              </div>
              <select
                className="cta-select"
                value={ad.cta}
                onChange={(e) =>
                  setAd((prev) => ({ ...prev, cta: e.target.value }))
                }
              >
                <option value="Liên hệ ngay">Liên hệ ngay</option>
                <option value="Xem thêm">Xem thêm</option>
                <option value="Nhận báo giá">Nhận báo giá</option>
                <option value="Đăng ký ngay">Đăng ký ngay</option>
                <option value="Đặt ngay">Đặt ngay</option>
                <option value="Liên hệ với chúng tôi">Liên hệ với chúng tôi</option>
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
                    if (!contextId) {
                      toast.warning("Vui lòng thiết lập AI trước", {
                        description: "Hãy nhấn 'Tạo bằng AI' để thiết lập tham số AI",
                      });
                      return;
                    }

                    // Gọi hàm tạo ảnh ngay lập tức
                    generateAIImages();
                  }}
                  disabled={uploading || isGeneratingImages}
                >
                  <Image size={18} className="button-icon" />
                  {isGeneratingImages ? "Đang tạo ảnh..." : "AI tạo ảnh"}
                </button>
              </div>

              {/* AI Generation Section */}
              {showAIGeneration && (
                <div className="ai-generation-section">
                  <div className="ai-images-grid">
                    {isGeneratingImages ? (
                      // Loading placeholders
                      Array.from({ length: 4 }, (_, i) => (
                        <div key={`loading-${i}`} className="ai-image-cell loading">
                          <div className="loading-spinner"></div>
                        </div>
                      ))
                    ) : (
                      // Rendered images
                      aiImages.map((image) => (
                        <div
                          key={image.id}
                          className={`ai-image-cell ${image.selected ? "selected" : ""}`}
                          onClick={() => handleImageSelection(image.id)}
                        >
                          <img src={image.url} alt="AI generated" className="ai-image" />
                        </div>
                      ))
                    )}
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
                        Ảnh đã chọn {selectedAiImages.length}/{selectedAiImages.length}
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
