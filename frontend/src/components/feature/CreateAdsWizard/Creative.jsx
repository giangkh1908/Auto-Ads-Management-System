import React from 'react';
import { Play, ExternalLink, MessageCircle, ThumbsUp, Share, MoreHorizontal } from 'lucide-react';
import './Creative.css';

function Creative({ ad, campaign, adset: _adset }) { // eslint-disable-line no-unused-vars
  const getCTAColor = (cta) => {
    const ctaColors = {
      'Gửi tin nhắn': '#0084ff',
      'Tìm hiểu thêm': '#1877f2',
      'Mua ngay': '#42b883',
      'Đăng ký': '#ff6b6b',
      'Xem ngay': '#ffa726',
      'Truy cập ngay': '#26c6da',
      'Liên hệ ngay': '#ab47bc'
    };
    return ctaColors[cta] || '#1877f2';
  };

  const getMediaIcon = (mediaType) => {
    switch (mediaType) {
      case 'video':
        return <Play size={20} className="media-icon" />;
      case 'carousel':
        return <div className="carousel-icon">📷</div>;
      default:
        return <div className="image-icon">🖼️</div>;
    }
  };

  return (
    <div className="creative-preview">
      <div className="creative-container">
        {/* Facebook Post Style Creative */}
        <div className="facebook-post">
          {/* Header */}
          <div className="post-header">
            <div className="page-info">
              <div className="page-avatar">
                <div className="avatar-circle-creative">F</div>
              </div>
              <div className="page-details">
                <div className="page-name">{ad.page || campaign.facebookPage}</div>
                <div className="post-meta">
                  <span className="sponsored-badge">Được tài trợ</span>
                  <span className="post-time">2 giờ</span>
                </div>
              </div>
            </div>
            <button className="more-options">
              <MoreHorizontal size={16} />
            </button>
          </div>

          {/* Post Content */}
          <div className="post-content">
            <div className="post-text">
              {ad.primaryText || "Hãy giới thiệu về nội dung quảng cáo của bạn"}
            </div>
          </div>

          {/* Media Section */}
          <div className="post-media">
            <div className="media-container">
              {ad.mediaUrl ? (
                ad.media === "video" ? (
                  <video src={ad.mediaUrl} controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <img src={ad.mediaUrl} alt="Ad Creative" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )
              ) : (
                getMediaIcon(ad.media)
              )}
            </div>
          </div>


          {/* Ad Link Preview */}
          <div className="link-preview">
            <div className="link-content">
              <div className="link-image">
                <div className="placeholder-image">
                  <ExternalLink size={20} />
                </div>
              </div>
              <div className="link-details">
                <div className="link-title">{ad.headline || "Chat trong Messenger"}</div>
                <div className="link-description">
                  {ad.description || "Khám phá dịch vụ của chúng tôi và trải nghiệm những điều tuyệt vời nhất"}
                </div>
                <div className="link-domain">fchat.vn</div>
              </div>
            </div>
            <div
              className="cta-button"
              style={{ backgroundColor: getCTAColor(ad.cta) }}
            >
              {ad.cta || "Gửi tin nhắn"}
            </div>
          </div>

          {/* Engagement Bar */}
          <div className="engagement-bar">
            <div className="engagement-stats">
              <div className="stat-item">
                <ThumbsUp size={16} />
                <span>1.2K</span>
              </div>
              <div className="stat-item">
                <MessageCircle size={16} />
                <span>45</span>
              </div>
              <div className="stat-item">
                <Share size={16} />
                <span>12</span>
              </div>
            </div>
            <div className="engagement-actions">
              <button className="action-btn like-btn">
                <ThumbsUp size={16} />
                <span>Thích</span>
              </button>
              <button className="action-btn comment-btn">
                <MessageCircle size={16} />
                <span>Bình luận</span>
              </button>
              <button className="action-btn share-btn">
                <Share size={16} />
                <span>Chia sẻ</span>
              </button>
            </div>
          </div>
        </div>

        {/* Ad Details Panel */}
        {/* <div className="ad-details-panel">
          <h3>Chi tiết quảng cáo</h3>
          <div className="details-grid">
            <div className="detail-item">
              <label>Loại phương tiện:</label>
              <span className="media-type">
                {ad.media === 'image' ? 'Hình ảnh' : 
                 ad.media === 'video' ? 'Video' : 
                 ad.media === 'carousel' ? 'Carousel' : 'Hình ảnh'}
              </span>
            </div>
            <div className="detail-item">
              <label>Văn bản chính:</label>
              <span>{ad.primaryText || "Chưa có"}</span>
            </div>
            <div className="detail-item">
              <label>Tiêu đề:</label>
              <span>{ad.headline || "Chưa có"}</span>
            </div>
            <div className="detail-item">
              <label>Mô tả:</label>
              <span>{ad.description || "Chưa có"}</span>
            </div>
            <div className="detail-item">
              <label>Nút kêu gọi hành động:</label>
              <span className="cta-display" style={{ color: getCTAColor(ad.cta) }}>
                {ad.cta || "Chưa có"}
              </span>
            </div>
            <div className="detail-item">
              <label>URL đích:</label>
              <span className="url-display">
                {ad.destinationUrl || "https://fchat.vn"}
              </span>
            </div>
          </div> 
        </div>*/}
      </div>
    </div>
  );
}

export default Creative;
