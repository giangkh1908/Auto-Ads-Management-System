import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../hooks/auth/useAuth";
import { STORAGE_KEYS, ROUTES } from "../../../constants/app.constants";
import TierBadge from "../../common/TierBadge/TierBadge";
import "./Header.css";
import avatar from "../../../assets/no-avatar.jpg";
import {
  LayoutDashboard,
  Megaphone,
  BarChart3,
  Store,
  Package,
  BookOpen,
  Gem,
  ChevronDown,
  Check,
  Menu,
  X,
} from "lucide-react";
import logo_1 from "../../../assets/Logo_Fchat.png";
import logo_2 from "../../../assets/Logo_Fchat_2.png";

function Header({ onLoginClick }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { t, i18n } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const { isAuthenticated, user, logout, myPackage } = useAuth();
  const [openMenu, setOpenMenu] = useState(null); //"avatar", "user" || null
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        openMenu &&
        !e.target.closest(".user-menu") &&
        !e.target.closest(".dropdown-language")
      ) {
        setOpenMenu(null);
      }

      // Đóng mobile menu khi click ra ngoài
      if (
        isMobileMenuOpen &&
        !e.target.closest(".mobile-menu") &&
        !e.target.closest(".hamburger-btn")
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    if (openMenu || isMobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [openMenu, isMobileMenuOpen]);

  // Shop logic removed

  //Click để mở dropdown
  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang);
    setOpenMenu(null);
    window.location.reload();
  };

  const isFacebookAdsActive =
    pathname === ROUTES.ACCOUNT_MANAGEMENT ||
    pathname === ROUTES.ADS_MANAGEMENT ||
    pathname === ROUTES.ARCHIVE_ADS;

  return (
    <header className={`app-header ${isScrolled ? "scrolled" : ""}`}>
      {/* Overlay khi mobile menu mở */}
      {isMobileMenuOpen && (
        <div
          className={`mobile-menu-overlay ${isMobileMenuOpen ? "open" : ""}`}
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div className="header-content">
        {/* Logo và Hamburger Menu Button */}
        <div className="logo-hamburger-group">
          {/* Hamburger Menu Button - chỉ hiển thị trên mobile */}
          <button
            className="hamburger-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

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
        </div>

        {/* Nav khi không ở Home, Guide hoặc ở service-package đã login*/}
        {pathname !== "/" && pathname !== ROUTES.GUIDE && !(pathname === ROUTES.SERVICE_PACKAGE && !isAuthenticated) && (
          <div className="app-nav">
            <button
              className={`nav-btn ${pathname === ROUTES.DASHBOARD ? "active" : ""}`}
              onClick={() => navigate(ROUTES.DASHBOARD)}
            >
              <LayoutDashboard size={18} />
              &nbsp;{t("header.dashboard")}
            </button>

            <button
              className={`nav-btn ${isFacebookAdsActive ? "active" : ""}`}
              onClick={() => navigate(ROUTES.ACCOUNT_MANAGEMENT)}
            >
              <Megaphone size={18} />
              &nbsp;{t("header.facebook_ads")}
            </button>

            <button
              className={`nav-btn ${pathname === ROUTES.ANALYTICS ? "active" : ""}`}
              onClick={() => navigate(ROUTES.ANALYTICS)}
            >
              <BarChart3 size={18} />
              &nbsp;{t("header.analytics")}
            </button>


            <button
              className={`nav-btn ${pathname === ROUTES.SERVICE_PACKAGE ? "active" : ""
                }`}
              onClick={() => navigate(ROUTES.SERVICE_PACKAGE)}
            >
              <Package size={18} />
              &nbsp;{t("header.package")}
            </button>
          </div>
        )}

        {/* Nav 2 khi ở Home, Guide hoặc ở service-package chưa login*/}
        {(pathname === "/" || pathname === ROUTES.GUIDE || (pathname === ROUTES.SERVICE_PACKAGE && !isAuthenticated)) && (
          <div className="app-nav-2">
            <button
              className={`nav-btn-2 ${pathname === ROUTES.GUIDE ? "active" : ""}`}
              onClick={() => navigate(ROUTES.GUIDE)}
            >
              <BookOpen size={20} />
              &nbsp;{t("header.guide")}
            </button>
            <button
              className={`nav-btn-2 ${pathname === ROUTES.SERVICE_PACKAGE ? "active" : ""}`}
              onClick={() => navigate(ROUTES.SERVICE_PACKAGE)}
            >
              <Gem size={20} /> {t("header.service")}
            </button>

            {isAuthenticated && (
              <button
                className={`nav-btn-2 ${pathname === ROUTES.DASHBOARD ? "active" : ""
                  }`}
                onClick={() => navigate(ROUTES.DASHBOARD)}
              >
                <LayoutDashboard size={20} />
                &nbsp;{t("header.dashboard")}
              </button>
            )}
          </div>
        )}

        {/* Mobile Menu Dropdown - Nav 1 */}
        {(pathname !== "/" && pathname !== ROUTES.GUIDE && !(pathname === ROUTES.SERVICE_PACKAGE && !isAuthenticated)) && (
          <div className={`mobile-menu ${isMobileMenuOpen ? "open" : ""}`}>
            <button
              className={`mobile-nav-btn ${pathname === ROUTES.DASHBOARD ? "active" : ""}`}
              onClick={() => {
                navigate(ROUTES.DASHBOARD);
                setIsMobileMenuOpen(false);
              }}
            >
              <LayoutDashboard size={20} />
              <span>{t("header.dashboard")}</span>
            </button>

            <button
              className={`mobile-nav-btn ${isFacebookAdsActive ? "active" : ""}`}
              onClick={() => {
                navigate(ROUTES.ACCOUNT_MANAGEMENT);
                setIsMobileMenuOpen(false);
              }}
            >
              <Megaphone size={20} />
              <span>{t("header.facebook_ads")}</span>
            </button>

            <button
              className={`mobile-nav-btn ${pathname === ROUTES.ANALYTICS ? "active" : ""}`}
              onClick={() => {
                navigate(ROUTES.ANALYTICS);
                setIsMobileMenuOpen(false);
              }}
            >
              <BarChart3 size={20} />
              <span>{t("header.analytics")}</span>
            </button>


            <button
              className={`mobile-nav-btn ${pathname === ROUTES.SERVICE_PACKAGE ? "active" : ""}`}
              onClick={() => {
                navigate(ROUTES.SERVICE_PACKAGE);
                setIsMobileMenuOpen(false);
              }}
            >
              <Package size={20} />
              <span>{t("header.package")}</span>
            </button>
          </div>
        )}

        {/* Mobile Menu Dropdown - Nav 2 */}
        {(pathname === "/" || pathname === ROUTES.GUIDE || (pathname === ROUTES.SERVICE_PACKAGE && !isAuthenticated)) && (
          <div className={`mobile-menu ${isMobileMenuOpen ? "open" : ""}`}>
            <button
              className={`mobile-nav-btn ${pathname === ROUTES.GUIDE ? "active" : ""}`}
              onClick={() => {
                navigate(ROUTES.GUIDE);
                setIsMobileMenuOpen(false);
              }}
            >
              <BookOpen size={20} />
              <span>{t("header.guide")}</span>
            </button>
            <button
              className={`mobile-nav-btn ${pathname === ROUTES.SERVICE_PACKAGE ? "active" : ""}`}
              onClick={() => {
                navigate(ROUTES.SERVICE_PACKAGE);
                setIsMobileMenuOpen(false);
              }}
            >
              <Gem size={20} />
              <span>{t("header.service")}</span>
            </button>

            {isAuthenticated && (
              <button
                className={`mobile-nav-btn ${pathname === ROUTES.DASHBOARD ? "active" : ""}`}
                onClick={() => {
                  navigate(ROUTES.DASHBOARD);
                  setIsMobileMenuOpen(false);
                }}
              >
                <LayoutDashboard size={20} />
                <span>{t("header.dashboard")}</span>
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
              <img src={i18n.language === "vi" ? viFlag : enFlag} alt="flag" />
            </button>
            {openMenu === "language" && (
              <ul className="dropdown-language">
                <li onClick={() => handleLanguageChange("vi")}>
                  <img src={viFlag} alt="Vietnamese" />{" "}
                  {t("header.languages.vi")}
                </li>
                <li onClick={() => handleLanguageChange("en")}>
                  <img src={enFlag} alt="English" /> {t("header.languages.en")}
                </li>
              </ul>
            )}
          </div>
          {/* Chỉ hiển thị menu user khi đã login và KHÔNG ở trang Home, Guide, và nếu ở service-package thì phải đã login */}
          {isAuthenticated && pathname !== "/" && pathname !== ROUTES.GUIDE && !(pathname === "/service-package" && !isAuthenticated) && (
            <div className="user-menu">


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
                      <div className="dropdown-user-name-wrapper">
                        <b>{user?.full_name}</b>
                        {myPackage?.package?.planType && (
                          <TierBadge
                            tier={myPackage.package.planType}
                            size="small"
                          />
                        )}
                      </div>
                      <small>
                        FB ID: {user?.facebookId}
                        <br />
                        Email: {user?.email}
                      </small>
                    </div>
                    <div className="dropdown-option-avatar">
                      <li onClick={() => navigate("/profile")}>
                        {t("header.profile")}
                      </li>
                      <li onClick={() => navigate("/user-transaction")}>{t("header.user_transaction")}</li>
                      <li onClick={logout}>{t("header.logout")}</li>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Chỉ hiển thị nút Đăng nhập nếu CHƯA đăng nhập và ở Home, Guide hoặc service-package */}
          {!isAuthenticated && (pathname === "/" || pathname === ROUTES.GUIDE || pathname === "/service-package") && (
            <button className="btn-login" onClick={onLoginClick}>
              {t("header.login")}
            </button>
          )}
        </div>
      </div>
    </header >
  );
}

export default Header;
