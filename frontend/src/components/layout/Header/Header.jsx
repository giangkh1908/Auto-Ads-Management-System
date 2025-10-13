import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import "./Header.css";
import avatar from "../../../assets/home.jpg";
import { LayoutDashboard, Megaphone, BarChart3, Store, Package, BookOpen, Gem } from "lucide-react";
import logo_1 from "../../../assets/Logo_Fchat.png";
import logo_2 from "../../../assets/Logo_Fchat_2.png";

function Header({ onLoginClick }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const [openMenu, setOpenMenu] = useState(null); //"avatar", "user" || null
  const viFlag = "https://flagcdn.com/w40/vn.png";
  const enFlag = "https://flagcdn.com/w40/us.png";

  //Set màu sắc của header khi cuộn
  useEffect(() => {
    const isHome = pathname === "/";
    if (!isHome) {
      setIsScrolled(true);
      return;
    }

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname]);

  // Đóng dropdown khi chuyển trang
  useEffect(() => {
    setOpenMenu(null);
  }, [pathname]);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        openMenu &&
        !event.target.closest(".user-menu") &&
        !event.target.closest(".dropdown-language")
      ) {
        setOpenMenu(null);
      }
    };

    if (openMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [openMenu]);

  //Click để mở dropdown
  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  //Click để đổi ngôn ngữ
  const handleLanguageChange = (language) => {
    // setUser({ ...user, language });
    toggleMenu("language");
  };

  return (
    <header className={`app-header ${isScrolled ? "scrolled" : ""}`}>
      <div className="header-content">
        {/* Logo */}
        <button onClick={() => navigate("/")}>
          <h1 className="app-title">
          <img
              className="app-name"
              src={isScrolled ? logo_2 : logo_1}
              alt="Logo"
            />
          </h1>
        </button>

        {/* Nav khi không ở Home*/}
        {pathname !== "/" && (
          <div className="app-nav">
            <button
              className={`nav-btn ${pathname === "/dashboard" ? "active" : ""}`}
              onClick={() => navigate("/dashboard")}
            >
              <LayoutDashboard size={18} />&nbsp;Dashboard
            </button>

            <button
              className={`nav-btn ${
                pathname === "/account-management" ? "active" : ""
              }`}
              onClick={() => navigate("/account-management")}
            >
              <Megaphone size={18} />&nbsp;Facebook Ads
            </button>

            <button
              className={`nav-btn ${pathname === "/analytics" ? "active" : ""}`}
              onClick={() => navigate("/analytics")}
            >
              <BarChart3 size={18} />&nbsp;Analytics
            </button>

            <button
              className={`nav-btn ${pathname.startsWith("/shop") ? "active" : ""}`}
              onClick={() => navigate("/shop")}
            >
              <Store size={18} />&nbsp;Shop
            </button>

            <button
              className={`nav-btn ${pathname === "/package" ? "active" : ""}`}
              onClick={() => navigate("/package")}
            >
              <Package size={18} />&nbsp;Package Order
            </button>
          </div>
        )}

        {/* Nav 2 khi ở Home*/}
        {pathname === "/" && (
          <div className="app-nav-2">
            <button
              className={`nav-btn ${pathname === "/guide" ? "active" : ""}`}
              onClick={() => navigate("/guide")}
            >
              <BookOpen size={20} />&nbsp;Hướng dẫn
            </button>

            <button
              className={`nav-btn ${pathname === "/service" ? "active" : ""}`}
              onClick={() => navigate("/service")}
            >
              <Gem size={20} />&nbsp;Gói dịch vụ
            </button>

            {isAuthenticated && (
              <button
                className={`nav-btn ${pathname === "/dashboard" ? "active" : ""}`}
                onClick={() => navigate("/dashboard")}
              >
                <LayoutDashboard size={20} />&nbsp;Dashboard
              </button>
            )}
          </div>
        )}

        {/* Avatar, Tên shop và Ngôn ngữ */}
        <div className="header-actions">
          {/* Hiển thị nút chuyển ngữ */}
          <div className="language-wrapper">
            <button
              className="btn-language"
              onClick={() => toggleMenu("language")}
            >
              <img src={user?.language === "vi" ? viFlag : enFlag} alt="flag" />
            </button>
            {openMenu === "language" && (
              <ul className="dropdown-language">
                <li onClick={() => handleLanguageChange("vi")}>
                  <img src={viFlag} alt="Vietnamese" /> Tiếng Việt
                </li>
                <li onClick={() => handleLanguageChange("en")}>
                  <img src={enFlag} alt="English" /> English
                </li>
              </ul>
            )}
          </div>
          {/* Chỉ hiển thị menu user khi đã login và KHÔNG ở trang Home */}
          {isAuthenticated && pathname !== "/" && (
            <div className="user-menu">
              {/* Tên + Dropdown menu */}
              <div className="user-greeting-wrapper">
                <span className="user-greeting" style={{ cursor: "default" }}>
                  <strong className="user-name-header">
                    {user?.full_name}
                  </strong>
                  <p className="user-name-header-role">STARTER | Onwer{user?.role}</p>
                </span>
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
                    <div className="dropdown-infor-avatar">
                      <b>{user?.full_name}</b>
                      <small>
                        FB ID: {user?.facebookId}
                        <br />
                        Email: {user?.email}
                      </small>
                    </div>
                    <div className="dropdown-option-avatar">
                      <li onClick={() => navigate("/profile")}>Hồ sơ</li>
                      <li onClick={logout}>Đăng xuất</li>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Chỉ hiển thị nút Đăng nhập nếu CHƯA đăng nhập và ở Home */}
          {!isAuthenticated && pathname === "/" && (
            <button className="btn-login" onClick={onLoginClick}>
              Đăng nhập
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
export default Header;
