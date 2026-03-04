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
  Crown,
} from "lucide-react";
import AiPopup from "../AiPopup/AiPopup";
import "../AiPopup/AiPopup.css";
import axiosInstance from "../../../../utils/api/axios";
import "./AdStep.css";
import { useToast } from "../../../../hooks/common/useToast";
import { validateNonEmpty } from "../../../../utils/validation/validation";
import { CTA_OPTIONS } from "../../../../constants/ctaConstants";
import { useTranslation } from "react-i18next";

function AdStepInner({ ad, setAd, adset, contentAiEnabled = true }, ref) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [showAIConfig, setShowAIConfig] = useState(false);
  const toast = useToast();
  const { t } = useTranslation('wizard');

  const ensureContentAi = () => {
    if (contentAiEnabled) return true;
    toast.warning("Tính năng AI nội dung chỉ khả dụng ở gói Chatbot AI+");
    return false;
  };

  // Get detailed requirements and guidance based on destination_type
  const getDestinationGuidance = () => {
    const destType = adset?.destination_type;
    // const optimizationGoal = adset?.optimization_goal;

    switch (destType) {
      case 'ON_VIDEO':
        return {
          title: 'Mục tiêu: Lượt xem video',
          mediaType: 'video',
          mediaLabel: 'Video',
          mediaAccept: 'video/*',
          mediaDescription: 'BẮT BUỘC upload video',
          requirements: [
            '* Video phải hấp dẫn trong 3 giây đầu',
            '* Độ dài khuyến nghị: 15-60 giây',
            '* Định dạng: MP4, MOV (tối đa 4GB)',
            '* Tỷ lệ: 9:16 (Stories), 1:1 (Feed), 16:9 (Landscape)',
          ],
          ctaRecommendations: ['Tìm hiểu thêm', 'Xem khuyến mãi', 'Nghe ngay'],
          destinationNote: 'URL đích sẽ hiển thị khi người dùng nhấp vào video hoặc CTA'
        };

      case 'ON_POST':
        return {
          title: 'Mục tiêu: Tương tác bài viết',
          mediaType: 'image-or-video',
          mediaLabel: 'Ảnh hoặc Video',
          mediaAccept: 'image/*,video/*',
          mediaDescription: 'Ảnh hoặc video để tăng tương tác',
          requirements: [
            '* Nội dung văn bản phải khuyến khích tương tác (like, comment, share)',
            '* Ảnh: Độ phân giải tối thiểu 1080x1080px',
            '* Video: Độ dài 15-30 giây cho tương tác tốt nhất',
            '* Sử dụng câu hỏi hoặc call-to-action trong văn bản',
          ],
          ctaRecommendations: ['Tìm hiểu thêm', 'Liên hệ ngay', 'Nhận ưu đãi'],
          destinationNote: 'Tập trung vào engagement, URL đích là phụ (có thể dẫn đến trang fanpage hoặc website)'
        };

      case 'ON_PAGE':
        return {
          title: 'Mục tiêu: Lượt thích trang',
          mediaType: 'image-or-video',
          mediaLabel: 'Ảnh hoặc Video',
          mediaAccept: 'image/*,video/*',
          mediaDescription: 'Ảnh/video giới thiệu trang của bạn',
          requirements: [
            '* Nội dung phải thể hiện rõ giá trị của trang Facebook',
            '* Highlight những lợi ích khi like trang (cập nhật, ưu đãi...)',
            '* Ảnh cover hoặc logo trang nên xuất hiện',
            '* Văn bản chính: Mô tả ngắn gọn về trang',
          ],
          ctaRecommendations: ['Tìm hiểu thêm', 'Liên hệ ngay', 'Nhận ưu đãi'],
          destinationNote: 'Quảng cáo sẽ hiển thị nút "Thích trang" trực tiếp, URL đích thường là link trang Facebook'
        };

      case 'ON_EVENT':
        return {
          title: 'Mục tiêu: Phản hồi sự kiện',
          mediaType: 'image-or-video',
          mediaLabel: 'Ảnh hoặc Video',
          mediaAccept: 'image/*,video/*',
          mediaDescription: 'Ảnh/video về sự kiện',
          requirements: [
            '* Hiển thị rõ thông tin sự kiện (ngày, giờ, địa điểm)',
            '* Sử dụng ảnh chất lượng cao về venue hoặc sự kiện tương tự',
            '* Văn bản chính: Mô tả highlights của sự kiện',
            '* Tạo cảm giác FOMO (Fear of Missing Out)',
          ],
          ctaRecommendations: ['Đăng ký ngay', 'Đặt ngay', 'Nhận ưu đãi'],
          destinationNote: 'Quảng cáo sẽ hiển thị nút phản hồi sự kiện (Quan tâm/Tham gia), URL đích thường là link sự kiện Facebook'
        };

      case 'MESSAGING_APPS':
        return {
          title: 'Mục tiêu: Bắt đầu hội thoại',
          mediaType: 'image-or-video',
          mediaLabel: 'Ảnh hoặc Video',
          mediaAccept: 'image/*,video/*',
          mediaDescription: 'Ảnh/video khuyến khích nhắn tin',
          requirements: [
            '* Nội dung phải khuyến khích người dùng nhắn tin (Hỏi, Tư vấn, Hỗ trợ...)',
            '* Văn bản chính: Đề cập rõ lợi ích khi nhắn tin (tư vấn miễn phí, ưu đãi...)',
            '* Ảnh nên thể hiện sự thân thiện, sẵn sàng hỗ trợ',
            '* Chuẩn bị auto-reply hoặc chatbot để phản hồi nhanh',
          ],
          ctaRecommendations: ['Liên hệ ngay', 'Nhận ưu đãi', 'Tìm hiểu thêm'],
          destinationNote: 'Quảng cáo sẽ có nút "Nhắn tin" mở Messenger, URL đích không quan trọng (có thể để link fanpage)'
        };

      default:
        return {
          title: 'Tạo quảng cáo',
          mediaType: 'image-or-video',
          mediaLabel: 'Ảnh hoặc Video',
          mediaAccept: 'image/*,video/*',
          mediaDescription: 'Hỗ trợ ảnh hoặc video',
          requirements: [
            '* Nội dung phải rõ ràng, hấp dẫn',
            '* Ảnh: Độ phân giải tối thiểu 1080x1080px',
            '* Video: Độ dài 15-60 giây',
          ],
          ctaRecommendations: ['Tìm hiểu thêm', 'Liên hệ ngay', 'Nhận ưu đãi'],
          destinationNote: 'URL đích là trang bạn muốn người dùng truy cập'
        };
    }
  };

  const guidance = getDestinationGuidance();

  // AI generate per-field (giữ lại cho nút AI nhỏ bên cạnh từng field)
  // aiProvider: dùng mặc định openai cho nút generate từng field
  const aiProvider = 'openai';
  const [contextId] = useState(null);
  const [isGenerating, setIsGenerating] = useState({
    headline: false,
    primaryText: false,
    description: false,
  });

  // Khi user chọn một variant từ AiPopup → fill tất cả fields + ảnh vào ad
  const handleVariantSelected = ({ headline, primaryText, description, imageUrl }) => {
    setAd((prev) => ({
      ...prev,
      ...(headline ? { headline } : {}),
      ...(primaryText ? { primaryText } : {}),
      ...(description ? { description } : {}),
      ...(imageUrl ? { media: 'image', mediaUrl: imageUrl } : {}),
    }));
  };

  const getAiActionTooltip = () => {
    if (!contentAiEnabled) {
      return "Nâng cấp lên Chatbot AI để dùng AI nội dung";
    }
    if (!contextId) {
      return "Thiết lập AI trước khi tạo nội dung";
    }
    return "Tạo nội dung bằng AI";
  };


  // Function to handle file upload
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type based on destination type
    const fileType = file.type || "";
    const isVideoFile = fileType.startsWith("video/");

    // Check if media type matches requirement
    if (guidance.mediaType === 'video' && !isVideoFile) {
      toast.error("Mục tiêu này yêu cầu file video (.mp4, .mov, .avi, .webm)");
      e.target.value = ''; // Reset input
      return;
    }

    // Validate file size (max 100MB for video, 10MB for image)
    const maxSizeVideo = 100 * 1024 * 1024; // 100MB
    const maxSizeImage = 10 * 1024 * 1024;  // 10MB
    const maxSize = isVideoFile ? maxSizeVideo : maxSizeImage;

    if (file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      toast.error(`File quá lớn. Kích thước tối đa: ${maxSizeMB}MB`);
      e.target.value = '';
      return;
    }

    // For video files, validate duration (optional - requires reading video metadata)
    if (isVideoFile) {
      const video = document.createElement('video');
      video.preload = 'metadata';

      video.onloadedmetadata = async function () {
        window.URL.revokeObjectURL(video.src);
        const duration = video.duration;

        // Facebook recommends 15-240 seconds for video ads
        if (duration > 240) {
          toast.warning("Video dài hơn 4 phút. Facebook khuyến nghị video 15-240 giây để tối ưu hiệu suất.");
        }

        // console.log(`📹 Video duration: ${duration.toFixed(1)}s`);
      };

      video.src = URL.createObjectURL(file);
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);

      // Show different messages for video vs image
      if (isVideoFile) {
        toast.info("Đang upload video... Vui lòng đợi", { duration: 5000 });
      }

      const res = await axiosInstance.post("/api/upload/media", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: () => { }
      });

      if (res.data?.success && res.data?.url) {
        // Lấy file từ formData
        const uploadedFile = formData.get("file") || formData.get("media");
        const uploadedFileType = uploadedFile?.type || "";

        // Xác định loại media
        const mediaType = uploadedFileType.startsWith("video/")
          ? "video"
          : uploadedFileType.startsWith("image/")
            ? "image"
            : "unknown";

        setAd((prev) => ({
          ...prev,
          media: mediaType,
          mediaUrl: res.data.url,
        }));

        toast.success(
          mediaType === "video"
            ? "Upload video thành công!"
            : "Upload ảnh thành công!"
        );
      } else {
        toast.error(res.data?.message || "Upload thất bại");
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Không thể upload file. Vui lòng thử lại.");
    } finally {
      setUploading(false);
      e.target.value = ''; // Reset input để có thể chọn lại file khác
    }
  };

  // Function to generate text content using AI
  const generateAIContent = async (field, maxLength = 100) => {
    if (!ensureContentAi()) return;
    if (!contextId) {
      toast.warning("Vui lòng thiết lập AI trước", {
        description: "Hãy nhấn 'Tạo bằng AI' để thiết lập tham số AI",
      });
      return;
    }

    try {
      setIsGenerating(prev => ({ ...prev, [field]: true }));

      const target = field === 'primaryText' ? 'body' : field;
      const model =
        aiProvider === 'gemini' ? 'gemini-2.5-flash' : 'gpt-4o-mini';
      const response = await axiosInstance.post('/api/ai/generate-text', {
        context_id: contextId,
        target,
        constraints: { max_len: maxLength },
        model
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



  // Expose validate() to parent
  useImperativeHandle(
    ref,
    () => ({
      validate: () => {
        const okName = !!ad?.name && String(ad.name).trim() !== "";
        const okMedia = !!ad?.mediaUrl;
        const okUrl =
          !!ad?.destinationUrl && String(ad.destinationUrl).trim() !== "";

        // Validate media type matches destination_type requirements
        let okMediaType = true;
        if (okMedia && guidance.mediaType === 'video' && ad.media !== 'video') {
          toast.warning("Mục tiêu xem video yêu cầu upload file video");
          okMediaType = false;
        }

        if (!okName) validateNonEmpty(ad.name, "tên quảng cáo", toast);
        if (!okMedia) toast.warning("Vui lòng chọn file phương tiện");
        if (!okUrl) validateNonEmpty(ad.destinationUrl, "URL đích", toast);
        return okName && okMedia && okMediaType && okUrl;
      },
    }),
    [ad, toast, guidance]
  );

  return (
    <div className="ad-step">
      <div className="config-scroll-container">
        {/* Guidance Banner */}
        {adset?.destination_type && (
          <div className="guidance-banner">
            <h3 className="guidance-banner-title">
              {guidance.title}
            </h3>
            <div className="guidance-banner-box">
              <h4 className="guidance-banner-box-header">
                Yêu cầu nội dung:
              </h4>
              {guidance.requirements.map((req, idx) => (
                <div key={idx} className="guidance-banner-requirement">
                  {req}
                </div>
              ))}
            </div>
            <div className="guidance-banner-cta-box">
              <strong>Gợi ý CTA:</strong> {guidance.ctaRecommendations.join(', ')}
            </div>
            <div className="guidance-banner-note">
              {guidance.destinationNote}
            </div>
          </div>
        )}

        <div className="btn-generate-ai-container">
          <button
            className={`btn-generate-ai ${!contentAiEnabled ? 'premium-feature' : ''}`}
            onClick={() => {
              if (!contentAiEnabled) {
                toast.error("Tính năng này yêu cầu gói ChatBot AI");
                return;
              }
              if (!ensureContentAi()) return;
              setShowAIConfig(!showAIConfig);
            }}
            title={
              contentAiEnabled
                ? "Thiết lập tham số AI"
                : "Nâng cấp lên Chatbot AI+ để dùng AI nội dung"
            }
          >
            {t('ad_step.create_with_ai')}
            {!contentAiEnabled && (
              <span className="premium-badge">
                <Crown size={12} />
              </span>
            )}
          </button>

          {/* AiPopup — Tạo quảng cáo bằng AI (thiết kế mới) */}
          <AiPopup
            isOpen={showAIConfig}
            onClose={() => setShowAIConfig(false)}
            onSelectVariant={handleVariantSelected}
          />
        </div>

        {/* Ad Name Section */}
        <div className="config-section">
          <div className="section-header-ads">
            <Circle size={8} fill="#2563eb" color="#2563eb" />
            <h3 className="section-title-ads">{t('ad_step.ad_name_title')}</h3>
          </div>
          <input
            type="text"
            className="ad-name-input"
            value={ad.name}
            onChange={(e) =>
              setAd((prev) => ({ ...prev, name: e.target.value }))
            }
            onBlur={() => validateNonEmpty(ad.name, "tên quảng cáo", toast)}
            placeholder={t('ad_step.ad_name_placeholder')}
          />
        </div>

        {/* Ad Content Section */}
        <div className="config-section">
          <div className="section-header-ads">
            <FileText size={16} color="#2563eb" />
            <h3 className="section-title-ads">{t('ad_step.ad_content_title')}</h3>
          </div>
          <div className="ad-content-fields">
            {/* Headline */}
            <div className="field-group">
              <div className="field-label-container">
                <label className="field-label">{t('ad_step.headline_label')}</label>
                <button
                  onClick={() => generateAIContent('headline', 40)}
                  disabled={
                    !contentAiEnabled || isGenerating.headline || !contextId
                  }
                  className="ai-generate-btn"
                  title={getAiActionTooltip()}
                >
                  <Bot size={14} />
                  {isGenerating.headline ? t('ad_step.ai_generating') : t('ad_step.ai_button')}
                </button>
              </div>
              <input
                type="text"
                className="headline-input"
                value={ad.headline}
                onChange={(e) =>
                  setAd((prev) => ({ ...prev, headline: e.target.value }))
                }
                placeholder={t('ad_step.headline_placeholder')}
              />
            </div>

            {/* Primary Text */}
            <div className="field-group">
              <div className="field-label-container">
                <label className="field-label">{t('ad_step.primary_text_label')}</label>
                <button
                  onClick={() => generateAIContent('primaryText', 125)}
                  disabled={
                    !contentAiEnabled || isGenerating.primaryText || !contextId
                  }
                  className="ai-generate-btn"
                  title={getAiActionTooltip()}
                >
                  <Bot size={14} />
                  {isGenerating.primaryText ? t('ad_step.ai_generating') : t('ad_step.ai_button')}
                </button>
              </div>
              <textarea
                className="primary-text-input"
                value={ad.primaryText}
                onChange={(e) =>
                  setAd((prev) => ({ ...prev, primaryText: e.target.value }))
                }
                rows={4}
                placeholder={t('ad_step.primary_text_placeholder')}
              />
            </div>

            {/* Description */}
            <div className="field-group">
              <div className="field-label-container">
                <label className="field-label">{t('ad_step.description_label')}</label>
                <button
                  onClick={() => generateAIContent('description', 30)}
                  disabled={
                    !contentAiEnabled || isGenerating.description || !contextId
                  }
                  className="ai-generate-btn"
                  title={getAiActionTooltip()}
                >
                  <Bot size={14} />
                  {isGenerating.description ? t('ad_step.ai_generating') : t('ad_step.ai_button')}
                </button>
              </div>
              <textarea
                className="description-input"
                value={ad.description || ""}
                onChange={(e) =>
                  setAd((prev) => ({ ...prev, description: e.target.value }))
                }
                rows={3}
                placeholder={t('ad_step.description_placeholder')}
              />
            </div>

            {/* Call to Action */}
            <div className="field-group">
              <div className="field-label-container">
                <label className="field-label">{t('ad_step.cta_label')}</label>
              </div>
              <select
                className="cta-select"
                value={ad.cta}
                onChange={(e) =>
                  setAd((prev) => ({ ...prev, cta: e.target.value }))
                }
              >
                {CTA_OPTIONS.map((cta) => (
                  <option key={cta} value={cta}>
                    {cta}
                  </option>
                ))}
              </select>
            </div>

            {/* Destination URL */}
            <div className="field-group">
              <label className="field-label">{t('ad_step.destination_url_label')}</label>
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
                placeholder={t('ad_step.url_placeholder')}
              />
            </div>

            {/* Media File */}
            <div className="field-group">
              <label className="field-label">* {t('ad_step.media_file_label')} ({guidance.mediaLabel})</label>
              <small className="media-description-hint">
                {guidance.mediaDescription}
              </small>

              {/* Hiển thị thông tin file đã chọn */}
              {ad.mediaUrl && (
                <div className="selected-file-info">
                  <span className="file-type-badge">
                    {ad.media === 'video' ? 'Video' : 'Ảnh'}
                  </span>
                  <span className="file-status">{t('ad_step.upload_success')}</span>
                </div>
              )}

              <div className="media-buttons-container">
                <button
                  className="media-button upload-button"
                  onClick={() => fileInputRef.current.click()}
                  disabled={uploading}
                >
                  <Image size={18} className="media-icon" />
                  {uploading
                    ? t('ad_step.uploading')
                    : ad.mediaUrl
                      ? `${t('ad_step.change_media')} ${guidance.mediaLabel.toLowerCase()}`
                      : `${t('ad_step.add_media')} ${guidance.mediaLabel.toLowerCase()}`}
                </button>
              </div>


              {/* File input */}
              <input
                className="image-input"
                type="file"
                accept={guidance.mediaAccept}
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
                    className="video-preview"
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
