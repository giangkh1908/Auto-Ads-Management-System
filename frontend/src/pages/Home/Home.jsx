import { useState } from "react";
import { MessageCircle, Globe, Settings,ShoppingCart,DollarSign,Package,TrendingUp,Users,Briefcase,Calendar,Megaphone,
        MessageSquare,Reply,Bell,Key,List,ShoppingBag,Truck,Play,Mail,ArrowRight,Sparkles,
} from "lucide-react";
import "./Home.css";
import laptop_white from "../../assets/macbook-white.png";

function Home({ onLoginClick }) {
  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Email submitted:", email);
  };

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">
                AI Chatbot Messenger, Zalo, Website
              </h1>
              <p className="hero-description">
                Tạo chatbot với khả năng tự động hóa doanh số, bán hàng và chăm
                sóc khách hàng 24/7
              </p>
              <button className="cta-button-home" onClick={onLoginClick}>
                <span>BẮT ĐẦU MIỄN PHÍ</span>
                <ArrowRight size={20} />
              </button>
            </div>
            <div className="hero-visual">
              <img
                src={laptop_white}
                alt="Modern laptop computer displaying chatbot dashboard - Vincent Tint on Unsplash"
                className="laptop-mockup"
              />
              <iframe
                className="youtube-video"
                src="https://www.youtube.com/embed/9U53xR0fhqI"
                title="Video Trailer"
                allow="autoplay; encrypted-media"
              ></iframe>
            </div>
          </div>
        </div>
        <div className="wave-divider">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"></path>
          </svg>
        </div>
      </section>

      {/* Platform Integration Section */}
      <section className="platform-section">
        <div className="container">
          <h2 className="section-title">Nền Tảng Chat và Chatbot Đa Kênh</h2>
          <p className="section-subtitle">
            Quản lý tất cả các kênh liên lạc với khách hàng của bạn trên một nền
            tảng duy nhất
          </p>
          <div className="platform-grid">
            <div className="platform-card">
              <div className="platform-icon messenger">
                <MessageCircle size={32} />
              </div>
              <h3>Messenger</h3>
            </div>
            <div className="platform-card">
              <div className="platform-icon zalo">
                <MessageSquare size={32} />
              </div>
              <h3>Zalo</h3>
            </div>
            <div className="platform-card">
              <div className="platform-icon website">
                <Globe size={32} />
              </div>
              <h3>Website</h3>
            </div>
            <div className="platform-card">
              <div className="platform-icon tryai">
                <Settings size={32} />
              </div>
              <h3>Try AI</h3>
            </div>
          </div>
        </div>
      </section>

      {/* Chatbot Templates Section */}
      <section className="templates-section">
        <div className="container">
          <h2 className="section-title">Một Số Kịch Bản Chatbot Mẫu</h2>
          <p className="section-subtitle">
            Bắt đầu nhanh với các kịch bản chatbot đã được tối ưu hóa sẵn
          </p>
          <div className="templates-grid">
            <div className="template-card">
              <div className="template-icon">
                <ShoppingCart size={28} />
              </div>
              <h4>Mua hàng</h4>
              <p>Bán hàng</p>
            </div>
            <div className="template-card">
              <div className="template-icon">
                <DollarSign size={28} />
              </div>
              <h4>Nạp tiền</h4>
              <p>Bán hàng</p>
            </div>
            <div className="template-card">
              <div className="template-icon">
                <Package size={28} />
              </div>
              <h4>Tra cứu đơn hàng</h4>
              <p>Bán hàng</p>
            </div>
            <div className="template-card">
              <div className="template-icon">
                <TrendingUp size={28} />
              </div>
              <h4>Khả năng bán hàng</h4>
              <p>Bán hàng</p>
            </div>
            <div className="template-card">
              <div className="template-icon">
                <Users size={28} />
              </div>
              <h4>Tư vấn bán hàng</h4>
              <p>Bán hàng</p>
            </div>
            <div className="template-card">
              <div className="template-icon">
                <Briefcase size={28} />
              </div>
              <h4>Tuyển dụng nhân viên</h4>
              <p>Bán hàng</p>
            </div>
            <div className="template-card">
              <div className="template-icon">
                <Calendar size={28} />
              </div>
              <h4>Đặt hàng và đặt chỗ</h4>
              <p>Bán hàng</p>
            </div>
            <div className="template-card">
              <div className="template-icon">
                <Sparkles size={28} />
              </div>
              <h4>Viral</h4>
              <p>Bán hàng</p>
            </div>
            <div className="template-card">
              <div className="template-icon">
                <ShoppingBag size={28} />
              </div>
              <h4>Quản lý đơn hàng</h4>
              <p>Bán hàng</p>
            </div>
          </div>
          <p className="templates-footer">Và nhiều kịch bản khác nữa tại...</p>
        </div>
      </section>

      {/* Automation Features Section */}
      <section className="automation-section">
        <div className="container">
          <h2 className="section-title">
            Chất 1.000+ Đơn Hàng Tự Động Với Chatbot
          </h2>
          <p className="section-subtitle">
            Chatbot tự động hóa quy trình bán hàng và chăm sóc khách hàng của
            bạn
          </p>
          <div className="automation-grid">
            <div className="automation-card">
              <div className="automation-icon">
                <Megaphone size={32} />
              </div>
              <h4>Chiến dịch</h4>
              <p>Tự động gửi tin nhắn đến khách hàng theo chiến dịch</p>
            </div>
            <div className="automation-card">
              <div className="automation-icon">
                <MessageSquare size={32} />
              </div>
              <h4>LiveChat</h4>
              <p>Chuyển đổi từ bot sang nhân viên khi cần thiết</p>
            </div>
            <div className="automation-card">
              <div className="automation-icon">
                <Reply size={32} />
              </div>
              <h4>Auto Reply</h4>
              <p>Tự động trả lời tin nhắn của khách hàng 24/7</p>
            </div>
            <div className="automation-card">
              <div className="automation-icon">
                <Bell size={32} />
              </div>
              <h4>Nhắc hẹn</h4>
              <p>Tự động nhắc nhở khách hàng về các sự kiện quan trọng</p>
            </div>
            <div className="automation-card">
              <div className="automation-icon">
                <Key size={32} />
              </div>
              <h4>Keyword</h4>
              <p>Tự động phản hồi dựa trên từ khóa trong tin nhắn</p>
            </div>
            <div className="automation-card">
              <div className="automation-icon">
                <List size={32} />
              </div>
              <h4>Sequence</h4>
              <p>Tạo chuỗi tin nhắn tự động theo kịch bản</p>
            </div>
            <div className="automation-card">
              <div className="automation-icon">
                <ShoppingBag size={32} />
              </div>
              <h4>Đơn hàng</h4>
              <p>Quản lý và theo dõi đơn hàng tự động</p>
            </div>
            <div className="automation-card">
              <div className="automation-icon">
                <Truck size={32} />
              </div>
              <h4>Vận chuyển</h4>
              <p>Tự động cập nhật trạng thái vận chuyển cho khách</p>
            </div>
          </div>
        </div>
      </section>

      {/* Mini Game Promotion Section */}
      <section className="minigame-section">
        <div className="container">
          <h2 className="section-title">
            Tăng 30% Khách Hàng Và Doanh Số Nhờ MiniGame
          </h2>
          <p className="section-subtitle">
            Mini game: Quay số vé số, Vòng quay may mắn, Lắc xì, Affiliate,
            Viral...
          </p>
          <div className="minigame-carousel">
            <div className="carousel-track">
              <div className="minigame-card">
                <img
                  src="https://images.unsplash.com/photo-1663153204573-1e6581da098f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTAwNDR8MHwxfHNlYXJjaHwyfHxzbWFydHBob25lJTIwbW9iaWxlJTIwZ2FtZSUyMGNvbG9yZnVsJTIwYXBwfGVufDB8MXx8fDE3NjAwMTEyMjN8MA&ixlib=rb-4.1.0&q=85"
                  alt="Mobile game interface - Typerium App on Unsplash"
                  className="minigame-image"
                />
              </div>
              <div className="minigame-card">
                <img
                  src="https://images.unsplash.com/photo-1591783097660-037e0d08343b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTAwNDR8MHwxfHNlYXJjaHw1fHxtb2JpbGUlMjBwaG9uZSUyMGdhbWUlMjBjb2xvcmZ1bCUyMHByaXplfGVufDB8MXx8cmVkfDE3NjAwMTEyMjN8MA&ixlib=rb-4.1.0&q=85"
                  alt="Colorful game screen - Rombo on Unsplash"
                  className="minigame-image"
                />
              </div>
              <div className="minigame-card">
                <img
                  src="https://images.unsplash.com/photo-1588889243484-2cacf85b9b87?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTAwNDR8MHwxfHNlYXJjaHw0fHxzbWFydHBob25lJTIwZ2FtZSUyMHJld2FyZHMlMjBnaWZ0cyUyMGNvbG9yZnVsfGVufDB8MXx8cHVycGxlfDE3NjAwMTEyMjJ8MA&ixlib=rb-4.1.0&q=85"
                  alt="Game rewards interface - Batu Gezer on Unsplash"
                  className="minigame-image"
                />
              </div>
              <div className="minigame-card">
                <img
                  src="https://images.unsplash.com/photo-1619241638225-14d56e47ae64?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTAwNDR8MHwxfHNlYXJjaHw0fHxtb2JpbGUlMjBnYW1lJTIwd2hlZWwlMjBwcml6ZXMlMjBjZWxlYnJhdGlvbnxlbnwwfDF8fG9yYW5nZXwxNzYwMDExMjIyfDA&ixlib=rb-4.1.0&q=85"
                  alt="Lucky wheel game - Tangerine Newt on Unsplash"
                  className="minigame-image"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tutorial Videos Section */}
      <section className="tutorial-section">
        <div className="container">
          <h2 className="section-title">Hướng Dẫn Tạo Chatbot Với Fchat</h2>
          <p className="section-subtitle">
            Chatbot là gì, Kịch bản mẫu và bán hàng tự động với Chatbot
            Messenger
          </p>
          <div className="tutorial-grid">
            <div className="tutorial-card">
              <div className="tutorial-thumbnail">
                <img
                  src="https://images.unsplash.com/photo-1636819488524-1f019c4e1c44?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTAwNDR8MHwxfHNlYXJjaHw3fHxjaGF0Ym90JTIwcm9ib3QlMjB0ZWNobm9sb2d5JTIwdHV0b3JpYWwlMjBlZHVjYXRpb258ZW58MHwwfHxibHVlfDE3NjAwMTEyMjN8MA&ixlib=rb-4.1.0&q=85"
                  alt="Chatbot tutorial - Andy Hermawan on Unsplash"
                />
                <div className="play-button">
                  <Play size={32} fill="white" />
                </div>
              </div>
            </div>
            <div className="tutorial-card">
              <div className="tutorial-thumbnail">
                <img
                  src="https://images.unsplash.com/photo-1617791160588-241658c0f566?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTAwNDR8MHwxfHNlYXJjaHwzfHx0dXRvcmlhbCUyMHNldHVwJTIwaW50ZXJmYWNlJTIwY29sb3JmdWwlMjBndWlkZXxlbnwwfDB8fHB1cnBsZXwxNzYwMDExMjI3fDA&ixlib=rb-4.1.0&q=85"
                  alt="Setup tutorial - Milad Fakurian on Unsplash"
                />
                <div className="play-button">
                  <Play size={32} fill="white" />
                </div>
              </div>
            </div>
            <div className="tutorial-card">
              <div className="tutorial-thumbnail">
                <img
                  src="https://images.unsplash.com/photo-1656821991475-86b1b2ba3c32?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTAwNDR8MHwxfHNlYXJjaHwxfHxnaWZ0cyUyMHNhbGVzJTIwYXV0b21hdGlvbiUyMGNvbG9yZnVsJTIwdHV0b3JpYWx8ZW58MHwwfHxyZWR8MTc2MDAxMTIyOXww&ixlib=rb-4.1.0&q=85"
                  alt="Sales automation tutorial - Scarlett Alt on Unsplash"
                />
                <div className="play-button">
                  <Play size={32} fill="white" />
                </div>
              </div>
            </div>
            <div className="tutorial-card">
              <div className="tutorial-thumbnail">
                <img
                  src="https://images.unsplash.com/photo-1657192809008-729aa92d1228?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTAwNDR8MHwxfHNlYXJjaHwzfHxnYW1lJTIwd2hlZWwlMjBwcml6ZXMlMjBjZWxlYnJhdGlvbiUyMGNvbG9yZnVsfGVufDB8MHx8b3JhbmdlfDE3NjAwMTEyMjh8MA&ixlib=rb-4.1.0&q=85"
                  alt="Game features tutorial - Maxim Berg on Unsplash"
                />
                <div className="play-button">
                  <Play size={32} fill="white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Registration CTA Section */}
      <section className="registration-section">
        <div className="container">
          <h2 className="section-title">
            ĐĂNG KÝ TƯ VẤN KỊCH BẢN CHATBOT BÁN HÀNG
          </h2>
          <p className="section-subtitle">
            Tư vấn miễn phí về kịch bản chatbot phù hợp với doanh nghiệp của bạn
          </p>
          <form className="registration-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <Mail className="input-icon" size={20} />
              <input
                type="email"
                placeholder="Nhập email của bạn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="submit-button">
              NGƯỜI CHO TÔI
            </button>
          </form>
        </div>
        <div className="wave-divider bottom">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"></path>
          </svg>
        </div>
      </section>
    </div>
  );
}

export default Home;
