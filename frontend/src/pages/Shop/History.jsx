import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import { ROUTES } from "../../constants/app.constants";
import "./Shop.css";
import { STORAGE_KEYS } from "../../constants/app.constants";

function History() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch("http://localhost:5001/api/shops/logs", {
          method: "GET",
          headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)}`,
        },
        });
        const data = await res.json();
        if (data.success) setLogs(data.data);
      } catch (err) {
        console.error("Error fetching logs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const renderNote = (log) => {
    const name = log.meta?.employee_name || "";
    const pages = log.meta?.pages?.join(", ");
    switch (log.action) {
      case "assign_page":
        return `Phân quyền cho nhân viên ${name} vào các page: ${pages}`;
      case "remove_page":
        return `Ngắt kết nối fanpage: ${pages}`;
      case "add_employee":
        return `Thêm mới nhân viên ${name}`;
      case "remove_employee":
        return `Xóa nhân viên ${name} ra khỏi Shop`;
      case "relinquish_ownership":
        return `Chuyển quyền chủ Shop cho nhân viên ${name}`;
      default:
        return log.action || "Hành động không xác định";
    }
  };

  return (
    <div className="shop-border">
      <div className="shop-tabs">
        <NavLink end to={ROUTES.SHOP} className={({ isActive }) => `shop-tab ${isActive ? "active" : ""}`}>
          {t("shop.my_shop")}
        </NavLink>
        <NavLink to={ROUTES.SHOP_EMPLOYEE} className={({ isActive }) => `shop-tab ${isActive ? "active" : ""}`}>
          {t("shop.employee")}
        </NavLink>
        <NavLink to={ROUTES.SHOP_HISTORY} className={({ isActive }) => `shop-tab ${isActive ? "active" : ""}`}>
          {t("shop.history")}
        </NavLink>
      </div>

      <div className="shop-page">
        <div className="shop-container">
          <div className="shop-content">
            {loading ? (
              <p>Đang tải lịch sử...</p>
            ) : logs.length === 0 ? (
              <p>Không có lịch sử hoạt động.</p>
            ) : (
              <table className="history-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Note</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log._id}>
                      <td>{log.user_id?.full_name || "Hệ thống"}</td>
                      <td>{renderNote(log)}</td>
                      <td>{new Date(log.created_at).toLocaleString("vi-VN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default History;