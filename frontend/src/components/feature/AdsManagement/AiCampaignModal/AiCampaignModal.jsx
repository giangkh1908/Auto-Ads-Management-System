import { useState, useRef } from 'react';
import {
    X, Sparkles, Loader2, ChevronRight, ChevronLeft,
    Globe, DollarSign, Image as ImageIcon, Check, RefreshCw, Zap,
    Target, Type, AlignLeft, Eye, Upload, Edit3, Save, MessageSquare,
    ThumbsUp, Share, MessageCircle, Calendar
} from 'lucide-react';
import './AiCampaignModal.css';

// MOCK DATA CHO DEMO
const MOCK_AI_RESULT = {
    campaign: {
        name: "Campaign Tương Tác - Khóa Học Python 2026",
        objective: "OUTCOME_ENGAGEMENT"
    },
    adset: {
        name: "AdSet - Nam/Nữ 18-35 - Toàn Quốc",
        optimization_goal: "CONVERSATIONS",
        age_min: 18,
        age_max: 35
    },
    ads: [
        {
            headline: "Khóa học Python cho người mới! 🚀",
            body: "Bạn chưa biết gì về code? Khóa học Python thực chiến này dành cho bạn. Cam kết có thể tự build tool sau 3 tuần. Học phí cực rẻ. Đăng ký ngay hôm nay để nhận ưu đãi!",
            description: "Học Python từ Zero đến Hero",
            call_to_action_type: "LEARN_MORE",
            image_url: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=500&auto=format&fit=crop"
        },
        {
            headline: "Trở thành dev Python trong 30 ngày 💻",
            body: "Tham gia lớp học cường độ cao với mentor 1-1. Hệ thống bài tập đa dạng, sát thực tế doanh nghiệp. Ưu đãi 50% học phí duy nhất hôm nay. Không yêu cầu đầu vào!",
            description: "Đăng ký nhận khóa học miễn phí!",
            call_to_action_type: "SIGN_UP",
            image_url: "https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=500&auto=format&fit=crop"
        },
        {
            headline: "Tự động hóa mọi thứ với Python 🤖",
            body: "Giải phóng bản thân khỏi các báo cáo nhàm chán hàng ngày. Khóa học dạy bạn cách viết script tự động hóa Excel, Web, File System chỉ với Python. Phù hợp cho dân văn phòng.",
            description: "Tiết kiệm 2h mỗi ngày",
            call_to_action_type: "LEARN_MORE",
            image_url: null
        }
    ]
};

export default function AiCampaignModal({
    isOpen,
    onClose,
    adAccountId,
    adPages = [], // Hiện tại AdsManagement.jsx truyền [] vào
    onSuccess,
}) {
    // HARDCODE PAGE ĐỂ DEMO (nếu truyền rỗng thì dùng mock)
    const displayPages = adPages.length > 0 ? adPages : [
        { id: "10123456", name: "Fanpage Máy Tính & Phụ Kiện" },
        { id: "50567890", name: "Thời Trang Hàng Hiệu" },
        { id: "98765432", name: "Lập trình viên nghèo" }
    ];

    const fileInputRef = useRef(null);
    const [step, setStep] = useState(1);

    // --- Step 1: Form inputs ---
    const [description, setDescription] = useState('Khóa học lập trình Python online thực chiến cho người mới bắt đầu. Cam kết đầu ra, học phí 5 triệu.');
    const [selectedPageId, setSelectedPageId] = useState(displayPages[0].id);
    const [landingUrl, setLandingUrl] = useState('https://python-khoahoc.example.com');
    const [dailyBudget, setDailyBudget] = useState('100000');
    const [adCount, setAdCount] = useState(3);

    // Time config
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState('');

    // Image config
    const [imageSource, setImageSource] = useState('ai'); // 'upload' | 'ai'
    const [uploadedImageUrl, setUploadedImageUrl] = useState(null);

    // --- Step 2 / 3: AI result ---
    const [aiResult, setAiResult] = useState(null);
    const [selectedAdIdx, setSelectedAdIdx] = useState(0);
    const [isPublishing, setIsPublishing] = useState(false);
    const [loadingMsg, setLoadingMsg] = useState('');

    // --- Edit mode (Step 3) ---
    const [editingAdIdx, setEditingAdIdx] = useState(null);
    const [editedAdTemp, setEditedAdTemp] = useState(null);

    // Edit Campaign Info State (Used inside Editor Overlay)
    const [editedCampaignTemp, setEditedCampaignTemp] = useState(null);

    // Helpers cho tiếng Việt
    const getObjectiveText = (obj) => {
        const textMap = { 'OUTCOME_ENGAGEMENT': 'Tương Tác', 'OUTCOME_TRAFFIC': 'Lưu Lượng Truy Cập' };
        return textMap[obj] || obj;
    };
    const getOptGoalText = (goal) => {
        const textMap = {
            'CONVERSATIONS': 'Tối đa hóa số lượng cuộc trò chuyện',
            'LINK_CLICKS': 'Tối đa hóa số lượng click vào liên kết',
            'POST_ENGAGEMENT': 'Tương tác với bài viết',
            'PAGE_LIKES': 'Thích Trang'
        };
        return textMap[goal] || goal;
    };

    if (!isOpen) return null;

    const isStep1Valid = description.trim().length >= 10 && landingUrl.trim().length > 5 && selectedPageId !== '' && startDate !== '';

    // Handle Upload Image (Demo)
    const handleImageUpload = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setUploadedImageUrl(URL.createObjectURL(file));
            setImageSource('upload');
        }
    };

    // ===== STEP 1 → 2: Gọi AI (MOCK) =====
    const handleGenerateMock = () => {
        if (!isStep1Valid) return;
        setStep(2);
        setLoadingMsg('Manus AI đang phân tích dữ liệu...');

        let msgIdx = 0;
        const msgs = [
            'Manus AI đang phân tích dữ liệu...',
            'Đang nghiên cứu Insight khách hàng mục tiêu...',
            'Đang chọn hình ảnh phù hợp...',
            'Đang tạo nội dung quảng cáo hấp dẫn...',
            'Chuẩn bị hoàn tất...',
        ];

        const msgInterval = setInterval(() => {
            msgIdx = (msgIdx + 1) % msgs.length;
            setLoadingMsg(msgs[msgIdx]);
        }, 800);

        setTimeout(() => {
            clearInterval(msgInterval);

            // Xử lý mock data theo số bản & ảnh
            let finalMock = JSON.parse(JSON.stringify(MOCK_AI_RESULT));
            finalMock.ads = finalMock.ads.slice(0, adCount);

            if (imageSource === 'upload' && uploadedImageUrl) {
                finalMock.ads.forEach(ad => ad.image_url = uploadedImageUrl);
            } else if (imageSource === 'ai') {
                // Giữ nguyên ảnh AI
            } else {
                // Nếu chọn không dùng ảnh hoặc fail
                finalMock.ads.forEach(ad => ad.image_url = null);
            }

            setAiResult(finalMock);
            setSelectedAdIdx(0);
            setStep(3);
        }, 4000); // Đợi 4s để demo UX
    };

    // ===== STEP 3: Mở CreateAdsWizard (MOCK) =====
    const handleContinueToWizard = () => {
        if (!aiResult) return;

        // Payload truyền sang Wizard chỉ lấy 1 Ad duy nhất mà user đã tick Chọn.
        const payload = {
            campaign: aiResult.campaign,
            adset: { ...aiResult.adset, start_time: startDate, end_time: endDate },
            ad: aiResult.ads[selectedAdIdx]
        };

        onSuccess?.(payload);
    };

    const handleReset = () => {
        setStep(1);
        setAiResult(null);
        setSelectedAdIdx(0);
    };

    // ===== INLINE EDIT =====
    const startEditing = (idx) => {
        setEditingAdIdx(idx);
        setEditedAdTemp({ ...aiResult.ads[idx] });
        setEditedCampaignTemp({
            campaignName: aiResult.campaign.name,
            adsetName: aiResult.adset.name,
            optGoal: aiResult.adset.optimization_goal,
            ageMin: aiResult.adset.age_min,
            ageMax: aiResult.adset.age_max
        });
    };

    const saveEditing = () => {
        const newResult = { ...aiResult };
        newResult.ads[editingAdIdx] = editedAdTemp;
        newResult.campaign.name = editedCampaignTemp.campaignName;
        newResult.adset.name = editedCampaignTemp.adsetName;
        newResult.adset.optimization_goal = editedCampaignTemp.optGoal;
        newResult.adset.age_min = editedCampaignTemp.ageMin;
        newResult.adset.age_max = editedCampaignTemp.ageMax;

        setAiResult(newResult);
        setEditingAdIdx(null);
        setEditedAdTemp(null);
        setEditedCampaignTemp(null);
    };

    const cancelEditing = () => {
        setEditingAdIdx(null);
        setEditedAdTemp(null);
        setEditedCampaignTemp(null);
    };

    const renderAdVariant = (ad, idx) => {
        const isSelected = selectedAdIdx === idx;
        const pageInfo = displayPages.find(p => p.id === selectedPageId) || { name: 'Fanpage của bạn' };

        // Nếu đang có 1 thẻ nào đó được edit, thì ẩn list đi để giao diện đỡ rối
        if (editingAdIdx !== null) return null;

        const getCTAText = (cta) => {
            const texts = {
                'LEARN_MORE': 'Tìm hiểu thêm', 'SIGN_UP': 'Đăng ký', 'SHOP_NOW': 'Mua ngay', 'LIKE_PAGE': 'Thích Trang'
            };
            return texts[cta] || 'Tìm hiểu thêm';
        };

        return (
            <div key={idx} className={`ai-variant-card ${isSelected ? 'selected' : ''}`}>
                <div className="ai-variant-hover-actions">
                    <button
                        className="ai-btn-action"
                        onClick={(e) => { e.stopPropagation(); startEditing(idx); }}
                        title="Sửa bản này"
                    >
                        <Edit3 size={14} /> Sửa nội dung
                    </button>
                </div>

                <div className="ai-fb-post" onClick={() => setSelectedAdIdx(idx)}>
                    <div className="ai-fb-header">
                        <div className="ai-fb-page-info">
                            <div className="ai-fb-avatar">
                                {pageInfo.name.charAt(0)}
                            </div>
                            <div className="ai-fb-page-details">
                                <span className="ai-fb-page-name">{pageInfo.name}</span>
                                <div className="ai-fb-meta">
                                    <span className="ai-fb-sponsored">Được tài trợ</span>
                                    <span>·</span>
                                    <Globe size={12} />
                                </div>
                            </div>
                        </div>
                        <div className="ai-fb-more">•••</div>
                    </div>

                    <div className="ai-fb-body">{ad.body}</div>

                    <div className="ai-fb-media">
                        {ad.image_url ? (
                            <img src={ad.image_url} alt="Ad media" />
                        ) : (
                            <div style={{ color: '#94a3b8', textAlign: 'center' }}>
                                <MessageSquare size={32} />
                                <div style={{ fontSize: 13, marginTop: 8 }}>Chưa có hình ảnh</div>
                            </div>
                        )}
                    </div>

                    <div className="ai-fb-link-preview">
                        <div className="ai-fb-link-details">
                            <span className="ai-fb-link-domain">{landingUrl.replace(/^https?:\/\//, '').split('/')[0] || 'example.com'}</span>
                            <span className="ai-fb-link-title">{ad.headline}</span>
                            <span className="ai-fb-link-desc">{ad.description}</span>
                        </div>
                        <button className="ai-fb-cta" style={{ backgroundColor: '#e4e6ea', color: '#1c1e21' }}>
                            {getCTAText(ad.call_to_action_type)}
                        </button>
                    </div>

                    <div className="ai-fb-engagement">
                        <button className="ai-fb-action"><ThumbsUp size={16} /> Thích</button>
                        <button className="ai-fb-action"><MessageCircle size={16} /> Bình luận</button>
                        <button className="ai-fb-action"><Share size={16} /> Chia sẻ</button>
                    </div>
                </div>

                <button
                    className="ai-variant-select-btn"
                    onClick={(e) => { e.stopPropagation(); setSelectedAdIdx(idx); }}
                >
                    {isSelected ? (
                        <><Check size={16} /> Đã chọn bản Preview {idx + 1}</>
                    ) : (
                        `Chọn bản Preview ${idx + 1}`
                    )}
                </button>
            </div>
        );
    };

    const renderEditorOverlay = () => {
        if (editingAdIdx === null || !editedAdTemp || !editedCampaignTemp) return null;

        return (
            <div className="ai-editor-overlay">
                <div className="ai-editor-header">
                    <h3>Chỉnh sửa toàn bộ thông tin (Bản mẫu {editingAdIdx + 1})</h3>
                    <button className="ai-modal-close" onClick={cancelEditing}>
                        <X size={20} />
                    </button>
                </div>

                <div className="ai-editor-content">
                    {/* Phần Campaign & AdSet */}
                    <div className="ai-border-b pb-4 mb-4" style={{ borderBottom: '1px solid #e2e8f0', marginBottom: '16px', paddingBottom: '16px' }}>
                        <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#1e293b' }}>Thông tin cơ bản (Áp dụng chung)</h4>

                        <div className="ai-form-group" style={{ marginBottom: '12px' }}>
                            <label>Tên chiến dịch</label>
                            <input
                                className="ai-input"
                                value={editedCampaignTemp.campaignName}
                                onChange={(e) => setEditedCampaignTemp({ ...editedCampaignTemp, campaignName: e.target.value })}
                            />
                        </div>

                        <div className="ai-form-group" style={{ marginBottom: '12px' }}>
                            <label>Tên nhóm quảng cáo (AdSet)</label>
                            <input
                                className="ai-input"
                                value={editedCampaignTemp.adsetName}
                                onChange={(e) => setEditedCampaignTemp({ ...editedCampaignTemp, adsetName: e.target.value })}
                            />
                        </div>

                        <div className="ai-form-row">
                            <div className="ai-form-group">
                                <label>Mục tiêu hiệu quả</label>
                                <select
                                    className="ai-select"
                                    value={editedCampaignTemp.optGoal}
                                    onChange={(e) => setEditedCampaignTemp({ ...editedCampaignTemp, optGoal: e.target.value })}
                                >
                                    <option value="CONVERSATIONS">Tối đa hóa số lượng cuộc trò chuyện</option>
                                    <option value="LINK_CLICKS">Tối đa hóa số lượng click vào liên kết</option>
                                </select>
                            </div>
                            <div className="ai-form-group" style={{ flex: 0.5 }}>
                                <label>Độ tuổi</label>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <input
                                        type="number" className="ai-input"
                                        value={editedCampaignTemp.ageMin}
                                        onChange={(e) => setEditedCampaignTemp({ ...editedCampaignTemp, ageMin: Number(e.target.value) })}
                                    />
                                    <span>-</span>
                                    <input
                                        type="number" className="ai-input"
                                        value={editedCampaignTemp.ageMax}
                                        onChange={(e) => setEditedCampaignTemp({ ...editedCampaignTemp, ageMax: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Phần nội dung Ad Variant */}
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#1e293b' }}>Nội dung bản thân quảng cáo</h4>
                    <div className="ai-form-group">
                        <label>Tiêu đề chính (Headline) - Tối đa 50 ký tự</label>
                        <input
                            type="text"
                            className="ai-input"
                            value={editedAdTemp.headline}
                            onChange={(e) => setEditedAdTemp({ ...editedAdTemp, headline: e.target.value })}
                            maxLength={50}
                        />
                    </div>
                    <div className="ai-form-group">
                        <label>Nội dung chính (Body)</label>
                        <textarea
                            className="ai-textarea"
                            value={editedAdTemp.body}
                            onChange={(e) => setEditedAdTemp({ ...editedAdTemp, body: e.target.value })}
                            rows={8}
                        />
                    </div>
                    <div className="ai-form-row">
                        <div className="ai-form-group">
                            <label>Mô tả liên kết (Description)</label>
                            <input
                                type="text"
                                className="ai-input"
                                value={editedAdTemp.description}
                                onChange={(e) => setEditedAdTemp({ ...editedAdTemp, description: e.target.value })}
                            />
                        </div>
                        <div className="ai-form-group">
                            <label>Nút kêu gọi hành động (CTA)</label>
                            <select
                                className="ai-select"
                                value={editedAdTemp.call_to_action_type}
                                onChange={(e) => setEditedAdTemp({ ...editedAdTemp, call_to_action_type: e.target.value })}
                            >
                                <option value="LEARN_MORE">Tìm hiểu thêm</option>
                                <option value="SIGN_UP">Đăng ký</option>
                                <option value="LIKE_PAGE">Thích Trang</option>
                                <option value="SHOP_NOW">Mua ngay</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="ai-editor-footer">
                    <button className="ai-btn-secondary" onClick={cancelEditing}>Hủy bỏ</button>
                    <button className="ai-btn-primary" onClick={saveEditing}>
                        <Check size={16} /> Xác nhận đã sửa thành công
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="ai-campaign-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="ai-campaign-modal">

                {/* Header */}
                <div className="ai-campaign-header">
                    <div className="ai-campaign-title">
                        <div className="ai-campaign-icon">
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <h2>Tạo chiến dịch bằng AI (Demo)</h2>
                            <p>Mô phỏng luồng Manus AI tạo chiến dịch - Không tốn Credits</p>
                        </div>
                    </div>
                    <button className="ai-modal-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* Step indicator */}
                <div className="ai-step-indicator">
                    {['Nhập thông tin', 'AI đang xử lý', 'Preview & Xác nhận'].map((label, i) => (
                        <div key={i} className={`ai-step ${step === i + 1 ? 'active' : step > i + 1 ? 'done' : ''}`}>
                            <div className="ai-step-circle">
                                {step > i + 1 ? <Check size={14} /> : i + 1}
                            </div>
                            <span>{label}</span>
                        </div>
                    ))}
                    <div className="ai-step-line" style={{ '--progress': `${((step - 1) / 2) * 100}%` }} />
                </div>

                {/* ==================== STEP 1 ==================== */}
                {step === 1 && (
                    <div className="ai-step-content">
                        <div className="ai-form-row">
                            <div className="ai-form-group">
                                <label>
                                    <Globe size={15} />
                                    Landing Page URL <span className="required">*</span>
                                </label>
                                <input
                                    type="url"
                                    className="ai-input"
                                    placeholder="https://example.com/san-pham"
                                    value={landingUrl}
                                    onChange={(e) => setLandingUrl(e.target.value)}
                                />
                            </div>

                            <div className="ai-form-group">
                                <label>
                                    <ImageIcon size={15} />
                                    Facebook Page <span className="required">*</span>
                                </label>
                                <select
                                    className="ai-select"
                                    value={selectedPageId}
                                    onChange={(e) => setSelectedPageId(e.target.value)}
                                >
                                    <option value="">-- Chọn Page --</option>
                                    {displayPages.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="ai-form-group">
                            <label>
                                <Zap size={15} />
                                Trình bày mong muốn / Mô tả dịch vụ của bạn <span className="required">*</span>
                            </label>
                            <textarea
                                className="ai-textarea"
                                placeholder="Khóa học lập trình Python, cam kết việc làm..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={4}
                                maxLength={500}
                            />
                            <div className="ai-char-count">{description.length}/500</div>
                        </div>

                        <div className="ai-form-row">
                            <div className="ai-form-group">
                                <label>
                                    <Calendar size={15} />
                                    Ngày bắt đầu <span className="required">*</span>
                                </label>
                                <input
                                    type="date"
                                    className="ai-input"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                            <div className="ai-form-group">
                                <label>
                                    <Calendar size={15} />
                                    Ngày kết thúc (Không trọn đời thì bỏ trống)
                                </label>
                                <input
                                    type="date"
                                    className="ai-input"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    min={startDate}
                                />
                            </div>
                        </div>

                        <div className="ai-form-row">
                            <div className="ai-form-group">
                                <label>Hình ảnh quảng cáo</label>
                                <div className="ai-image-source-options">
                                    <div
                                        className={`ai-img-option ${imageSource === 'ai' ? 'active' : ''}`}
                                        onClick={() => setImageSource('ai')}
                                    >
                                        <Sparkles size={16} /> Manus AI tự tạo
                                    </div>
                                    <div
                                        className={`ai-img-option ${imageSource === 'upload' ? 'active' : ''}`}
                                        onClick={() => {
                                            setImageSource('upload');
                                            if (!uploadedImageUrl) fileInputRef.current?.click();
                                        }}
                                    >
                                        <Upload size={16} /> Upload ảnh
                                    </div>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        style={{ display: 'none' }}
                                        accept="image/png, image/jpeg, image/jpg"
                                        onChange={handleImageUpload}
                                    />
                                </div>
                                {imageSource === 'upload' && uploadedImageUrl && (
                                    <div className="ai-uploaded-img-preview">
                                        <img src={uploadedImageUrl} alt="preview" />
                                        <button className="ai-remove-img" onClick={(e) => { e.stopPropagation(); setUploadedImageUrl(null); }}>
                                            <X size={12} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="ai-form-group">
                                <label>
                                    <Target size={15} />
                                    Số bản & Ngân sách
                                </label>
                                <div className="ai-count-selector" style={{ marginBottom: '8px' }}>
                                    {[1, 2, 3].map(n => (
                                        <button
                                            key={n}
                                            className={`ai-count-btn ${adCount === n ? 'active' : ''}`}
                                            onClick={() => setAdCount(n)}
                                        >
                                            {n} bản
                                        </button>
                                    ))}
                                </div>
                                <div className="ai-input-with-postfix">
                                    <input
                                        type="number"
                                        className="ai-input"
                                        value={dailyBudget}
                                        onChange={(e) => setDailyBudget(e.target.value)}
                                        min="50000"
                                        step="10000"
                                        style={{ width: '100%' }}
                                    />
                                    <span className="ai-input-postfix">VNĐ/ngày</span>
                                </div>
                            </div>
                        </div>

                        <div className="ai-modal-footer mt-auto">
                            <button className="ai-btn-secondary" onClick={onClose}>Hủy</button>
                            <button
                                className="ai-btn-primary"
                                onClick={handleGenerateMock}
                                disabled={!isStep1Valid}
                            >
                                <Sparkles size={16} />
                                Bắt đầu tạo (Demo)
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}

                {/* ==================== STEP 2: Loading ==================== */}
                {step === 2 && (
                    <div className="ai-step-content ai-loading-step">
                        <div className="ai-loading-visual">
                            <div className="ai-loading-rings">
                                <div className="ai-ring ring-1" />
                                <div className="ai-ring ring-2" />
                                <div className="ai-ring ring-3" />
                                <div className="ai-loading-center">
                                    <Sparkles size={32} className="ai-loading-sparkle" />
                                </div>
                            </div>
                        </div>
                        <h3 className="ai-loading-title">Manus AI đang làm việc...</h3>
                        <p className="ai-loading-msg">{loadingMsg}</p>
                        <div className="ai-loading-steps-list">
                            {[
                                'Xác định Insight khách hàng',
                                'Thiết lập tham số Tương Tác (Engagement)',
                                'Xây dựng thông điệp quảng cáo',
                                'Cấu hình nhắm mục tiêu (Targeting)'
                            ].map((item, i) => (
                                <div key={i} className="ai-loading-step-item">
                                    <Loader2 size={14} className="ai-spin" />
                                    <span>{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ==================== STEP 3: Review ==================== */}
                {step === 3 && aiResult && (
                    <div className="ai-step-content ai-review-step">
                        {/* Summary panel */}
                        <div className="ai-result-summary-panel">
                            <div className="ai-result-summary-row" style={{ justifyContent: 'space-between' }}>
                                <div>
                                    <span className="ai-summary-label">Chiến dịch:</span>
                                    <strong>{aiResult.campaign?.name}</strong>
                                    <span className="ai-badge">{getObjectiveText(aiResult.campaign?.objective)}</span>
                                </div>
                            </div>
                            <div className="ai-result-summary-row mt-2">
                                <span className="ai-summary-label">Nhóm (AdSet):</span>
                                <strong>{aiResult.adset?.name}</strong>
                            </div>
                            <div className="ai-result-summary-badges">
                                <div className="ai-badge-outline"><MessageCircle size={12} /> Vị trí chuyển đổi: Tin nhắn</div>
                                <div className="ai-badge-outline"><Target size={12} /> {getOptGoalText(aiResult.adset?.optimization_goal)}</div>
                                <div className="ai-badge-outline"><Calendar size={12} /> {startDate} {endDate ? `đến ${endDate}` : ''}</div>
                                <div className="ai-badge-outline"><Eye size={12} /> {aiResult.adset?.age_min} - {aiResult.adset?.age_max} tuổi</div>
                                <div className="ai-badge-outline"><Globe size={12} /> Việt Nam</div>
                                <div className="ai-badge-outline"><DollarSign size={12} /> {Number(dailyBudget).toLocaleString('vi-VN')} đ/ngày</div>
                            </div>
                        </div>

                        {/* Variants */}
                        <div className="ai-variants-label mt-2">
                            <Eye size={14} /> Xem trước {aiResult.ads?.length} bản mẫu và chọn bản để xuất bản:
                        </div>
                        <div className="ai-variants-list">
                            {aiResult.ads?.map(renderAdVariant)}
                        </div>

                        <div className="ai-modal-footer mt-auto pt-3">
                            <button className="ai-btn-ghost" onClick={handleReset}>
                                <RefreshCw size={14} /> Tạo lại từ đầu
                            </button>

                            <button
                                className="ai-btn-publish"
                                onClick={handleContinueToWizard}
                                disabled={isPublishing}
                            >
                                {isPublishing ? (
                                    <><Loader2 size={16} className="ai-spin" /> Đang chuyển dữ liệu...</>
                                ) : (
                                    <><Zap size={16} /> Tiếp Tục Chỉnh Sửa Thủ Công</>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Overlay Editor khi bấm Sửa */}
                {renderEditorOverlay()}
            </div>
        </div>
    );
}
