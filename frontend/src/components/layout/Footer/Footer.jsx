import './Footer.css'

function Footer() {
    return (
        <footer className="app-footer">
            <div className="footer-inner">
                <div className="footer-col brand-col">
                    <div className="brand">
                        <span className="brand-logo">fchat</span>
                    </div>
                    <ul className="contact-list">
                        <li><span className="icon">📍</span> Tầng 2, Số 247, P.Cầu Giấy, TP.Hà Nội</li>
                        <li><span className="icon">📞</span> Hỗ trợ: 089 898 6008</li>
                        <li><span className="icon">☎</span> Khiếu nại: 097 393 1563</li>
                        <li><span className="icon">✉</span> cskh@fchat.vn</li>
                        <li><span className="icon">⏰</span> 8:30 - 18:00</li>
                    </ul>
                </div>

                <div className="footer-col links-col">
                    <h4>Trung tâm trợ giúp</h4>
                    <ul>
                        <li><a href="#pricing">Bảng giá</a></li>
                        <li><a href="#guide">Hướng dẫn</a></li>
                        <li><a href="#faq">Câu hỏi thường gặp</a></li>
                        <li><a href="#activate">Kích hoạt dịch vụ</a></li>
                        <li><a href="#agency">Đại lý</a></li>
                        <li><a href="#affiliate">Affiliate</a></li>
                    </ul>
                </div>

                <div className="footer-col links-col">
                    <h4>Chính sách</h4>
                    <ul>
                        <li><a href="#group">Group hỗ trợ</a></li>
                        <li><a href="#terms">Điều khoản sử dụng</a></li>
                        <li><a href="#privacy">Chính sách bảo mật</a></li>
                        <li><a href="#payment">Chính sách thanh toán</a></li>
                        <li><a href="#tools">Facebook Tools</a></li>
                        <li><a href="#blog">Blog</a></li>
                    </ul>
                </div>

                <div className="footer-col store-col">
                    <h4>Tải App Fchat</h4>
                    <div className="store-badges">
                        <a className="store-badge play" href="#play" aria-label="Google Play">Google Play</a>
                        <a className="store-badge app" href="#appstore" aria-label="App Store">App Store</a>
                    </div>
                    <h4>Kết nối Fchat</h4>
                    <div className="socials">
                        <a className="social fb" href="#facebook" aria-label="Facebook">f</a>
                        <a className="social yt" href="#youtube" aria-label="YouTube">▶</a>
                    </div>
                    <div className="partner-badges">
                        <div className="badge notify">ĐÃ THÔNG BÁO</div>
                        <div className="badge meta">Meta Business Partner</div>
                    </div>
                </div>
            </div>
        </footer>
    )
}
export default Footer;