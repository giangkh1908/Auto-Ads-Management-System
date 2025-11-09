// src/pages/shop/History.jsx
import { useTranslation } from "react-i18next";
import { NavLink, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { ROUTES } from "../../constants/app.constants";
import "./Shop.css";
import { STORAGE_KEYS } from "../../constants/app.constants";
import { formatDistanceToNow, format } from "date-fns";
import { vi, enUS } from "date-fns/locale";

const Icon = ({ type }) => {
  switch (type) {
    case "CREATE_SHOP":
    case "ADD_EMPLOYEE":
      return <span className="log-icon add">add</span>;
    case "REMOVE_EMPLOYEE":
    case "DISCONNECT_FACEBOOK_PAGE":
      return <span className="log-icon remove">remove</span>;
    case "UPDATE_USER_ROLE":
    case "ASSIGN_PAGES":
      return <span className="log-icon assign">assignment</span>;
    case "TRANSFER_OWNERSHIP":
      return <span className="log-icon transfer">swap_horiz</span>;
    case "CONNECT_FACEBOOK_PAGE":
      return <span className="log-icon connect">link</span>;
    default:
      return <span className="log-icon default">info</span>;
  }
};

function History() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [logs, setLogs] = useState([]);
  const [currentShopId, setCurrentShopId] = useState(""); // LẤY SHOP ID CHUẨN NHẤT
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch(`${base_url}/api/shops/logs`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)}`,
          },
        });
        const data = await res.json();
        if (data.success && data.data.length > 0) {
          const sortedLogs = data.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          setLogs(sortedLogs);
          setCurrentShopId(data.shopId);
        }
      } catch (err) {
        console.error("Error fetching logs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  // Format thời gian
  const formatTime = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diffInHours = (now - d) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return formatDistanceToNow(d, {
        addSuffix: true,
        locale: i18n.language === "vi" ? vi : enUS,
      });
    } else if (diffInHours < 168) {
      return format(d, "EEEE, HH:mm", { locale: i18n.language === "vi" ? vi : enUS });
    } else {
      return format(d, "dd/MM/yyyy HH:mm", { locale: i18n.language === "vi" ? vi : enUS });
    }
  };

  return (
    <div className="shop-border">
      <div className="shop-tabs">
        <NavLink end to={ROUTES.SHOP} className={({ isActive }) => `shop-tab ${isActive ? "active" : ""}`}>
          {t("shop.my_shop")}
        </NavLink>

        {/* CHUYỂN ĐÚNG SHOP ID */}
        <NavLink
          to={`${ROUTES.SHOP_EMPLOYEE}/${currentShopId}`}
          className={({ isActive }) => `shop-tab ${isActive ? "active" : ""}`}
        >
          {t("shop.employee")}
        </NavLink>

        <NavLink to={ROUTES.SHOP_HISTORY} className={({ isActive }) => `shop-tab ${isActive ? "active" : ""}`}>
          {t("shop.history")}
        </NavLink>
      </div>

      <div className="shop-page">
        <div className="shop-container">
          <div className="shop-content">
            <h2 className="history-title">
              Lịch sử hoạt động
            </h2>

            {loading ? (
              <div className="history-skeleton">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="skeleton-item">
                    <div className="skeleton-avatar"></div>
                    <div className="skeleton-text"></div>
                    <div className="skeleton-time"></div>
                  </div>
                ))}
              </div>
            ) : logs.length === 0 ? (
              <div className="history-empty">
                <p>Chưa có hoạt động nào.</p>
              </div>
            ) : (
              <div className="history-list">
                {logs.map((log) => (
                  <div key={log._id} className="history-item">
                    <div className="history-avatar">
                      {log.user_id?.avatar ? (
                        <img src={log.user_id.avatar} alt={log.user_id.full_name} />
                      ) : (
                        <div className="avatar-placeholder">
                          {log.user_id?.full_name?.[0] || "U"}
                        </div>
                      )}
                    </div>

                    <div className="history-content">
                      <div className="history-header">
                        <span className="history-user">
                          {log.user_name || log.user_id?.full_name || log.user_id?.email || "Hệ thống"}
                        </span>
                        <Icon type={log.action} />
                      </div>

                      <div className="history-description">
                        {log.description || "Đã thực hiện một hành động"}
                      </div>

                      <div className="history-time">
                        {formatTime(log.created_at)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default History;