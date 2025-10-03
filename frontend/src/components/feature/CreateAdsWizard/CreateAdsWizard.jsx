import { useState, useEffect, useRef } from 'react'
import CampaignStep from './CampaignStep'
import AdsetStep from './AdsetStep'
import AdStep from './AdStep'
import './CreateAdsWizard.css'

function CreateAdsWizard({ onClose }) {
    const [wizardStep, setWizardStep] = useState(0)
    const contentRef = useRef(null)

    // Objectives data with descriptions and suitable tags
    const objectivesData = {
        AWARENESS: {
            title: 'Mức độ nhận biết',
            description: 'Hiển thị quảng cáo cho những người có nhiều khả năng nhớ đến quảng cáo nhất',
            suitableTags: [
                'Số người tiếp cận',
                'Mức độ nhận biết thương hiệu',
                'Lượt xem video',
                'Mức độ nhận biết về vị trí của hàng'
            ]
        },
        TRAFFIC: {
            title: 'Lưu lượng truy cập',
            description: 'Chuyển mọi người tới một đích đến nào đó, chẳng hạn như trang web, ứng dụng, trang cá nhân Instagram hoặc sự kiện trên Facebook',
            suitableTags: [
                'Lượt click vào liên kết',
                'Lượt xem trang đích',
                'Lượt truy cập vào trang cá nhân Instagram',
                'Messenger, Instagram và WhatsApp',
                'Cuộc gọi'
            ]
        },
        ENGAGEMENT: {
            title: 'Lượt tương tác',
            description: 'Tăng số tin nhắn, lượt mua qua tin nhắn, lượt xem video, lượt tương tác với bài viết, lượt thích Trang hoặc lượt phản hồi sự kiện',
            suitableTags: [
                'Messenger, Instagram và WhatsApp',
                'Lượt xem video',
                'Lượt tương tác với bài viết',
                'Lượt chuyển đổi',
                'Cuộc gọi'
            ]
        },
        LEADS: {
            title: 'Khách hàng tiềm năng',
            description: 'Tìm kiếm khách hàng tiềm năng cho doanh nghiệp hoặc thương hiệu của bạn',
            suitableTags: [
                'Trang web và mẫu phản hồi tức thì',
                'Mẫu phản hồi tức thì',
                'Messenger, Instagram và WhatsApp',
                'Lượt chuyển dổi    ',
                'Cuộc gọi'
            ]
        },
        APP_PROMOTION: {
            title: 'Quảng cáo ứng dụng',
            description: 'Thu hút những người mới cài đặt và tiếp tục sử dụng ứng dụng của bạnbạn',
            suitableTags: [
                'Lượt cài đặt ứng dụng',
                'Sự kiện trong ứng dụng'
            ]
        },
        SALES: {
            title: 'Doanh số',
            description: 'Tìm những người có khả năng sẽ mua sản phẩm hoặc dịch vụ của bạn',
            suitableTags: [
                'Lượt chuyển đổi',
                'Doanh số theo danh mục',
                'Messenger, Instagram và WhatsApp',
                'Cuộc gọi'
            ]
        }
    }

    const [campaign, setCampaign] = useState({
        objective: 'ENGAGEMENT',
        name: 'Lead Mess Chatbot Fchat',
        budgetType: 'CAMPAIGN',
    })
    const [adset, setAdset] = useState({
        name: 'Nhóm quảng cáo Lượt tương tác mới',
        schedule: { start: '', end: '' },
        budget: 2000000,
        placement: 'AUTOMATIC',
        targeting: { location: 'Việt Nam', ageMin: 18, ageMax: 45 },
    })
    const [ad, setAd] = useState({
        name: 'Quảng cáo Lượt tương tác mới',
        page: 'Fchat.vn',
        media: 'image',
        primaryText: 'Hãy giới thiệu về nội dung quảng cáo của bạn',
        headline: 'Chat trong Messenger',
        cta: 'Gửi tin nhắn',
    })

    // Lock background scroll while wizard is open
    useEffect(() => {
        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = previousOverflow
        }
    }, [])

    // Scroll to top when wizard step changes
    useEffect(() => {
        if (contentRef.current) {
            contentRef.current.scrollTo({
                top: 0,
                behavior: 'smooth'
            })
        }
    }, [wizardStep])

    return (
        <div className="ads-modal-overlay" role="dialog" aria-modal="true">
            <div className="ads-modal">
                <div className="ads-modal-header">
                    <div className="ads-modal-title">Tạo chiến dịch</div>
                    {/* <button className="ads-modal-close" onClick={onClose}>✕</button> */}
                </div>

                <div className="ads-modal-body">

                    {/* Unified Left Panel - Campaign Hierarchy (hidden for step 0) */}
                    {wizardStep > 0 && (
                        <div className="wizard-sidebar">
                            <div className="hierarchy-container">
                                <div className="hierarchy-title">Cấu trúc chiến dịch</div>
                                <div className="hierarchy-list">
                                    <div 
                                        className={`hierarchy-item campaign-item ${wizardStep === 1 ? 'current' : wizardStep > 1 ? 'completed' : ''}`}
                                        onClick={() => setWizardStep(1)}
                                    >
                                        <div className="hierarchy-icon">📁</div>
                                        <div className="hierarchy-content">
                                            <div className="hierarchy-label">Chiến dịch</div>
                                            <div className="hierarchy-name">{campaign.name}</div>
                                        </div>
                                        <div className="hierarchy-status">
                                            {wizardStep > 1 ? '✓' : wizardStep === 1 ? '●' : ''}
                                        </div>
                                    </div>
                                    
                                    <div 
                                        className={`hierarchy-item adset-item ${wizardStep === 2 ? 'current' : wizardStep > 2 ? 'completed' : ''}`}
                                        onClick={() => setWizardStep(2)}
                                    >
                                        <div className="hierarchy-icon">⊞</div>
                                        <div className="hierarchy-content">
                                            <div className="hierarchy-label">Nhóm quảng cáo</div>
                                            <div className="hierarchy-name">{adset.name}</div>
                                        </div>
                                        <div className="hierarchy-status">
                                            {wizardStep > 2 ? '✓' : wizardStep === 2 ? '●' : ''}
                                        </div>
                                    </div>
                                    
                                    <div 
                                        className={`hierarchy-item ad-item ${wizardStep === 3 ? 'current' : ''}`}
                                        onClick={() => setWizardStep(3)}
                                    >
                                        <div className="hierarchy-icon">📄</div>
                                        <div className="hierarchy-content">
                                            <div className="hierarchy-label">Quảng cáo</div>
                                            <div className="hierarchy-name">{ad.name}</div>
                                        </div>
                                        <div className="hierarchy-status">
                                            {wizardStep === 3 ? '●' : ''}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="wizard-content" ref={contentRef}>
                        {wizardStep === 0 && (
                            <div className="panel objectives-panel">
                                <div className="objectives-layout">

                                    {/* Left Panel - Objectives List */}
                                    <div className="objectives-sidebar">
                                        <div className="objectives-title">Chọn mục tiêu chiến dịch</div>
                                        <div className="objectives-list">
                                            {[
                                                { key: 'AWARENESS', icon: '📢' },
                                                { key: 'TRAFFIC', icon: '➡️' },
                                                { key: 'ENGAGEMENT', icon: '💬' },
                                                { key: 'LEADS', icon: '🔍' },
                                                { key: 'APP_PROMOTION', icon: '👥' },
                                                { key: 'SALES', icon: '🛍️' },
                                            ].map(item => (
                                                <label key={item.key} className={`objective-item ${campaign.objective === item.key ? 'selected' : ''}`}>
                                                    <input
                                                        type="radio"
                                                        name="objective"
                                                        value={item.key}
                                                        checked={campaign.objective === item.key}
                                                        onChange={(e) => setCampaign(prev => ({ ...prev, objective: e.target.value }))}
                                                    />
                                                    <div className="objective-icon">{item.icon}</div>
                                                    <div className="objective-label">
                                                        <span className="objective-name">{objectivesData[item.key].title}</span>
                                                        {item.key === 'ENGAGEMENT' && <span className="recommended-tag">Đề xuất</span>}
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Right Panel - Objective Details */}
                                    <div className="objective-details">
                                        <div className="objective-image-placeholder">
                                            <div className="placeholder-circle"></div>
                                        </div>
                                        <div className="objective-detail-title">
                                            {objectivesData[campaign.objective].title}
                                        </div>
                                        <div className="objective-description">
                                            {objectivesData[campaign.objective].description}
                                        </div>
                                        <div className="suitable-for-section">
                                            <div className="suitable-for-title">Phù hợp với</div>
                                            <div className="suitable-tags">
                                                {objectivesData[campaign.objective].suitableTags.map((tag, index) => (
                                                    <span key={index} className="suitable-tag">{tag}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Campaign Details Panel */}
                        {wizardStep === 1 && (
                            <CampaignStep campaign={campaign} setCampaign={setCampaign} />
                        )}

                        {/* Adset Details Panel */}
                        {wizardStep === 2 && (
                            <AdsetStep adset={adset} setAdset={setAdset} /> 
                        )}

                        {/* Ad Details Panel */}
                        {wizardStep === 3 && (
                            <AdStep ad={ad} setAd={setAd} />
                        )}

                    </div>
                </div>

                {/* Wizard Footer */}
                <div className="ads-modal-footer">
                    {wizardStep === 0 ? (
                        <>
                            <button className="btn-secondary" onClick={onClose}>Hủy</button>
                            <div className="spacer" />
                            <button className="btn-primary" onClick={() => setWizardStep(prev => Math.min(3, prev + 1))}>Tiếp tục</button>
                        </>
                    ) : (
                        <>
                            <button className="btn-secondary" onClick={onClose}>Đóng</button>
                            <div className="spacer" />
                            {wizardStep > 0 && <button className="btn-secondary" onClick={() => setWizardStep(prev => Math.max(0, prev - 1))}>Quay lại</button>}
                            {wizardStep < 3 && <button className="btn-primary" onClick={() => setWizardStep(prev => Math.min(3, prev + 1))}>Tiếp tục</button>}
                            {wizardStep === 3 && <button className="btn-post" onClick={onClose}>Đăng</button>}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

export default CreateAdsWizard


