import { useMemo, useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useMemo, useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import "./CustomerLog.css";
import { Search } from "lucide-react";
import axiosInstance from "../../../../../utils/axios";
import { API_ENDPOINTS } from "../../../../../config/api.config";
import DateRangePicker from "../../../../../components/common/DateRangePicker/DateRangePicker";
import Pagination from "../../../../../components/common/Pagination/Pagination";

// Mock data demo UI – có thể thay bằng dữ liệu API sau
const MOCK_CUSTOMER_LOGS = [
  // ... keep mock data for fallback if needed, or remove if confident
];

export default function CustomerLog() {
  const { t, i18n } = useTranslation("admin");
  const [rawLogs, setRawLogs] = useState([]);
  const { t, i18n } = useTranslation("admin");
  const [rawLogs, setRawLogs] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dateRange, setDateRange] = useState(""); // format: "dd/mm/yyyy - dd/mm/yyyy"

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPagination(prev => ({ ...prev, page: 1 }));
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Helper function để map log data với translation
  const mapLogData = useCallback((log) => {
    // Map role với translation
    const roleMap = {
      "Marketer": t("customerLog.roles.marketer"),
      "Marketing Admin": t("customerLog.roles.marketingAdmin"),
      "Marketing admin": t("customerLog.roles.marketingAdmin"),
      "Shop Owner": t("customerLog.roles.shopOwner"),
      "N/A": t("customerLog.roles.nA"),
    };

    // Map userStatus với translation
    const statusMap = {
      "Active": t("customerLog.statuses.active"),
      "Inactive": t("customerLog.statuses.inactive"),
      "Banned": t("customerLog.statuses.banned"),
    };

    return {
      id: log._id || log.id,
      user: log.user || "N/A",
      userId: log.userId || "N/A",
      shopName: log.shopName || "N/A",
      shopId: log.shopId || "N/A",
      time: log.time
        ? new Date(log.time)
          .toLocaleString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })
          .replace(",", "")
        : "-",
      timeRaw: log.time ? new Date(log.time).getTime() : 0,
      role: roleMap[log.role] || log.role || t("customerLog.roles.nA"),
      userStatus: statusMap[log.userStatus] || log.userStatus || t("customerLog.statuses.active"),
      userStatusKey: (log.userStatus || "Active").toLowerCase(), // Lưu status gốc để dùng cho CSS class
      event: log.event || log.description || log.action || "-",
    };
  }, [t]);

  // Fetch customer logs từ API
  const fetchCustomerLogs = useCallback(async () => {
    try {
      setLoading(true);

      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch,
        startDate: dateRange.split("-")[0]?.trim(),
        endDate: dateRange.split("-")[1]?.trim(),
      };

      const response = await axiosInstance.get(API_ENDPOINTS.LOGS.CUSTOMERS, { params });

      if (response.data.success) {
        const customerLogs = response.data.data;
        setRawLogs(customerLogs);

        // Format data để hiển thị trong table
        const formattedLogs = customerLogs.map((log) => mapLogData(log));

        // Sort từ mới đến cũ (theo timeRaw)
        formattedLogs.sort((a, b) => b.timeRaw - a.timeRaw);

        setLogs(formattedLogs);

        // Update pagination info
        setPagination(prev => ({
          ...prev,
          total: response.data.total,
          totalPages: response.data.totalPages
        }));
      }
    } catch (error) {
      console.error("Error fetching customer logs:", error);
      // Fallback về mock data nếu có lỗi - map với translation
      const mappedMockLogs = MOCK_CUSTOMER_LOGS.map((log) => mapLogData(log));
      mappedMockLogs.sort((a, b) => b.timeRaw - a.timeRaw);
      setLogs(mappedMockLogs);
      setRawLogs(MOCK_CUSTOMER_LOGS);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, debouncedSearch, dateRange, mapLogData]);

  useEffect(() => {
    fetchCustomerLogs();
  }, [fetchCustomerLogs]);

  // Re-map data khi ngôn ngữ thay đổi
  useEffect(() => {
    if (rawLogs.length > 0) {
      const formattedLogs = rawLogs.map((log) => mapLogData(log));
      // Sort từ mới đến cũ (theo timeRaw)
      formattedLogs.sort((a, b) => b.timeRaw - a.timeRaw);
      setLogs(formattedLogs);
    }
  }, [i18n.language, rawLogs, mapLogData]);

  return (
    <div className="customer-log">
      <div className="customer-log-toolbar">
        <div className="customer-log-toolbar-left">
          <div className="customer-log-filter-group">
            <label className="customer-log-filter-label">{t("customerLog.search")}</label>
            <label className="customer-log-filter-label">{t("customerLog.search")}</label>
            <div className="customer-log-search">
              <input
                className="customer-log-search-input"
                placeholder={t("customerLog.searchPlaceholder")}
                placeholder={t("customerLog.searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <span className="customer-log-search-icon">
                <Search size={16} />
              </span>
            </div>
          </div>
        </div>
        <div className="customer-log-filter-group">
          <label className="customer-log-filter-label">{t("customerLog.dateRange")}</label>
          <label className="customer-log-filter-label">{t("customerLog.dateRange")}</label>
          <div className="customer-log-toolbar-right">
            <DateRangePicker
              value={dateRange}
              onChange={(value) => setDateRange(value)}
              placeholder={t("customerLog.dateRangePlaceholder")}
              placeholder={t("customerLog.dateRangePlaceholder")}
            />
          </div>
        </div>
      </div>

      <div className="customer-log-table">
        <div className="customer-log-row customer-log-header">
          <div className="customer-log-col customer-log-col-user">{t("customerLog.columns.user")}</div>
          <div className="customer-log-col customer-log-col-userid">{t("customerLog.columns.userId")}</div>
          <div className="customer-log-col customer-log-col-user">{t("customerLog.columns.user")}</div>
          <div className="customer-log-col customer-log-col-userid">{t("customerLog.columns.userId")}</div>
          <div className="customer-log-col customer-log-col-shopname">
            {t("customerLog.columns.shopName")}
            {t("customerLog.columns.shopName")}
          </div>
          <div className="customer-log-col customer-log-col-shopid">{t("customerLog.columns.shopId")}</div>
          <div className="customer-log-col customer-log-col-time">{t("customerLog.columns.time")}</div>
          <div className="customer-log-col customer-log-col-role">{t("customerLog.columns.role")}</div>
          <div className="customer-log-col customer-log-col-shopid">{t("customerLog.columns.shopId")}</div>
          <div className="customer-log-col customer-log-col-time">{t("customerLog.columns.time")}</div>
          <div className="customer-log-col customer-log-col-role">{t("customerLog.columns.role")}</div>
          <div className="customer-log-col customer-log-col-status">
            {t("customerLog.columns.userStatus")}
            {t("customerLog.columns.userStatus")}
          </div>
          <div className="customer-log-col customer-log-col-event">{t("customerLog.columns.event")}</div>
          <div className="customer-log-col customer-log-col-event">{t("customerLog.columns.event")}</div>
        </div>

        {loading ? (
          <div style={{ padding: "20px", textAlign: "center" }}>
            {t("customerLog.messages.loading")}
            {t("customerLog.messages.loading")}
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: "20px", textAlign: "center" }}>
            {t("customerLog.messages.noData")}
            {t("customerLog.messages.noData")}
          </div>
        ) : (
          logs.map((log) => (
            <div className="customer-log-row" key={log.id}>
              <div className="customer-log-col customer-log-col-user">
                {log.user}
              </div>
              <div className="customer-log-col customer-log-col-userid">
                {log.userId}
              </div>
              <div className="customer-log-col customer-log-col-shopname">
                {log.shopName}
              </div>
              <div className="customer-log-col customer-log-col-shopid">
                {log.shopId}
              </div>
              <div className="customer-log-col customer-log-col-time">
                {log.time}
              </div>
              <div className="customer-log-col customer-log-col-role">
                {log.role}
              </div>
              <div className="customer-log-col customer-log-col-status">
                <span
                  className={`customer-log-badge customer-log-badge-${log.userStatusKey || "active"}`}
                  className={`customer-log-badge customer-log-badge-${log.userStatusKey || "active"}`}
                >
                  {log.userStatus}
                </span>
              </div>
              <div className="customer-log-col customer-log-col-event">
                {log.event || "-"}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        totalItems={pagination.total}
        pageSize={pagination.limit}
        onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
        onPageSizeChange={(limit) => setPagination(prev => ({ ...prev, limit, page: 1 }))}
        pageSizeOptions={[20, 50, 75, 100]}
      />
    </div>
  );
}
