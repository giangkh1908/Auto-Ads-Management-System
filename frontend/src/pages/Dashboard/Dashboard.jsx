import { useState, useEffect, useRef } from 'react'
import './Dashboard.css'
import facebook_icon from '../../assets/facebook.png';

function Dashboard() {
    const [filterValue, setFilterValue] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [activeTab, setActiveTab] = useState('my-bots')
    const [openMenuId, setOpenMenuId] = useState(null)
    const menuRef = useRef(null)
    // Mock data for connected pages
    const connectedPages = [
        {
            id: 1,
            name: 'VitaCare',
            pageId: '714059785114043',
            avatar: 'https://fchat.vn/public/images/pages/714059785114043.png?1758639078',
            status: 'active',
            followerCount: 1
        }
    ]

    const handleRefresh = () => {
        console.log('Refreshing...')
    }

    const handleContribute = () => {
        console.log('Contributing page...')
    }

    const handleAddNewPage = () => {
        console.log('Adding new page...')
    }

    // Menu items data
    const menuItems = [
        { id: 'rename', icon: '✏️', text: 'Đổi tên page' },
        { id: 'pause', icon: '⏸️', text: 'Tạm dừng' },
        { id: 'disconnect', icon: '🔌', text: 'Ngắt kết nối' },
        { id: 'refresh', icon: '🔄', text: 'Làm mới kết nối' },
        { id: 'switch', icon: '↔️', text: 'Chuyển shop' },
        { id: 'notifications', icon: '🔔', text: 'Thông báo' },
        { id: 'customers', icon: '👥', text: 'Khách hàng' },
        { id: 'livechat', icon: '💬', text: 'Livechat' },
        { id: 'chatbot', icon: '🤖', text: 'Chatbot' },
        { id: 'campaigns', icon: '▶️', text: 'Chiến dịch' },
        { id: 'sequence', icon: '📅', text: 'Sequence' },
        { id: 'keywords', icon: '🔑', text: 'Từ khóa' },
        { id: 'settings', icon: '⚙️', text: 'Cài đặt page' }
    ]

    const handlePageMenu = (pageId) => {
        setOpenMenuId(openMenuId === pageId ? null : pageId)
    }

    const handleMenuItemClick = (pageId, itemId) => {
        console.log(`Action ${itemId} for page ${pageId}`)
        setOpenMenuId(null)
    }

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setOpenMenuId(null)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    return (
        <div className="dashboard-layout">
            <div className="dashboard-content">
                <div className="dashboard-center">
                    {/* Header with tabs */}
                    <div className="dashboard-header">
                        <div className="dashboard-tabs">
                            <button 
                                className={`tab-button ${activeTab === 'my-bots' ? 'active' : ''}`}
                                onClick={() => setActiveTab('my-bots')}
                            >
                            Page của tôi
                            </button>
                            {/* <button 
                                className={`tab-button ${activeTab === 'template-bots' ? 'active' : ''}`}
                                onClick={() => setActiveTab('template-bots')}
                            >
                                Bot mẫu
                            </button> */}
                            {/* <button 
                                className={`tab-button ${activeTab === 'facebook-ads' ? 'active' : ''}`}
                                onClick={() => setActiveTab('facebook-ads')}
                            >
                                Facebook Ads
                            </button> */}
                        </div>

                        <div className="dashboard-controls">
                            <select 
                                className="filter-dropdown"
                                value={filterValue}
                                onChange={(e) => setFilterValue(e.target.value)}
                            >
                                <option value="all">Tất cả</option>
                                <option value="active">Hoạt động</option>
                                <option value="inactive">Không hoạt động</option>
                            </select>

                            <div className="search-box">
                                <input 
                                    type="text"
                                    className="search-input"
                                    placeholder="Tìm kiếm"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <button className="search-button">
                                🔎
                                </button>
                            </div>

                            <button className="btn-refresh" onClick={handleRefresh}>
                            ⟳ Refresh
                            </button>

                            <button className="btn-contribute" onClick={handleContribute}>
                            🔗 Gộp Page
                            </button>
                        </div>
                    </div>

                <div className="dashboard-content-body">
                    {/* Page cards grid */}
                    <div className="pages-grid">
                        {/* Add new page card */}
                        <div className="page-card add-page-card" onClick={handleAddNewPage}>
                            <div className="add-page-content">
                                <div className="add-icon">
                                ➕
                                </div>
                                <div className="add-page-text">
                                    Kết nối page mới (1/10)
                                </div>
                            </div>
                        </div>

                        {/* Connected pages */}
                        {connectedPages.map((page) => (
                            <div key={page.id} className="page-card connected-page-card">
                                <div className="page-card-header">
                                    <div className="page-avatar-dashboard">
                                        <img 
                                            src={page.avatar} 
                                            alt={page.name}
                                        />
                                    </div>
                                    <div className="page-info-dashboard">
                                        <h3 className="page-name-dashboard">{page.name}</h3>
                                        <p className="page-id-dashboard">{page.pageId}</p>
                                        <div className="page-stats">
                                            <div className="page-stats-left">
                                                <span className="follower-count"> 
                                                <img src={facebook_icon} alt="Facebook" className="fb_icon" />
                                                {page.followerCount}
                                                </span>
                                            </div>
                                            <div className="page-stats-right">
                                                <span className="page-status active">Hoạt động</span>
                                                <div className="page-menu-container" ref={menuRef}>
                                                    <button 
                                                        className="page-menu-button" 
                                                        onClick={() => handlePageMenu(page.id)}
                                                    >
                                                        ⋮
                                                    </button>
                                                    {openMenuId === page.id && (
                                                        <div className="page-dropdown-menu">
                                                            {menuItems.map((item) => (
                                                                <button
                                                                    key={item.id}
                                                                    className="dropdown-menu-item"
                                                                    onClick={() => handleMenuItemClick(page.id, item.id)}
                                                                >
                                                                    <span className="menu-item-icon">{item.icon}</span>
                                                                    <span className="menu-item-text">{item.text}</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div> 
                                </div>  
                            </div>
                        ))}
                    </div>
                </div>
                </div>
            </div>
        </div>
    )
}

export default Dashboard