import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FileText, Plus, Archive, Menu } from 'lucide-react'
import './Sidebar.css'

function Sidebar() {
    const { t } = useTranslation()
    const [isCollapsed, setIsCollapsed] = useState(false)
    const navigate = useNavigate()
    const location = useLocation()

    const getCurrentRoute = () => {
        const path = location.pathname
        if (path === '/') return 'home'
        return path.replace('/', '')
    }

    const currentRoute = getCurrentRoute()

    // Điều khiển class body khi sidebar thu gọn/mở rộng để layout chính căn chỉnh chính xác
    useEffect(() => {
        const cls = 'sidebar-collapsed'
        if (isCollapsed) {
            document.body.classList.add(cls)
        } else {
            document.body.classList.remove(cls)
        }
        return () => document.body.classList.remove(cls)
    }, [isCollapsed])

    const navItems = [
        { route: 'account-management', icon: FileText, label: t('sidebar.account') },
        { route: 'ads', icon: Plus, label: t('sidebar.ads_management') },
        { route: 'archive-ads', icon: Archive, label: 'Lưu trữ' },
    ]

    return (
        <aside className={`app-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
            <div className={`sidebar-header ${isCollapsed ? 'justify-center' : 'justify-between px-4'}`}>
                {!isCollapsed && <h2 className="sidebar-title">Facebook Ads</h2>}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="sidebar-toggle-btn"
                    title={isCollapsed ? "Mở rộng" : "Thu gọn"}
                >
                    <Menu size={20} />
                </button>
            </div>

            <nav className="sidebar-nav">
                <div className="sidebar-menu-list">
                    {navItems.map(({ route, icon: Icon, label }) => {
                        const isActive = currentRoute === route;
                        return (
                            <button
                                key={route}
                                className={`sidebar-item ${isActive ? 'active' : ''} ${isCollapsed ? 'justify-center' : 'px-3 gap-3'}`}
                                onClick={() => navigate(`/${route}`)}
                                title={isCollapsed ? label : undefined}
                            >
                                <Icon className="sidebar-icon" size={20} />
                                {!isCollapsed && <span className="sidebar-label">{label}</span>}
                            </button>
                        );
                    })}
                </div>
            </nav>
        </aside>
    )
}
export default Sidebar
