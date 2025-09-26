import React, { useState, useEffect, useRef } from 'react'

function AdsetStep({ adset, setAdset }) {
    const [isPerformanceOpen, setIsPerformanceOpen] = useState(false)
    const [selectedPerformanceGoal, setSelectedPerformanceGoal] = useState('purchase')
    const performanceRef = useRef(null)

    const performanceOptions = [
        { value: 'chat', title: 'Tối đa hóa số cuộc trò chuyện', description: 'Chúng tôi sẽ cố gắng hiển thị quảng cáo với những người có nhiều khả năng sẽ trò chuyện với bạn qua tin nhắn nhất', group: 'interaction' },
        { value: 'potential', title: 'Tối đa hóa số khách hàng tiềm năng qua tin nhắn', description: 'Chúng tôi sẽ cố gắng hiển thị quảng cáo của bạn với những người có nhiều khả năng nhất sẽ trở thành khách hàng tiềm năng qua tin nhắn', group: 'interaction' },
        { value: 'purchase', title: 'Tối đa hóa số lượt mua qua tin nhắn', description: 'Chúng tôi sẽ cố gắng hiển thị quảng cáo của bạn với những người có nhiều khả năng mua hàng qua tin nhắn nhất', group: 'interaction' },
        { value: 'click', title: 'Tối đa hóa số lượt click vào liên kết', description: 'Chúng tôi sẽ cố gắng hiển thị quảng cáo của bạn với những người có nhiều khả năng nhấp vào đó nhất', group: 'other' },
    ]

    useEffect(() => {
        function handleClickOutside(event) {
            if (performanceRef.current && !performanceRef.current.contains(event.target)) {
                setIsPerformanceOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <div className="panel adset-config-panel">
            <div className="adset-config-layout">
                <div className="adset-configuration">
                    <div className="config-scroll-container">
                        <div className="config-section">

                        {/* Adset Name */}
                            <div className="section-header">
                                <div className="section-bullet"></div>
                                <div className="section-title">Tên nhóm quảng cáo</div>
                            </div>
                            <div className="section-content">
                                <input
                                    type="text"
                                    value={adset.name}
                                    onChange={(e) => setAdset(prev => ({ ...prev, name: e.target.value }))}
                                    className="adset-name-input"
                                />
                            </div>
                        </div>

                        {/* Conversion Goal */}
                        <div className="config-section">
                            <div className="section-header">
                                <div className="section-bullet"></div>
                                <div className="section-title">Lượt chuyển đổi</div>
                            </div>
                            <div className="section-content">
                                <select className="conversion-select">
                                    <option>Trang web</option>
                                    <option>Ứng dụng</option>
                                </select>
                            </div>
                        </div>

                        {/* Facebook Page */}
                        <div className="config-section">
                            <div className="section-header">
                                <div className="section-bullet"></div>
                                <div className="section-title">Trang Facebook</div>
                            </div>
                            <div className="section-content">
                                <div className="facebook-page-selector">
                                    <div className="page-logo">Fchat</div>
                                    <div className="page-info">
                                        <div className="page-type">Trang Facebook</div>
                                        <div className="page-name">Fchat.vn</div>
                                    </div>
                                    <div className="page-edit">✏️</div>
                                </div>
                            </div>
                        </div>

                        {/* Performance Goal */}
                        <div className="config-section">
                            <div className="section-header">
                                <div className="section-bullet"></div>
                                <div className="section-title">Mục tiêu hiệu quả</div>
                            </div>
                            <div className="section-content">
                                <div className="radio-dropdown" ref={performanceRef}>
                                    <button
                                        type="button"
                                        className="radio-dropdown-header"
                                        onClick={() => setIsPerformanceOpen(prev => !prev)}
                                        aria-expanded={isPerformanceOpen}
                                    >
                                        <span>
                                            {performanceOptions.find(o => o.value === selectedPerformanceGoal)?.title}
                                        </span>
                                        <span className="dropdown-arrow">▼</span>
                                    </button>

                                    {isPerformanceOpen && (
                                        <div className="radio-dropdown-menu" role="listbox">
                                            <div className="radio-dropdown-group">
                                                <div className="radio-dropdown-group-title">Mục tiêu lượt tương tác</div>
                                                {performanceOptions.filter(o => o.group === 'interaction').map(option => (
                                                    <label key={option.value} className="radio-dropdown-option">
                                                        <input
                                                            type="radio"
                                                            name="performance-goal"
                                                            value={option.value}
                                                            checked={selectedPerformanceGoal === option.value}
                                                            onChange={(e) => {
                                                                setSelectedPerformanceGoal(e.target.value)
                                                                setIsPerformanceOpen(false)
                                                            }}
                                                        />
                                                        <div className="option-text">
                                                            <div className="option-title">{option.title}</div>
                                                            <div className="option-description">{option.description}</div>
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                            <div className="radio-dropdown-group">
                                                <div className="radio-dropdown-group-title">Mục tiêu khác</div>
                                                {performanceOptions.filter(o => o.group === 'other').map(option => (
                                                    <label key={option.value} className="radio-dropdown-option">
                                                        <input
                                                            type="radio"
                                                            name="performance-goal"
                                                            value={option.value}
                                                            checked={selectedPerformanceGoal === option.value}
                                                            onChange={(e) => {
                                                                setSelectedPerformanceGoal(e.target.value)
                                                                setIsPerformanceOpen(false)
                                                            }}
                                                        />
                                                        <div className="option-text">
                                                            <div className="option-title">{option.title}</div>
                                                            <div className="option-description">{option.description}</div>
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Budget */}
                         <div className="config-section">
                             <div className="section-header">
                                 <div className="section-bullet"></div>
                                 <div className="section-title">Ngân sách</div>
                             </div>
                             <div className="section-content">
                                 <div className="budget-row">
                                     <select className="budget-type-select">
                                         <option>Ngân sách hàng ngày</option>
                                         <option>Ngân sách tổng</option>
                                     </select>
                                     <div className="budget-input-group">
                                         <input
                                             type="text"
                                             className="budget-input" placeholder="0"
                                         />
                                         <span className="currency">VND</span>
                                     </div>
                                 </div>
                             </div>
                         </div>

                         {/* Start Date */}
                         <div className="config-section-datetime">
                            <div className = "right-section">
                                <div className="section-header">
                                    <div className="section-bullet"></div>
                                    <div className="section-title">Ngày bắt đầu</div>
                                </div>
                                <div className="section-content">
                                    <div className="datetime-input-group">
                                        <input
                                            type="datetime-local"
                                            value="2025-04-14T12:22"
                                            className="datetime-input"
                                        />
                                        {/* <div className="calendar-icon">📅</div> */}
                                    </div>
                                </div>
                             </div>
                            <div className = "left-section">
                                <div className="section-header">
                                    <div className="section-bullet"></div>
                                    <div className="section-title">Ngày kết thúc</div>
                                </div>
                                <div className="section-content">
                                    <div className="datetime-input-group">
                                        <input
                                            type="datetime-local"
                                            value="2025-05-14T12:22"
                                            className="datetime-input"
                                        />
                                        {/* <div className="calendar-icon">📅</div> */}
                                    </div>
                                </div>
                            </div>
                         </div>

                         {/* Custom Audience */}
                         <div className="config-section">
                             <div className="section-header">
                                 <div className="section-bullet"></div>
                                 <div className="section-title">Đối tượng tùy chỉnh</div>
                             </div>
                             <div className="section-content">
                                 <div className="audience-fields">
                                    {/* Set Age */}
                                    <div className = "right-custom">
                                        <div className="field-group">
                                            <label className="field-label">Tuổi</label>
                                            <div className="age-inputs">
                                                <input type="number" value="" className="age-input" placeholder="18"/>
                                                <input type="number" value="" className="age-input" placeholder="65"/>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Set Gender */}
                                    <div className = "center-custom">
                                     <div className="field-group">
                                         <label className="field-label">Giới tính</label>
                                         <select className="gender-select">
                                             <option>Tất cả</option>
                                             <option>Nam</option>
                                             <option>Nữ</option>
                                         </select>
                                     </div>
                                    </div>

                                    {/* Set Language */}
                                    <div className = "left-custom">
                                     <div className="field-group">
                                         <label className="field-label">Ngôn ngữ</label>
                                         <select className="language-select">
                                             <option>Tất cả ngôn ngữ</option>
                                             <option>Tiếng Việt</option>
                                             <option>English</option>
                                         </select>
                                     </div>
                                    </div>
                                 </div>
                             </div>
                         </div>

                         {/* Location */}
                         <div className="config-section">
                             <div className="section-header">
                                 <div className="section-bullet"></div>
                                 <div className="section-title">Vị trí</div>
                             </div>
                             <div className="section-content">
                                 <input
                                     type="text"
                                     placeholder="Tìm kiếm vị trí"
                                     className="location-input"
                                 />
                             </div>
                         </div>

                         {/* Targeting */}
                         <div className="config-section">
                             <div className="section-header">
                                 <div className="section-bullet"></div>
                                 <div className="section-title">Nhằm mục tiêu chi tiết</div>
                             </div>
                             <div className="section-content">
                                 <input
                                     type="text"
                                     placeholder="Thêm thông tin nhân khẩu học, sở thích hoặc hành vi"
                                     className="targeting-input"
                                 />
                             </div>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AdsetStep


