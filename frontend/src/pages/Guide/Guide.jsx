import { useState, useEffect } from "react";
import {
  BookOpen, User, Home, Store, Megaphone, BarChart3, Zap,
  Package, CreditCard, Settings, Bell, Key
} from "lucide-react";
import { useTranslation } from "react-i18next";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import GuideSidebar from "./components/GuideSidebar";
import GuideSection from "./components/GuideSection";
import GuideFeatureCard from "./components/GuideFeatureCard";
import "./Guide.css";

const GUIDE_SECTIONS = [
  { id: "overview", titleKey: "sections.overview.title", icon: BookOpen },
  { id: "getting-started", titleKey: "sections.gettingStarted.title", icon: User },
  { id: "dashboard", titleKey: "sections.dashboard.title", icon: Home },
  { id: "shop-management", titleKey: "sections.shopManagement.title", icon: Store },
  { id: "ads-management", titleKey: "sections.adsManagement.title", icon: Megaphone },
  { id: "analytics", titleKey: "sections.analytics.title", icon: BarChart3 },
  { id: "automation", titleKey: "sections.automation.title", icon: Zap },
  { id: "service-package", titleKey: "sections.servicePackage.title", icon: Package },
  { id: "ad-account", titleKey: "sections.adAccount.title", icon: CreditCard },
  { id: "profile", titleKey: "sections.profile.title", icon: Settings },
];

function Guide() {
  const { t } = useTranslation('guide');
  const [activeSection, setActiveSection] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");

  // Removed useEffect that was resetting scrollTop on activeSection change
  // as it conflicted with manual scrolling

  const filteredSections = GUIDE_SECTIONS.filter((section) =>
    t(section.titleKey).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      const contentWrapper = document.querySelector(".guide-page-content");
      if (contentWrapper) {
        // Use scrollTo for a precise position relative to the container
        contentWrapper.scrollTo({
          top: element.offsetTop - 20,
          behavior: "smooth"
        });
      }
    }
  };

  return (
    <div className="guide-page-container">
      <div className="guide-page-main">
        <GuideSidebar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filteredSections={filteredSections}
          activeSection={activeSection}
          scrollToSection={scrollToSection}
          t={t}
        />

        <main className="guide-page-content">
          <motion.div
            className="guide-content-wrapper"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Tổng quan */}
            <GuideSection id="overview" title="Tổng quan hệ thống" icon={BookOpen}>
              <p className="guide-text">
                Hệ thống Quản lý Quảng cáo Tự động là một nền tảng toàn diện giúp bạn quản lý các chiến dịch quảng cáo Facebook,
                tự động hóa quy trình, và theo dõi hiệu suất một cách hiệu quả.
              </p>
              <div className="guide-features-grid">
                <GuideFeatureCard
                  title="Quản lý Quảng cáo"
                  description="Tạo, chỉnh sửa và quản lý các chiến dịch, ad sets và quảng cáo Facebook"
                  icon={Megaphone}
                />
                <GuideFeatureCard
                  title="Phân tích & Báo cáo"
                  description="Theo dõi hiệu suất quảng cáo với các báo cáo chi tiết và biểu đồ trực quan"
                  icon={BarChart3}
                />
                <GuideFeatureCard
                  title="Tự động hóa"
                  description="Thiết lập các quy tắc tự động để tối ưu hóa chiến dịch quảng cáo"
                  icon={Zap}
                />
                <GuideFeatureCard
                  title="Quản lý Shop"
                  description="Quản lý nhiều cửa hàng, nhân viên và kết nối Facebook Pages"
                  icon={Store}
                />
              </div>
            </GuideSection>

            {/* Bắt đầu */}
            <GuideSection id="getting-started" title="Bắt đầu sử dụng" icon={User}>
              <h3 className="guide-subsection-title">1. Đăng ký tài khoản</h3>
              <ol className="guide-steps-list">
                <li>Truy cập trang chủ và nhấn nút <strong>"Đăng ký"</strong></li>
                <li>Điền đầy đủ thông tin: Họ tên, Email, Số điện thoại, Mật khẩu</li>
                <li>Xác nhận email qua link được gửi đến hộp thư</li>
                <li>Đăng nhập với tài khoản vừa tạo</li>
              </ol>

              <h3 className="guide-subsection-title">2. Đăng nhập</h3>
              <ol className="guide-steps-list">
                <li>Nhấn nút <strong>"Đăng nhập"</strong> ở góc trên bên phải</li>
                <li>Nhập Email và Mật khẩu</li>
                <li>Nhấn <strong>"Đăng nhập"</strong> để truy cập hệ thống</li>
                <li>Hoặc đăng nhập với Facebook sẽ không cần phải đăng ký tài khoản</li>
                <li>Nếu quên mật khẩu, sử dụng chức năng <strong>"Quên mật khẩu"</strong></li>
              </ol>

              <h3 className="guide-subsection-title">3. Mua gói dịch vụ</h3>
              <ol className="guide-steps-list">
                <li>Vào <strong>"Gói dịch vụ"</strong> từ menu</li>
                <li>Chọn gói phù hợp (Chatbot, Chatbot AI)</li>
                <li>Chọn thời hạn: 3 tháng hoặc 12 tháng</li>
                <li>Chọn số lượng Pages, Employees, và Shops cần thiết</li>
                <li>Thanh toán qua Bank transfer, VNPAY</li>
                <li>Chờ admin duyệt giao dịch</li>
              </ol>
            </GuideSection>

            {/* Dashboard */}
            <GuideSection id="dashboard" title="Dashboard - Quản lý Facebook Pages" icon={Home}>
              <p className="guide-text">
                Dashboard là trang chính để quản lý các Facebook Pages đã kết nối và theo dõi trạng thái của chúng.
              </p>

              <h3 className="guide-subsection-title">Kết nối Facebook Page mới</h3>
              <ol className="guide-steps-list">
                <li>Vào <strong>"Dashboard"</strong> từ menu chính</li>
                <li>Nhấn nút <strong>"Connect New Page"</strong> (nếu chưa đạt giới hạn)</li>
                <li>Chọn Page từ danh sách Facebook Pages của bạn</li>
                <li>Xác nhận quyền truy cập</li>
                <li>Page sẽ xuất hiện trong danh sách sau khi kết nối thành công</li>
              </ol>

              <div className="guide-note-box">
                <Bell size={20} className="guide-note-icon" />
                <p><strong>Lưu ý:</strong> Số lượng Pages có thể kết nối phụ thuộc vào gói dịch vụ đã mua. Kiểm tra giới hạn trong phần "Gói dịch vụ".</p>
              </div>
            </GuideSection>

            {/* Quản lý Shop */}
            <GuideSection id="shop-management" title="Quản lý Shop" icon={Store}>
              <p className="guide-text">
                Quản lý Shop cho phép bạn tạo và quản lý nhiều cửa hàng, mỗi shop có thể có nhiều nhân viên và Facebook Pages.
              </p>

              <h3 className="guide-subsection-title">Tạo Shop mới</h3>
              <ol className="guide-steps-list">
                <li>Vào <strong>"Shop"</strong> từ menu chính</li>
                <li>Nhấn nút <strong>"Thêm Shop"</strong></li>
                <li>Điền thông tin:
                  <ul className="guide-nested-list">
                    <li>Tên Shop</li>
                    <li>Email liên hệ</li>
                    <li>Số điện thoại</li>
                    <li>Danh mục (Category)</li>
                  </ul>
                </li>
                <li>Nhấn <strong>"Lưu"</strong> để tạo Shop</li>
              </ol>
            </GuideSection>

            {/* Quản lý Quảng cáo */}
            <GuideSection id="ads-management" title="Quản lý Quảng cáo" icon={Megaphone}>
              <p className="guide-text">
                Quản lý Quảng cáo là nơi bạn tạo, chỉnh sửa và quản lý tất cả các chiến dịch quảng cáo Facebook của mình.
              </p>

              <h3 className="guide-subsection-title">Cấu trúc Quảng cáo</h3>
              <ul className="guide-features-list">
                <li><strong>Campaign (Chiến dịch):</strong> Cấp cao nhất, chứa nhiều Ad Sets</li>
                <li><strong>Ad Set (Nhóm quảng cáo):</strong> Chứa nhiều Ads, định nghĩa đối tượng và ngân sách</li>
                <li><strong>Ad (Quảng cáo):</strong> Cấp thấp nhất, chứa creative (hình ảnh, video, text)</li>
              </ul>

              <h3 className="guide-subsection-title">Tạo Chiến dịch mới</h3>
              <ol className="guide-steps-list">
                <li>Vào <strong>"Quản lý Quảng cáo"</strong> từ menu</li>
                <li>Chọn tài khoản quảng cáo từ dropdown</li>
                <li>Nhấn nút <strong>"Tạo mới"</strong></li>
                <li>Điền thông tin Campaign, Ad Set và Ad theo hướng dẫn trên màn hình</li>
                <li>Xem lại và nhấn <strong>"Publish"</strong> để xuất bản</li>
              </ol>
            </GuideSection>

            {/* Analytics */}
            <GuideSection id="analytics" title="Phân tích & Báo cáo" icon={BarChart3}>
              <p className="guide-text">
                Analytics cung cấp các báo cáo chi tiết về hiệu suất quảng cáo với nhiều metrics và breakdown options.
              </p>

              <h3 className="guide-subsection-title">Xem Báo cáo</h3>
              <ol className="guide-steps-list">
                <li>Vào <strong>"Analytics"</strong> từ menu</li>
                <li>Chọn tài khoản quảng cáo và khoảng thời gian</li>
                <li>Chọn các metrics và breakdown columns muốn xem</li>
                <li>Xem bảng dữ liệu và biểu đồ trực quan</li>
              </ol>
            </GuideSection>

            {/* Automation */}
            <GuideSection id="automation" title="Tự động hóa Quảng cáo" icon={Zap}>
              <p className="guide-text">
                Automation Rules cho phép bạn thiết lập các quy tắc tự động để tối ưu hóa chiến dịch quảng cáo dựa trên hiệu suất.
              </p>

              <div className="guide-note-box">
                <Zap size={20} className="guide-note-icon" />
                <p><strong>Lưu ý:</strong> Quy tắc tự động sẽ chạy theo lịch đã thiết lập. Đảm bảo tài khoản quảng cáo đã được kết nối và có quyền truy cập.</p>
              </div>
            </GuideSection>

            {/* Service Package */}
            <GuideSection id="service-package" title="Gói dịch vụ & Thanh toán" icon={Package}>
              <p className="guide-text">
                Hệ thống cung cấp các gói dịch vụ với các mức giới hạn khác nhau về Pages, Employees, và Shops.
              </p>

              <h3 className="guide-subsection-title">Mua Gói dịch vụ</h3>
              <ol className="guide-steps-list">
                <li>Vào <strong>"Gói dịch vụ"</strong> từ menu</li>
                <li>Chọn gói và thời hạn (3/6/12 tháng)</li>
                <li>Chọn số lượng tài nguyên cần thiết</li>
                <li>Hoàn tất thanh toán qua ATM/QRCode</li>
                <li>Chờ admin duyệt giao dịch để kích hoạt gói</li>
              </ol>
            </GuideSection>

            {/* Ad Account */}
            <GuideSection id="ad-account" title="Quản lý Tài khoản Quảng cáo" icon={CreditCard}>
              <p className="guide-text">
                Kết nối và quản lý các tài khoản quảng cáo Facebook để sử dụng trong hệ thống.
              </p>

              <div className="guide-note-box">
                <Key size={20} className="guide-note-icon" />
                <p><strong>Lưu ý:</strong> Đảm bảo tài khoản Facebook của bạn có quyền quản lý tài khoản quảng cáo.</p>
              </div>
            </GuideSection>

            {/* Profile */}
            <GuideSection id="profile" title="Hồ sơ & Cài đặt" icon={Settings}>
              <p className="guide-text">
                Quản lý thông tin cá nhân và cài đặt tài khoản của bạn.
              </p>

              <h3 className="guide-subsection-title">Cập nhật Thông tin</h3>
              <ol className="guide-steps-list">
                <li>Vào <strong>"Hồ sơ"</strong> từ menu</li>
                <li>Cập nhật Họ tên, Email, Số điện thoại hoặc Ảnh đại diện</li>
                <li>Nhấn <strong>"Lưu"</strong> để cập nhật</li>
              </ol>
            </GuideSection>

            {/* Footer */}
            <footer className="guide-page-footer">
              <div className="guide-footer-content">
                <p className="guide-footer-text">
                  Cần hỗ trợ thêm? Liên hệ với chúng tôi qua email hoặc hotline.
                </p>
                <div className="guide-footer-divider"></div>
                <p className="guide-footer-copyright">
                  © 2025 create by AAMS FPT Team. Tất cả quyền được bảo lưu.
                </p>
              </div>
            </footer>
          </motion.div>
        </main>
      </div>
    </div>
  );
}

export default Guide;
