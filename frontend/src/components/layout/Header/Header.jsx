import React from 'react'
import './Header.css'
import Avatar from '../../../assets/home.jpg'


function Header({ onLoginClick}) {
    return (
        <header className="app-header">
            <div className="header-content">
                <a href = "#home">
                    <h1 className="app-title">
                        <span className="app-name">🤖 FB Ads Manager</span>
                    </h1>
                </a>
                {/* <div className="app-nav">
                    <button className="nav-btn active">Overview</button>
                    <button className="nav-btn">Campaigns</button>
                    <button className="nav-btn">Ad Sets</button>
                    <button className="nav-btn">Ads</button>
                </div> */}
                <div>
                    <button className = "btn-login" onClick={onLoginClick}>Đăng nhập</button>
                    {/* <button className = "btn-register" onClick={onRegisterClick}>Đăng ký</button> */}
                </div>
            </div>
        </header>
    )
}
export default Header