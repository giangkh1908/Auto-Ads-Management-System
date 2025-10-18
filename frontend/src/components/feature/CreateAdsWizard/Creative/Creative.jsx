import React from 'react';
import { Play, ExternalLink, MessageCircle, ThumbsUp, Share, MoreHorizontal, Globe } from 'lucide-react';
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
                {campaign?.facebookPageAvatar ? (
                  <img
                    src={campaign.facebookPageAvatar}
                    alt={campaign.facebookPage || "Facebook Page"}
                    className="avatar-circle-creative"
                  />
                ) : campaign?.facebookPageId ? (
                  <img
                    src={`https://graph.facebook.com/${campaign.facebookPageId}/picture?type=square`}
                    alt={campaign.facebookPage || "Facebook Page"}
                    className="avatar-circle-creative"
                  />
                ) : (
                  <div className="avatar-circle-creative">
                    {(campaign?.facebookPage || ad?.page || "").charAt(0) || "F"}
                  </div>
                )}
              </div>
              <div className="page-details">
                <div className="page-name">{campaign?.facebookPage || ad?.page || "Facebook Page"}</div>
                <div className="post-meta">
                  <span className="sponsored-badge">Được tài trợ</span>
                  <span className="post-time"><Globe size = {14}/></span>
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
                <div className="link-domain">{ad.destinationUrl}</div>
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
      </div>
    </div>
  );
}

export default Creative;
