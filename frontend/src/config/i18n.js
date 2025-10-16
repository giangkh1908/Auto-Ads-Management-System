// src/i18n/i18n.js
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// 1️⃣ Các file ngôn ngữ
const resources = {
  vi: {
    translation: {
      "hello": "Xin chào",
      "welcome": "Chào mừng bạn đến với hệ thống quản lý quảng cáo!",
      "dashboard": "Bảng điều khiển",
      "account": "Tài khoản",
      "logout": "Đăng xuất"
    }
  },
  en: {
    translation: {
      "hello": "Hello",
      "welcome": "Welcome to the Ads Management System!",
      "dashboard": "Dashboard",
      "account": "Account",
      "logout": "Logout"
    }
  }
};

// 2️⃣ Khởi tạo i18next
i18n
  .use(initReactI18next) // Kết nối với React
  .init({
    resources,
    lng: localStorage.getItem('lang') || 'vi', // Ngôn ngữ mặc định
    fallbackLng: 'vi', // Nếu không có key, dùng tiếng Việt
    interpolation: {
      escapeValue: false, // React đã tự xử lý bảo mật rồi
    },
  });

export default i18n;