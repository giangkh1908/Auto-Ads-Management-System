import React from 'react'
import './Home.css'


function Home({ onStart }) {
    return (
        <div className="home">
            <h1 className="hero-title">Facebook Ads Manager</h1>
            <p className="hero-subtitle">Quản lý chiến dịch, nhóm quảng cáo và quảng cáo một cách trực quan.</p>
            <div className="hero-visual"></div>
            <div className="hero-cta">
                <button className="btn-primary" onClick={onStart}>Bắt đầu ngay</button>
                <button className="btn-secondary">Tìm hiểu thêm</button>
            </div>
        </div>
    )
}
export default Home;


