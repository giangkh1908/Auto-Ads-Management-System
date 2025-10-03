import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth'
import './Header.css'


function Header({ onLoginClick}) {
    const navigate = useNavigate()
    const { pathname } = useLocation()
    const [isScrolled, setIsScrolled] = useState(false)
    const { isAuthenticated, user, logout } = useAuth()

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
    
    return (
        <header className={`app-header ${isScrolled ? 'scrolled' : ''}`}>
            <div className="header-content">
                <button onClick={() => navigate('/')}>
                    <h1 className="app-title">
                        <span className="app-name">🤖 F-Auto</span>
                    </h1>
                </button>
                {/* <div className="app-nav">
                    <button className="nav-btn active">Overview</button>
                    <button className="nav-btn">Campaigns</button>
                    <button className="nav-btn">Ad Sets</button>
                    <button className="nav-btn">Ads</button>
                </div> */}
                <div className="header-actions">
                    {isAuthenticated ? (
                        <div className="user-menu">
                            <span className="user-greeting">
                                Xin chào, <strong>{user?.name}</strong>
                            </span>
                            <button className="btn-logout" onClick={logout}>
                                Đăng xuất
                            </button>
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