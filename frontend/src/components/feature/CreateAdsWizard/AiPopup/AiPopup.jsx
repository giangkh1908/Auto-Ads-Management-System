import React, { useState } from 'react';

const AiPopup = ({ isOpen, onClose, onConfirm }) => {
  const [aiConfig, setAiConfig] = useState({
    language: 'Tiếng Việt',
    tone: 'Chuyên Nghiệp',
    personalization: '',
    mainKeywords: '',
    synonymousKeywords: '',
    aiModel: 'gpt-4o-mini'
  });

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(aiConfig);
    onClose();
  };

  return (
    <div className="ai-config-modal-overlay" onClick={onClose}>
      <div className="ai-config-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ai-config-header">
          <h3>Auto Ads AI</h3>
          <button 
            className="ai-config-close"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        
        <div className="ai-config-form">
          {/* Ngôn Ngữ */}
          <div className="ai-config-field">
            <label className="ai-config-label">Ngôn Ngữ</label>
            <select 
              className="ai-config-select"
              value={aiConfig.language}
              onChange={(e) => setAiConfig(prev => ({ ...prev, language: e.target.value }))}
            >
              <option value="Tiếng Việt">Tiếng Việt</option>
              <option value="English">English</option>
              <option value="中文">中文</option>
            </select>
          </div>

          {/* Giọng Điệu */}
          <div className="ai-config-field">
            <label className="ai-config-label">Giọng Điệu</label>
            <select 
              className="ai-config-select"
              value={aiConfig.tone}
              onChange={(e) => setAiConfig(prev => ({ ...prev, tone: e.target.value }))}
            >
              <option value="Chuyên Nghiệp">Chuyên Nghiệp</option>
              <option value="Thân Thiện">Thân Thiện</option>
              <option value="Vui Vẻ">Vui Vẻ</option>
              <option value="Trang Trọng">Trang Trọng</option>
            </select>
          </div>

          {/* Cá nhân hóa */}
          <div className="ai-config-field">
            <label className="ai-config-label">Cá nhân hóa</label>
            <textarea
              className="ai-config-textarea"
              value={aiConfig.personalization}
              onChange={(e) => setAiConfig(prev => ({ ...prev, personalization: e.target.value }))}
              placeholder="Công ty, sản phẩm, cá nhân, hashtag,... bạn muốn đưa vào bài viết"
              rows={3}
            />
          </div>

          {/* Từ khóa chính */}
          <div className="ai-config-field">
            <label className="ai-config-label">Từ khóa chính</label>
            <input
              type="text"
              className="ai-config-input"
              value={aiConfig.mainKeywords}
              onChange={(e) => setAiConfig(prev => ({ ...prev, mainKeywords: e.target.value }))}
              placeholder="Nhập từ khóa chính"
            />
            <button 
              className="ai-config-button"
              onClick={() => {
                // TODO: Generate synonymous keywords
                console.log("Generate synonymous keywords");
              }}
            >
              Tạo từ khóa cùng nghĩa
            </button>
          </div>

          {/* Từ khóa cùng nghĩa */}
          <div className="ai-config-field">
            <label className="ai-config-label">Từ khóa cùng nghĩa</label>
            <input
              type="text"
              className="ai-config-input"
              value={aiConfig.synonymousKeywords}
              onChange={(e) => setAiConfig(prev => ({ ...prev, synonymousKeywords: e.target.value }))}
              placeholder="Từ khóa cùng nghĩa sẽ xuất hiện ở đây"
            />
          </div>

          {/* Model AI */}
          <div className="ai-config-field">
            <label className="ai-config-label">Model AI</label>
            <select 
              className="ai-config-select"
              value={aiConfig.aiModel}
              onChange={(e) => setAiConfig(prev => ({ ...prev, aiModel: e.target.value }))}
            >
              <option value="gpt-4o-mini">gpt-4o-mini</option>
              <option value="gpt-4o">gpt-4o</option>
              <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
            </select>
          </div>

          {/* Confirm Button */}
          <div className="ai-config-actions">
            <button 
              className="ai-config-confirm"
              onClick={handleConfirm}
            >
              Xác Nhận
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiPopup;
