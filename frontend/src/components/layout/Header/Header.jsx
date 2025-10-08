import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth'
import './Header.css'
import avatar from '../../../assets/home.jpg';

function Header({ onLoginClick}) {

    const navigate = useNavigate()
    const { pathname } = useLocation()
    const [isScrolled, setIsScrolled] = useState(false)
    const { isAuthenticated, user, logout } = useAuth()
    const [openMenu, setOpenMenu] = useState(null); //"avatar", "user" || null

    useEffect(() => {
        const isHome = pathname === '/'
        if (!isHome) {
            setIsScrolled(true)
            return
        }

        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10)
        }
        handleScroll()
        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [pathname])

    // Đóng dropdown khi chuyển trang
    useEffect(() => {
        setOpenMenu(null)
    }, [pathname])

    // Đóng dropdown khi click ra ngoài
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (openMenu && !event.target.closest('.user-menu')) {
                setOpenMenu(null)
            }
        }

        if (openMenu) {
            document.addEventListener('mousedown', handleClickOutside)
            return () => document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [openMenu])
    
    const toggleMenu = (menu) => {
        setOpenMenu(openMenu === menu ? null : menu);
    };

    return (
        <header className={`app-header ${isScrolled ? 'scrolled' : ''}`}>
            <div className="header-content">
                <button onClick={() => navigate('/')}>
                    <h1 className="app-title">
                        <span className="app-name">F-Auto</span>
                    </h1>
                </button>
                {isAuthenticated && (
                    <div className="app-nav">
                        <button 
                            className={`nav-btn ${pathname === '/dashboard' ? 'active' : ''}`}
                            onClick={() => navigate('/dashboard')}
                        >💠 Dashboard
                        </button>

                        <button 
                            className={`nav-btn ${pathname === '/account-management' ? 'active' : ''}`}
                            onClick={() => navigate('/account-management')}
                        >📢 Facebook Ads
                        </button>

                        <button 
                            className={`nav-btn ${pathname === '/settings' ? 'active' : ''}`}
                            onClick={() => navigate('/settings')}
                        >⚙️ Cài đặt
                        </button>
                    </div>
                )}

                <div className="header-actions">
                    {isAuthenticated ? (
                        <div className="user-menu">
                            {/* Tên + Dropdown menu */}
                            <div className="user-greeting-wrapper">
                                <span 
                                    className="user-greeting"
                                    onClick={() => toggleMenu("user")}
                                    style={{ cursor: "pointer" }}
                                >
                                    <strong className="user-name-header">Xin chào, {user?.full_name} ▼</strong> 
                                </span>
                                {openMenu === "user" && (
                                    <ul className="dropdown-name">
                                        <li>{user?.full_name}</li>
                                        <li><a>Quản lý shop</a></li>
                                    </ul>
                                )}
                            </div>
                            {/* Avatar + dropdown */}
                            <div className="avatar-wrapper">
                                <img
                                    src={user?.avatar || avatar}
                                    alt="avatar"
                                    className="avatar"
                                    onClick={() => toggleMenu("avatar")}
                                />
                                {openMenu === "avatar" && (
                                    <div className="dropdown-avatar">
                                        <div className = "dropdown-infor-avatar">
                                            <b>{user?.full_name}</b>
                                            <small>FB ID: {user?.facebookId}<br/>
                                            Email: {user?.email}</small>
                                        </div>
                                        <div className = "dropdown-option-avatar">
                                            <li onClick={() => navigate('/profile')}>Hồ sơ</li>
                                            <li onClick={logout}>Đăng xuất</li>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                    ) : (
                        <button className="btn-login" onClick={onLoginClick}>
                            Đăng nhập
                        </button>
                    )}
                </div>
            </div>
        </header>
    )
}
export default Header