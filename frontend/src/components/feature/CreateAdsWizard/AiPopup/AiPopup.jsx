import { useState, useRef } from 'react';
import { Sparkles, Upload, Wand2, X, Loader2, Check, RefreshCw, Settings, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import axiosInstance from '../../../../utils/api/axios';
import { useToast } from '../../../../hooks/common/useToast';
import {
  DEFAULT_AI_ROLE,
  DEFAULT_HEADLINE_SPEC,
  DEFAULT_BODY_SPEC,
  DEFAULT_DESCRIPTION_SPEC,
  DEFAULT_CREATIVE_REQUIREMENTS,
  buildAdPrompt,
} from '../../../../constants/adPromptTemplate';
import './AiPopup.css';

/**
 * AiPopup — Tạo quảng cáo hoàn chỉnh bằng AI
 * Thiết kế mới: 1 textarea mô tả → AI tạo 2-3 bản (headline + body + description + ảnh)
 * Backend xử lý toàn bộ via Manus AI API
 */
const AiPopup = ({
  isOpen,
  onClose,
  onSelectVariant, // callback({ headline, primaryText, description, imageUrl })
}) => {
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [description, setDescription] = useState('');
  const [imageSource, setImageSource] = useState('upload');
  const [count, setCount] = useState(3);
  const [isGenerating, setIsGenerating] = useState(false);
  const [variants, setVariants] = useState([]);
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [uploadedImagePreview, setUploadedImagePreview] = useState(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);

  // Prompt editor states
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [aiRole, setAiRole] = useState(DEFAULT_AI_ROLE);
  const [headlineSpec, setHeadlineSpec] = useState(DEFAULT_HEADLINE_SPEC);
  const [bodySpec, setBodySpec] = useState(DEFAULT_BODY_SPEC);
  const [descriptionSpec, setDescriptionSpec] = useState(DEFAULT_DESCRIPTION_SPEC);
  const [creativeReqs, setCreativeReqs] = useState(DEFAULT_CREATIVE_REQUIREMENTS);

  const isPromptModified =
    aiRole !== DEFAULT_AI_ROLE ||
    headlineSpec !== DEFAULT_HEADLINE_SPEC ||
    bodySpec !== DEFAULT_BODY_SPEC ||
    descriptionSpec !== DEFAULT_DESCRIPTION_SPEC ||
    creativeReqs !== DEFAULT_CREATIVE_REQUIREMENTS;

  const handleResetPrompt = () => {
    setAiRole(DEFAULT_AI_ROLE);
    setHeadlineSpec(DEFAULT_HEADLINE_SPEC);
    setBodySpec(DEFAULT_BODY_SPEC);
    setDescriptionSpec(DEFAULT_DESCRIPTION_SPEC);
    setCreativeReqs(DEFAULT_CREATIVE_REQUIREMENTS);
  };

  if (!isOpen) return null;

  const isValid = description.trim().length >= 10;

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadedImagePreview(URL.createObjectURL(file));
    // Upload lên server để lấy URL
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await axiosInstance.post('/api/upload/media', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.success && res.data?.url) {
        setUploadedImageUrl(res.data.url);
      }
    } catch {
      toast.error('Không thể upload ảnh, vui lòng thử lại');
    }
  };

  const handleGenerate = async () => {
    if (!isValid) return;
    setIsGenerating(true);
    setVariants([]);
    setSelectedVariantId(null);

    // Build prompt hoàn chỉnh từ template (editable) + locked parts
    const finalPrompt = buildAdPrompt({
      aiRole,
      headlineSpec,
      bodySpec,
      descriptionSpec,
      creativeReqs,
      count,
      description: description.trim(),
      imageSource,
    });

    try {
      const res = await axiosInstance.post('/api/ai/generate-ad', {
        description: description.trim(),
        image_source: imageSource,
        uploaded_image_url: imageSource === 'upload' ? uploadedImageUrl : undefined,
        count,
        prompt: finalPrompt,
      }, {
        timeout: 150000, // 150s — Manus AI có thể mất đến 2 phút
      });

      if (res.data?.success && res.data?.variants) {
        setVariants(res.data.variants);
        setSelectedVariantId(res.data.variants[0]?.id);
      } else {
        toast.error(res.data?.message || 'Không thể tạo quảng cáo');
      }
    } catch (err) {
      toast.error('Lỗi kết nối', { description: err.response?.data?.message || err.message });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePickVariant = (variant) => {
    setSelectedVariantId(variant.id);
    onSelectVariant?.({
      headline: variant.headline,
      primaryText: variant.body,
      description: variant.description,
      imageUrl: variant.image_url,
    });
    toast.success('Đã điền nội dung vào form quảng cáo');
    handleClose();
  };

  const handleClose = () => {
    setVariants([]);
    setSelectedVariantId(null);
    onClose?.();
  };

  return (
    <div className="aipopup-overlay" onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div className="aipopup-modal">

        {/* ── Header ── */}
        <div className="aipopup-header">
          <div className="aipopup-header-left">
            <div className="aipopup-header-icon">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="aipopup-title">Tạo quảng cáo bằng AI</h2>
              <p className="aipopup-subtitle">Mô tả sản phẩm — AI tạo toàn bộ nội dung</p>
            </div>
          </div>
          <button className="aipopup-close" onClick={handleClose} aria-label="Đóng">
            <X size={20} />
          </button>
        </div>

        <div className="aipopup-body">

          {/* ── Form nhập liệu ── */}
          {variants.length === 0 && (
            <div className="aipopup-form">

              {/* Textarea mô tả */}
              <div className="aipopup-field">
                <label className="aipopup-label">
                  Mô tả sản phẩm / dịch vụ <span className="aipopup-required">*</span>
                </label>
                <textarea
                  className={`aipopup-textarea ${description && !isValid ? 'aipopup-textarea--error' : ''}`}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="VD: Khóa học IELTS online, cam kết đầu ra 7.0+, học phí 2.5 triệu/tháng, lớp nhỏ 5–8 học viên, giáo viên bản ngữ..."
                  rows={4}
                  disabled={isGenerating}
                />
                {description && !isValid && (
                  <p className="aipopup-hint-error">Vui lòng nhập ít nhất 10 ký tự.</p>
                )}
              </div>

              {/* Nguồn ảnh */}
              <div className="aipopup-field">
                <label className="aipopup-label">Nguồn ảnh quảng cáo</label>
                <div className="aipopup-source-grid">
                  <button
                    className={`aipopup-source-btn ${imageSource === 'upload' ? 'aipopup-source-btn--active' : ''}`}
                    onClick={() => setImageSource('upload')}
                    disabled={isGenerating}
                  >
                    <Upload size={20} />
                    <span>
                      <strong>Ảnh của tôi</strong>
                      <small>Upload từ máy tính</small>
                    </span>
                    {imageSource === 'upload' && <Check size={14} className="aipopup-source-check" />}
                  </button>

                  <button
                    className={`aipopup-source-btn ${imageSource === 'ai' ? 'aipopup-source-btn--active' : ''}`}
                    onClick={() => setImageSource('ai')}
                    disabled={isGenerating}
                  >
                    <Wand2 size={20} />
                    <span>
                      <strong>AI tạo ảnh</strong>
                      <small>Tự động theo nội dung</small>
                    </span>
                    {imageSource === 'ai' && <Check size={14} className="aipopup-source-check" />}
                  </button>
                </div>

                {/* Upload area khi chọn "upload" */}
                {imageSource === 'upload' && (
                  <div className="aipopup-upload-area" onClick={() => fileInputRef.current?.click()}>
                    {uploadedImagePreview ? (
                      <>
                        <img src={uploadedImagePreview} alt="Preview" className="aipopup-preview-img" />
                        <button
                          className="aipopup-preview-change"
                          onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                        >
                          Đổi ảnh
                        </button>
                      </>
                    ) : (
                      <>
                        <Upload size={26} className="aipopup-upload-icon" />
                        <span className="aipopup-upload-text">Nhấn để chọn ảnh</span>
                        <span className="aipopup-upload-hint">JPG, PNG — tối đa 10MB</span>
                      </>
                    )}
                    <input ref={fileInputRef} type="file" accept="image/*" className="aipopup-file-input" onChange={handleImageUpload} />
                  </div>
                )}
              </div>

              {/* Số bản */}
              <div className="aipopup-field aipopup-field--row">
                <label className="aipopup-label">Số bản cần tạo</label>
                <div className="aipopup-count-group">
                  {[2, 3].map((n) => (
                    <button
                      key={n}
                      className={`aipopup-count-btn ${count === n ? 'aipopup-count-btn--active' : ''}`}
                      onClick={() => setCount(n)}
                      disabled={isGenerating}
                    >
                      {n} bản
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Prompt Editor (collapsible) ── */}
              <div className="aipopup-prompt-section">
                <button
                  className="aipopup-prompt-toggle"
                  onClick={() => setShowPromptEditor((prev) => !prev)}
                  type="button"
                >
                  <div className="aipopup-prompt-toggle-left">
                    <Settings size={15} />
                    <span>Tùy chỉnh prompt AI</span>
                    {isPromptModified && (
                      <span className="aipopup-prompt-badge">Đã tùy chỉnh</span>
                    )}
                  </div>
                  {showPromptEditor ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {showPromptEditor && (
                  <div className="aipopup-prompt-editor">

                    {/* Vai trò AI */}
                    <div className="aipopup-prompt-field">
                      <label className="aipopup-prompt-label">Vai trò AI</label>
                      <textarea
                        className="aipopup-prompt-textarea aipopup-prompt-textarea--sm"
                        value={aiRole}
                        onChange={(e) => setAiRole(e.target.value)}
                        rows={2}
                        disabled={isGenerating}
                        placeholder="VD: Bạn là chuyên gia marketing Facebook Ads."
                      />
                    </div>

                    {/* Cấu trúc quảng cáo — 3 field riêng, tên field khóa cứng */}
                    <div className="aipopup-prompt-field">
                      <label className="aipopup-prompt-label">Cấu trúc mỗi bản quảng cáo</label>

                      <div className="aipopup-prompt-row">
                        <span className="aipopup-prompt-prefix">headline:</span>
                        <input
                          className="aipopup-prompt-input"
                          value={headlineSpec}
                          onChange={(e) => setHeadlineSpec(e.target.value)}
                          disabled={isGenerating}
                          placeholder="Tiêu đề hấp dẫn, tối đa 50 ký tự"
                        />
                      </div>

                      <div className="aipopup-prompt-row">
                        <span className="aipopup-prompt-prefix">body:</span>
                        <input
                          className="aipopup-prompt-input"
                          value={bodySpec}
                          onChange={(e) => setBodySpec(e.target.value)}
                          disabled={isGenerating}
                          placeholder="Nội dung chính thuyết phục, tối đa 200 ký tự"
                        />
                      </div>

                      <div className="aipopup-prompt-row">
                        <span className="aipopup-prompt-prefix">description:</span>
                        <input
                          className="aipopup-prompt-input"
                          value={descriptionSpec}
                          onChange={(e) => setDescriptionSpec(e.target.value)}
                          disabled={isGenerating}
                          placeholder="Mô tả ngắn, tối đa 40 ký tự"
                        />
                      </div>
                    </div>

                    {/* Yêu cầu sáng tạo */}
                    <div className="aipopup-prompt-field">
                      <label className="aipopup-prompt-label">Yêu cầu sáng tạo</label>
                      <textarea
                        className="aipopup-prompt-textarea"
                        value={creativeReqs}
                        onChange={(e) => setCreativeReqs(e.target.value)}
                        rows={4}
                        disabled={isGenerating}
                        placeholder="VD: - Tuân thủ chính sách quảng cáo Facebook..."
                      />
                    </div>

                    {/* Nút khôi phục mặc định */}
                    {isPromptModified && (
                      <button
                        className="aipopup-prompt-reset"
                        onClick={handleResetPrompt}
                        type="button"
                      >
                        <RotateCcw size={13} />
                        Khôi phục mặc định
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* CTA */}
              <button
                className="aipopup-generate-btn"
                onClick={handleGenerate}
                disabled={isGenerating || !isValid}
              >
                {isGenerating ? (
                  <><Loader2 size={18} className="aipopup-spin" /> Đang tạo quảng cáo...</>
                ) : (
                  <><Sparkles size={18} /> Tạo {count} bản quảng cáo</>
                )}
              </button>
            </div>
          )}

          {/* ── Trạng thái đang tạo ── */}
          {isGenerating && (
            <div className="aipopup-loading">
              <div className="aipopup-loading-ring" />
              <p className="aipopup-loading-text">AI đang phân tích và tạo nội dung...</p>
              <p className="aipopup-loading-hint">Quá trình có thể mất 15–30 giây</p>
            </div>
          )}

          {/* ── Kết quả variants ── */}
          {variants.length > 0 && !isGenerating && (
            <div className="aipopup-results">
              <div className="aipopup-results-header">
                <div>
                  <h3 className="aipopup-results-title">Chọn bản quảng cáo</h3>
                  <p className="aipopup-results-subtitle">
                    Nhấn <strong>"Chọn bản này"</strong> để điền tự động vào form
                  </p>
                </div>
                <button className="aipopup-regen-btn" onClick={() => setVariants([])}>
                  <RefreshCw size={14} /> Tạo lại
                </button>
              </div>

              <div className="aipopup-variants-grid">
                {variants.map((variant, idx) => (
                  <div
                    key={variant.id}
                    className={`aipopup-variant-card ${selectedVariantId === variant.id ? 'aipopup-variant-card--selected' : ''}`}
                    onClick={() => setSelectedVariantId(variant.id)}
                  >
                    <div className="aipopup-variant-badge">Bản {idx + 1}</div>

                    {variant.image_url && (
                      <div className="aipopup-variant-image">
                        <img src={variant.image_url} alt={`Bản ${idx + 1}`} loading="lazy" />
                      </div>
                    )}

                    <div className="aipopup-variant-body">
                      <div className="aipopup-variant-row">
                        <span className="aipopup-variant-lbl">Tiêu đề</span>
                        <p className="aipopup-variant-headline">{variant.headline}</p>
                      </div>
                      <div className="aipopup-variant-row">
                        <span className="aipopup-variant-lbl">Nội dung</span>
                        <p className="aipopup-variant-text">{variant.body}</p>
                      </div>
                      <div className="aipopup-variant-row">
                        <span className="aipopup-variant-lbl">Mô tả ngắn</span>
                        <p className="aipopup-variant-desc">{variant.description}</p>
                      </div>
                    </div>

                    <button
                      className={`aipopup-pick-btn ${selectedVariantId === variant.id ? 'aipopup-pick-btn--selected' : ''}`}
                      onClick={(e) => { e.stopPropagation(); handlePickVariant(variant); }}
                    >
                      {selectedVariantId === variant.id
                        ? <><Check size={15} /> Đang chọn</>
                        : 'Chọn bản này'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiPopup;
