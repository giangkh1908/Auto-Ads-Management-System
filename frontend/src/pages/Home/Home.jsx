import React, { useEffect } from 'react'
import './Home.css'

function Home({ onStart }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }, 0)
        return () => clearTimeout(timer)
    }, [])

    return (
        <div className="landing-page">
            {/* Hero Section */}
            <section className="hero-section">
                <span className="title-landing">☄️ Nền tảng quản lý Facebook Ads thế hệ mới</span>
                <div className="hero-content">
                    <div className="hero-text">
                        <h1 className="hero-title">
                            <span className="title-highlight">Tăng trưởng chiến dịch Facebook Ads</span>
                            <br />
                            <span className="title-sub">với AI vận hành tự động</span>
                        </h1>
                        <p className="hero-description">
                            Nền tảng quản lý Facebook Ads toàn diện giúp bạn tạo, quản lý và tối ưu hóa 
                            chiến dịch quảng cáo một cách tự động. Tăng ROI lên đến 300% với công nghệ AI tiên tiến.
                        </p>
                        <div className="hero-stats">
                            <div className="stat-item">
                                <span className="stat-number">500+</span>
                                <span className="stat-label">Doanh nghiệp tin dùng</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-number">95%</span>
                                <span className="stat-label">Tăng hiệu quả</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-number">24/7</span>
                                <span className="stat-label">Hỗ trợ chuyên nghiệp</span>
                            </div>
                        </div>
                        <div className="hero-cta">
                            <button className="btn-primary" onClick={onStart}>
                                <span className="btn-text">Dùng thử miễn phí</span>
                                <span className="btn-icon">→</span>
                            </button>
                            <button className="btn-secondary">
                                <span className="btn-text">Xem demo</span>
                                <span className="btn-icon">▶</span>
                            </button>
                        </div>
                    </div>
                    <div className="hero-visual">
                        <div className="dashboard-preview">
                            <div className="dashboard-header">
                                <div className="dashboard-dots">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                                <div className="dashboard-title">Facebook Ads Dashboard</div>
                            </div>
                            <div className="dashboard-content">
                                <div className="metric-card">
                                    <div className="metric-value">10.000.000 VNĐ</div>
                                    <div className="metric-label">Doanh thu hôm nay</div>
                                    <div className="metric-trend up">+15.2%</div>
                                </div>
                                <div className="metric-card">
                                    <div className="metric-value">4.4%</div>
                                    <div className="metric-label">CTR trung bình</div>
                                    <div className="metric-trend up">+8.1%</div>
                                </div>
                                <div className="chart-area">
                                    <div className="chart-bars">
                                        <div className="bar" style={{height: '20%'}}></div>
                                        <div className="bar" style={{height: '40%'}}></div>
                                        <div className="bar" style={{height: '60%'}}></div>
                                        <div className="bar" style={{height: '80%'}}></div>
                                        <div className="bar" style={{height: '100%'}}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features-section">
                <div className="container">
                    <h2 className="section-title">Tại sao chọn chúng tôi?</h2>
                    <p className="section-subtitle">Công nghệ tiên tiến, kết quả vượt trội</p>
                    
                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon">
                                <div className="icon-automation">⚡</div>
                            </div>
                            <h3 className="feature-title">Lập lịch tự động</h3>
                            <p className="feature-description">
                                Tự động hóa hoàn toàn việc tạo và quản lý chiến dịch quảng cáo. 
                                AI thông minh sẽ tối ưu hóa mọi thứ cho bạn.
                            </p>
                        </div>
                        
                        <div className="feature-card">
                            <div className="feature-icon">
                                <div className="icon-analytics">📊</div>
                            </div>
                            <h3 className="feature-title">Phân tích chuyên sâu</h3>
                            <p className="feature-description">
                                Báo cáo chi tiết và phân tích hiệu suất real-time. 
                                Hiểu rõ từng chi tiết để tối ưu hóa ROI tối đa.
                            </p>
                        </div>
                        
                        <div className="feature-card">
                            <div className="feature-icon">
                                <div className="icon-budget">💰</div>
                            </div>
                            <h3 className="feature-title">Tối ưu ngân sách</h3>
                            <p className="feature-description">
                                Công nghệ AI tự động điều chỉnh ngân sách để đạt hiệu quả cao nhất. 
                                Tiết kiệm chi phí, tăng doanh thu.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Partners Section */}
            {/* <section className="partners-section">
                <div className="container">
                    <p className="partners-kicker">Được tin dùng bởi các đội tăng trưởng</p>
                    <div className="partners-logos">
                        <div className="logo-chip">Acme Corp</div>
                        <div className="logo-chip">Nova Tech</div>
                        <div className="logo-chip">BlueOcean</div>
                        <div className="logo-chip">MetaMax</div>
                        <div className="logo-chip">AdGenius</div>
                    </div>
                </div>
            </section> */}

            {/* How It Works */}
            <section className="how-section">
                <div className="container">
                    <h2 className="section-title-how">Vận hành chỉ với 3 bước</h2>
                    <p className="section-subtitle">Thiết lập nhanh – Tối ưu tự động – Mở rộng dễ dàng</p>
                    <div className="how-grid">
                        <div className="how-card">
                            <div className="how-index">1</div>
                            <h3 className="how-title">Kết nối tài khoản</h3>
                            <p className="how-desc">Kết nối Business Manager và tài khoản quảng cáo Facebook trong vài phút.</p>
                        </div>
                        <div className="how-card">
                            <div className="how-index">2</div>
                            <h3 className="how-title">Tạo chiến dịch</h3>
                            <p className="how-desc">Sử dụng trình tạo chiến dịch thông minh và thư viện mẫu đã tối ưu.</p>
                        </div>
                        <div className="how-card">
                            <div className="how-index">3</div>
                            <h3 className="how-title">Tối ưu bằng AI</h3>
                            <p className="how-desc">AI tự động điều chỉnh ngân sách, lịch chạy, và phân phối để tối ưu ROI.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            {/* <section className="testimonials-section">
                <div className="container">
                    <h2 className="section-title">Khách hàng nói gì?</h2>
                    <div className="testimonials-grid">
                        <div className="testimonial-card">
                            <p className="quote">“Chi phí giảm 35% trong 2 tuần, doanh thu tăng đều.”</p>
                            <div className="author">Minh Anh – Ecom Lead</div>
                        </div>
                        <div className="testimonial-card">
                            <p className="quote">“Quy trình vận hành nhẹ nhàng hơn rất nhiều nhờ tự động hóa.”</p>
                            <div className="author">Quang Huy – Performance Manager</div>
                        </div>
                        <div className="testimonial-card">
                            <p className="quote">“Dashboard rõ ràng, insight theo thời gian thực cực hữu ích.”</p>
                            <div className="author">Lan Phương – Growth Marketer</div>
                        </div>
                    </div>
                </div>
            </section> */}

            {/* Pricing Preview */}
            <section className="pricing-preview-section">
                <div className="container">
                    <h2 className="section-title">Giá linh hoạt cho mọi đội ngũ</h2>
                    <div className="pricing-grid">
                        <div className="price-card">
                            <h3 className="price-name">Starter</h3>
                            <div className="price-value">0đ</div>
                            <ul className="price-features">
                                <li>Quản lý 1 tài khoản</li>
                                <li>Dashboard cơ bản</li>
                                <li>Hỗ trợ qua email</li>
                            </ul>
                        </div>
                        <div className="price-card">
                            <h3 className="price-name">Pro</h3>
                            <div className="price-value">890.000đ/tháng</div>
                            <ul className="price-features">
                                <li>Tối ưu ngân sách bằng AI</li>
                                <li>Báo cáo real-time</li>
                                <li>Hỗ trợ ưu tiên</li>
                            </ul>
                            <button className="upgrade-btn">Nâng cấp</button>
                        </div>
                        <div className="price-card">
                            <h3 className="price-name">Business</h3>
                            <div className="price-value">Liên hệ</div>
                            <ul className="price-features">
                                <li>Nhiều thành viên</li>
                                <li>Tùy chỉnh theo nhu cầu</li>
                                <li>CSKH chuyên trách</li>
                            </ul>
                            <button className="upgrade-btn">Liên hệ</button>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="container">
                    <div className="cta-content">
                        <h2 className="cta-title">Sẵn sàng tăng trưởng doanh thu?</h2>
                        <p className="cta-description">
                            Tham gia cùng hàng trăm doanh nghiệp đã tin tưởng và thành công với nền tảng của chúng tôi
                        </p>
                        <div className="cta-buttons">
                            <button className="btn-primary-large" onClick={onStart}>
                                <span className="btn-text">Bắt đầu miễn phí ngay</span>
                                <span className="btn-icon">🚀</span>
                            </button>
                            <button className="btn-outline">
                                <span className="btn-text">Liên hệ tư vấn</span>
                                <span className="btn-icon">💬</span>
                            </button>
                        </div>
                        <div className="cta-guarantee">
                            <span className="guarantee-text">✅ Không cần thẻ tín dụng • ✅ Hủy bất kỳ lúc nào • ✅ Hỗ trợ 24/7</span>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}

export default Home;


