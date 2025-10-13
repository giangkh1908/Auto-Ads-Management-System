import { useState } from 'react';
import { Circle, ChevronDown, Target, DollarSign, Calendar, Users, MapPin, Search } from 'lucide-react';

function AdsetStep({ adset, setAdset}) {
    const [selectedTags, setSelectedTags] = useState(
        adset.targeting?.location ? [adset.targeting.location] : ['Hoàn kiếm, Hà Nội, Việt Nam']
    );
    const [selectedInterests, setSelectedInterests] = useState(
        adset.targeting?.interests || ['Business (business & finance)']
    );

    return (
        <div className="adset-step">
            <div className="config-scroll-container">
                {/* Adset Name Section */}
                <div className="config-section">
                    <div className="section-header-ads">
                        <Circle size={8} fill="#2563eb" color="#2563eb" />
                        <h3 className="section-title-ads">Tên nhóm quảng cáo</h3>
                    </div>
                    <input
                        type="text"
                        className="adset-name-input"
                        value={adset.name}
                        onChange={(e) => setAdset(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Chiến dịch nhóm quảng cáo Lượt tương tác mới"
                    />
                </div>

                {/* Conversion Section */}
                <div className="config-section">
                    <div className="section-header-ads">
                        <Target size={16} color="#2563eb" />
                        <h3 className="section-title-ads">Lượt chuyển đổi</h3>
                    </div>
                    <select 
                        className="conversion-select"
                        value={adset.conversion || "destination"}
                        onChange={(e) => setAdset(prev => ({ ...prev, conversion: e.target.value }))}
                    >
                        <option value="destination">Đích đến của tin nhắn</option>
                        <option value="website">Trang web</option>
                    </select>
                </div>


                {/* Performance Goal Section */}
                <div className="config-section">
                    <div className="section-header-ads">
                        <Target size={16} color="#2563eb" />
                        <h3 className="section-title-ads">Mục tiêu hiệu quả</h3>
                    </div>
                    <select 
                        className="performance-select"
                        value={adset.performanceGoal || "purchase"}
                        onChange={(e) => setAdset(prev => ({ ...prev, performanceGoal: e.target.value }))}
                    >
                        <option value="purchase">Tối đa hóa số lượt mua qua tin nhắn</option>
                        <option value="chat">Tối đa hóa số cuộc trò chuyện</option>
                        <option value="potential">Tối đa hóa số khách hàng tiềm năng qua tin nhắn</option>
                    </select>
                </div>

                {/* Budget Section */}
                <div className="config-section">
                    <div className="section-header-ads">
                        <DollarSign size={16} color="#2563eb" />
                        <h3 className="section-title-ads">Ngân sách</h3>
                    </div>
                    <div className="budget-row">
                        <select 
                            className="budget-type"
                            value={adset.budgetType || "daily"}
                            onChange={(e) => setAdset(prev => ({ ...prev, budgetType: e.target.value }))}
                        >
                            <option value="daily">Ngân sách hàng ngày</option>
                            <option value="lifetime">Ngân sách tổng</option>
                        </select>
                        <div className="budget-input-group">
                            <input
                                type="text"
                                className="budget-input-text"
                                value={adset.budgetAmount ? adset.budgetAmount.toLocaleString("vi-VN") : "2.000.000"}
                                onChange={(e) => {
                                    const value = parseInt(e.target.value.replace(/[^\d]/g, ''));
                                    setAdset(prev => ({ ...prev, budgetAmount: value || 0 }));
                                }}
                            />
                            <div className="money-currency">VND</div>
                        </div>
                    </div>
                </div>

                {/* Date Range Section */}
                <div className="config-section-datetime">
                    <div className="left-custom">
                        <div className="section-header-ads">
                            <Calendar size={16} color="#2563eb" />
                            <h3 className="section-title-ads">Ngày bắt đầu</h3>
                        </div>
                        <input
                            type="datetime-local"
                            className="datetime-input-ads"
                            value={adset.startDate || "2025-04-14T12:22"}
                            onChange={(e) => setAdset(prev => ({ ...prev, startDate: e.target.value }))}
                        />
                    </div>
                    <div className="right-custom">
                        <div className="section-header-ads">
                            <Calendar size={16} color="#2563eb" />
                            <h3 className="section-title-ads">Ngày kết thúc</h3>
                        </div>
                        <input
                            type="datetime-local"
                            className="datetime-input-ads"
                            value={adset.endDate || "2025-05-14T12:22"}
                            onChange={(e) => setAdset(prev => ({ ...prev, endDate: e.target.value }))}
                        />
                    </div>
                </div>

                {/* Custom Audience Section */}
                <div className="config-section">
                    <div className="section-header-ads">
                        <Users size={16} color="#2563eb" />
                        <h3 className="section-title-ads">Đối tượng tùy chỉnh</h3>
                    </div>
                    <div className="audience-fields">
                        <div className="field-group">
                            <label className="field-label">Tuổi</label>
                            <div className="age-inputs">
                                <input
                                    type="number"
                                    className="age-input-adset"
                                    placeholder="18"
                                    value={adset.targeting?.ageMin || 18}
                                    onChange={(e) => setAdset(prev => ({ 
                                        ...prev, 
                                        targeting: { 
                                            ...prev.targeting, 
                                            ageMin: parseInt(e.target.value) || 18 
                                        } 
                                    }))}
                                />
                                <span>-</span>
                                <input
                                    type="number"
                                    className="age-input-adset"
                                    placeholder="65+"
                                    value={adset.targeting?.ageMax || 65}
                                    onChange={(e) => setAdset(prev => ({ 
                                        ...prev, 
                                        targeting: { 
                                            ...prev.targeting, 
                                            ageMax: parseInt(e.target.value) || 65 
                                        } 
                                    }))}
                                />
                                
                            </div>
                        </div>
                        <div className="field-group">
                            <label className="field-label">Giới tính</label>
                            <select 
                                className="gender-select"
                                value={adset.targeting?.gender || "all"}
                                onChange={(e) => setAdset(prev => ({ 
                                    ...prev, 
                                    targeting: { 
                                        ...prev.targeting, 
                                        gender: e.target.value 
                                    } 
                                }))}
                            >
                                <option value="all">Tất cả</option>
                                <option value="male">Nam</option>
                                <option value="female">Nữ</option>
                            </select>
                        </div>
                        <div className="field-group">
                            <label className="field-label">Ngôn ngữ</label>
                            <select 
                                className="language-select"
                                value={adset.targeting?.language || "vi"}
                                onChange={(e) => setAdset(prev => ({ 
                                    ...prev, 
                                    targeting: { 
                                        ...prev.targeting, 
                                        language: e.target.value 
                                    } 
                                }))}
                            >
                                <option value="all">Tất cả ngôn ngữ</option>
                                <option value="vi">Tiếng Việt</option>
                                <option value="en">English</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Location Section */}
                <div className="config-section">
                    <div className="section-header-ads">
                        <MapPin size={16} color="#2563eb" />
                        <h3 className="section-title-ads">Vị trí</h3>
                    </div>
                    <input
                        type="text"
                        className="location-input"
                        placeholder="Tìm kiếm vị trí"
                        value={selectedTags.join(', ')}
                        onChange={(e) => setSelectedTags(e.target.value.split(', ').filter(tag => tag.trim()))}
                    />
                    <div className="location-tags">
                        {selectedTags.map((tag, index) => (
                            <span key={index} className="tag">{tag}</span>
                        ))}
                    </div>
                </div>

                {/* Detailed Targeting Section */}
                <div className="config-section">
                    <div className="section-header-ads">
                        <Search size={16} color="#2563eb" />
                        <h3 className="section-title-ads">Nhằm mục tiêu chi tiết</h3>
                    </div>
                    <input
                        type="text"
                        className="targeting-input"
                        placeholder="Thêm thông tin nhân khẩu học, sở thích hoặc hành vi"
                        value={selectedInterests.join(', ')}
                        onChange={(e) => setSelectedInterests(e.target.value.split(', ').filter(interest => interest.trim()))}
                    />
                    <div className="targeting-tags">
                        {selectedInterests.map((interest, index) => (
                            <span key={index} className="tag">{interest}</span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdsetStep;