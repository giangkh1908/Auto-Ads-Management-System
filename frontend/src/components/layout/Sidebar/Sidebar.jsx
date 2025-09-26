import React, { useEffect, useState } from 'react'
import './Sidebar.css'

function Sidebar() {
    const [isHovered, setIsHovered] = useState(false)
    const [currentRoute, setCurrentRoute] = useState('home')
    
    // Kiểm soát sự kiện thay đổi của trang
    useEffect(() => {
        const syncRoute = () => {
            const hash = window.location.hash.replace('#', '')
            setCurrentRoute(hash || 'home')
        }
        syncRoute()
        window.addEventListener('hashchange', syncRoute)
        return () => window.removeEventListener('hashchange', syncRoute)
    }, [])
    
    //Kiểm soát sự kiện di chuột vào Sidebar
    useEffect(() => {
        const cls = 'sidebar-collapsed'
        if (!isHovered) {
            document.body.classList.add(cls)
        } else {
            document.body.classList.remove(cls)
        }
        return () => document.body.classList.remove(cls)
    }, [isHovered])
    
    return (
        <aside 
            className={`app-sidebar ${!isHovered ? 'collapsed' : ''}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <nav className="sidebar-nav">
                <ul>
                    <li>
                        <a 
                            // Làm cho mục Sidebar tương ứng với trang hiện tại trở nên nổi bật (tương tự)
                            className={`sidebar-item ${currentRoute === 'account-management' ? 'active' : ''}`} 
                            href="#account-management"
                        >
                            <span className="sidebar-icon">🧾</span>
                            <span className="sidebar-label">Tài khoản</span>
                        </a>
                    </li>
                    <li>
                        <a 
                            className={`sidebar-item ${currentRoute === 'ads' ? 'active' : ''}`} 
                            href="#ads"
                        >
                            <span className="sidebar-icon">➕</span>
                            <span className="sidebar-label">Quản lý quảng cáo</span>
                        </a>
                    </li>
                    <li>
                        <a 
                            className={`sidebar-item ${currentRoute === 'reports' ? 'active' : ''}`} 
                            href="#reports"
                        >
                            <span className="sidebar-icon">📊</span>
                            <span className="sidebar-label">Báo cáo</span>
                        </a>
                    </li>
                    <li>
                        <a 
                            className={`sidebar-item ${currentRoute === 'stats' ? 'active' : ''}`} 
                            href="#stats"
                        >
                            <span className="sidebar-icon">📈</span>
                            <span className="sidebar-label">Thống kê</span>
                        </a>
                    </li>
                </ul>
            </nav>
        </aside>
    )
}
export default Sidebar
