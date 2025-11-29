import { useMemo, useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import "./PaymentPage.css";
import { Search, ChevronDown, UserPlus, UserCheck, Eye } from "lucide-react";
import DateRangePicker from "../../../../components/common/DateRangePicker/DateRangePicker";
import Pagination from "../../../../components/common/Pagination/Pagination";
import paymentTransactionService from "../../../../services/paymentTransactionService";
import { toast } from "sonner";
import NoteEditor from "../../../../components/common/NoteEditor/NoteEditor";
import { fetchLatestNotesBatch } from "../../../../utils/noteUtils";
import { useAuth } from "../../../../hooks/useAuth";
import axiosInstance from "../../../../utils/axios";
import Invoice from "../../../../components/feature/Invoice/Invoice";

export default function PaymentPage() {
  const { t, i18n } = useTranslation("admin");
  const { user } = useAuth();
  const currentUserId = user?._id || user?.id;
  const [rawPayments, setRawPayments] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [packageFilter, setPackageFilter] = useState("All");
  const [paymentMethod, setPaymentMethod] = useState("All");
  const [status, setStatus] = useState("All");
  const [assignedStatus, setAssignedStatus] = useState("All");
  const [dateRange, setDateRange] = useState("");
  const [invoiceModal, setInvoiceModal] = useState({
    isOpen: false,
    transactionId: null,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  const ASSIGNED_STATUSES = useMemo(() => [t("common.all"), t("common.assigned"), t("common.unassigned")], [t]);

  // Server-provided filter options
  const [serverPackages, setServerPackages] = useState([]);
  const [serverMethods, setServerMethods] = useState([]);
  const [serverStatuses, setServerStatuses] = useState([]);

  // Helper function để map dữ liệu từ backend sang format UI
  const mapPaymentData = useCallback((txn) => {
    const user = txn.user_id || {};
    const pkg = txn.package_id || {};
    const assignedUser = txn.assigned_to || {};

    // Format payment time
    const formatDate = (date) => {
      if (!date) return "-";
      const d = new Date(date);
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, "0");
      const minutes = String(d.getMinutes()).padStart(2, "0");
      const seconds = String(d.getSeconds()).padStart(2, "0");
      return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    };

    // Map status với translation
    const statusMap = {
      pending: t("paymentManagement.statuses.pending"),
      success: t("paymentManagement.statuses.success"),
      failed: t("paymentManagement.statuses.failed"),
      canceled: t("paymentManagement.statuses.canceled"),
      cancelled: t("paymentManagement.statuses.canceled"),
      rejected: t("paymentManagement.statuses.rejected"),
      initializing: t("paymentManagement.statuses.initializing"),
    };

    // Map method từ DB sang UI
    const methodMap = {
      momo: "Momo",
      vnpay: "VietQR",
      vietqr: "VietQR",
      "manual banking": "Manual Banking",
    };

    // Map package name
    const mapPackageName = (name) => {
      if (!name) return "-";
      const lower = name.toLowerCase();
      if (lower.includes("chatbot ai")) return "Chatbot AI";
      if (lower.includes("chatbot")) return "Chatbot";
      return name;
    };

    const statusLower = (txn.status || "").toLowerCase();
    const isCanceled = statusLower === "canceled" || statusLower === "cancelled";
    const note =
      isCanceled && txn.metadata?.rejectReason
        ? txn.metadata.rejectReason
        : txn.metadata?.note || "";

    return {
      id: txn._id,
      transactionId: txn.provider_ref || `TXN-${txn._id}`,
      name: user.full_name || "-",
      phone: user.phone || "",
      email: user.email || "",
      package: mapPackageName(pkg.name),
      method:
        methodMap[txn.method?.toLowerCase()] ||
        (txn.method?.toLowerCase().includes("bank")
          ? "Manual Banking"
          : txn.method) ||
        "-",
      paymentTime: formatDate(txn.payment_at || txn.created_at),
      status: statusMap[statusLower] || t("paymentManagement.statuses.pending"),
      statusKey: statusLower || "pending", // Lưu status gốc để dùng cho CSS class
      action:
        txn.status === "pending"
          ? "-"
          : txn.status === "success"
            ? "invoice"
            : "-",
      assignedStatus: assignedUser._id ? t("common.assigned") : t("common.unassigned"),
      assignedToId: assignedUser._id || null,
      assignedToName: assignedUser.full_name || "",
      note: note,
      noteId: null,
      originalData: txn,
    };
  }, [t]);

  // Fetch payment transactions from API
  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const allValue = t("common.all");
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: search.trim() || undefined,
        package_id: packageFilter !== allValue ? packageFilter : undefined,
        method: paymentMethod !== allValue ? paymentMethod : undefined,
        startDate: dateRange.split("-")[0]?.trim(),
        endDate: dateRange.split("-")[1]?.trim(),
      };

      // Status: when user picks a status we send the raw status key
      if (status !== "All" && status !== allValue) {
        params.status = status;
      }

      // Assigned status: convert from translated label to raw value expected by backend
      if (assignedStatus !== "All" && assignedStatus !== allValue) {
        params.assigned_status = assignedStatus === t("common.assigned") ? "assigned" : "unassigned";
      }

      const response = await paymentTransactionService.getPaymentTransactions(
        params
      );

      if (response.success) {
        setRawPayments(response.data);
        const mappedPayments = response.data.map((txn) => mapPaymentData(txn));
        setRows(mappedPayments);
        setPagination(prev => ({
          ...prev,
          total: response.total,
          totalPages: response.pages
        }));

        // Fetch notes cho tất cả payments
        const noteItems = mappedPayments.map((payment) => ({
          target_type: "PaymentTransaction",
          target_id: payment.id,
        }));

        if (noteItems.length > 0) {
          const notesMap = await fetchLatestNotesBatch(noteItems);
          // Merge notes vào data
          const updatedPayments = mappedPayments.map((payment) => {
            const noteKey = `PaymentTransaction_${payment.id}`;
            const note = notesMap.get(noteKey);
            return {
              ...payment,
              note: note?.note || payment.note || "",
              noteId: note?._id || null,
            };
          });
          setRows(updatedPayments);
        } else {
          setRows(mappedPayments);
        }
      } else {
        toast.error(response.message || t("paymentPage.messages.fetchErrorGeneric"));
        setRows([]);
      }
    } catch (error) {
      console.error("Error fetching payment transactions:", error);
      toast.error(t("paymentPage.messages.fetchError"));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [status, t, mapPaymentData, pagination.page, pagination.limit, search, packageFilter, paymentMethod, assignedStatus, dateRange]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // Load filter options (packages, methods, statuses) from server
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const res = await paymentTransactionService.getFilterOptions();
        if (res?.success && res.data) {
          setServerPackages(res.data.packages || []);
          setServerMethods(res.data.methods || []);
          setServerStatuses(res.data.statuses || []);
        }
      } catch (err) {
        console.error("Error loading payment filter options:", err);
        setServerPackages([]);
        setServerMethods([]);
        setServerStatuses([]);
      }
    };
    loadFilters();
  }, []);

  // Re-map data khi ngôn ngữ thay đổi
  useEffect(() => {
    if (rawPayments.length > 0) {
      const mappedPayments = rawPayments.map((txn) => mapPaymentData(txn));
      setRows(mappedPayments);
      // Reset filters về "All" khi đổi ngôn ngữ
      // setPackageFilter(t("common.all"));
      // setPaymentMethod(t("common.all"));
      // setStatus(t("common.all"));
      // setAssignedStatus(t("common.all"));
    }
  }, [i18n.language, rawPayments, mapPaymentData, t]);

  // Dynamic filters: prefer server-provided options, otherwise fallback to deriving from rows
  const packagesList = useMemo(() => {
    if (serverPackages && serverPackages.length > 0) {
      const arr = serverPackages.map(p => ({ value: p, label: p }));
      arr.sort((a,b) => a.label.localeCompare(b.label));
      return [{ value: "All", label: t("common.all") }, ...arr];
    }
    const setPackages = new Set(rows.map((r) => r.package).filter(Boolean));
    const arr = Array.from(setPackages).map(p => ({ value: p, label: p }));
    arr.sort((a,b) => a.label.localeCompare(b.label));
    return [{ value: "All", label: t("common.all") }, ...arr];
  }, [rows, t, serverPackages]);

  const methodsList = useMemo(() => {
    const methodMap = {
      momo: "Momo",
      vnpay: "VietQR",
      vietqr: "VietQR",
      "manual banking": "Manual Banking",
    };
    if (serverMethods && serverMethods.length > 0) {
      const arr = serverMethods.map(m => ({ value: m, label: methodMap[(m || "").toLowerCase()] || m }));
      arr.sort((a,b) => a.label.localeCompare(b.label));
      return [{ value: "All", label: t("common.all") }, ...arr];
    }
    const setMethods = new Set(rows.map((r) => r.originalData?.method || r.method).filter(Boolean));
    const arr = Array.from(setMethods).map(m => ({ value: m, label: methodMap[(m || "").toLowerCase()] || m }));
    arr.sort((a,b) => a.label.localeCompare(b.label));
    return [{ value: "All", label: t("common.all") }, ...arr];
  }, [rows, t, serverMethods]);

  const statusesList = useMemo(() => {
    const statusMap = {
      pending: t("paymentManagement.statuses.pending"),
      success: t("paymentManagement.statuses.success"),
      failed: t("paymentManagement.statuses.failed"),
      canceled: t("paymentManagement.statuses.canceled"),
      cancelled: t("paymentManagement.statuses.canceled"),
      initializing: t("paymentManagement.statuses.initializing"),
    };
    if (serverStatuses && serverStatuses.length > 0) {
      const arr = serverStatuses.map(s => ({ value: s, label: statusMap[(s || "").toLowerCase()] || s }));
      arr.sort((a,b) => a.label.localeCompare(b.label));
      return [{ value: "All", label: t("common.all") }, ...arr];
    }
    const setStatuses = new Set(rows.map((r) => r.originalData?.status || r.status).filter(Boolean));
    const arr = Array.from(setStatuses).map(s => ({ value: s, label: statusMap[(s || "").toLowerCase()] || s }));
    arr.sort((a,b) => a.label.localeCompare(b.label));
    return [{ value: "All", label: t("common.all") }, ...arr];
  }, [rows, t, serverStatuses]);

  // Reset filters nếu giá trị không còn trong list
  useEffect(() => {
    const allValue = t("common.all");
    const vals = packagesList.map(p => (p && typeof p === 'object' ? p.value : p));
    if (packageFilter !== "All" && packageFilter !== allValue && !vals.includes(packageFilter)) {
      setPackageFilter(allValue);
    }
  }, [packagesList, packageFilter, t]);

  useEffect(() => {
    const allValue = t("common.all");
    const vals = methodsList.map(p => (p && typeof p === 'object' ? p.value : p));
    if (paymentMethod !== "All" && paymentMethod !== allValue && !vals.includes(paymentMethod)) {
      setPaymentMethod(allValue);
    }
  }, [methodsList, paymentMethod, t]);

  useEffect(() => {
    const allValue = t("common.all");
    const vals = statusesList.map(p => (p && typeof p === 'object' ? p.value : p));
    if (status !== "All" && status !== allValue && !vals.includes(status)) {
      setStatus(allValue);
    }
  }, [statusesList, status, t]);

  // Tính toán counters
  const counters = useMemo(() => {
    const pending = rows.filter((r) => r.status === t("paymentManagement.statuses.pending")).length;
    const approved = rows.filter((r) => r.status === t("paymentManagement.statuses.success")).length;
    const rejected = rows.filter((r) => r.status === t("paymentManagement.statuses.canceled")).length;
    const failed = rows.filter((r) => r.status === t("paymentManagement.statuses.failed")).length;
    const cancelled = rejected;
    const total = rows.length;
    return { pending, approved, rejected, failed, cancelled, total };
  }, [rows, t]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return rows.filter((row) => {
      // Search theo ID, name, phone, email, transaction ID
      const matchSearch =
        !s ||
        (row.id || "").toLowerCase().includes(s) ||
        (row.transactionId || "").toLowerCase().includes(s) ||
        (row.name || "").toLowerCase().includes(s) ||
        (row.phone || "").toLowerCase().includes(s) ||
        (row.email || "").toLowerCase().includes(s);

      // Lọc theo package (compare raw package name from originalData)
      const allValue = t("common.all");
      const matchPackage =
        packageFilter === "All" || packageFilter === allValue
          ? true
          : (String(row.originalData?.package_id?.name || "").toLowerCase() === String(packageFilter || "").toLowerCase());

      // Lọc theo payment method (compare raw method from originalData)
      const matchMethod =
        paymentMethod === "All" || paymentMethod === allValue
          ? true
          : String(row.originalData?.method || "").toLowerCase() === String(paymentMethod || "").toLowerCase();

      // Lọc theo status (compare raw status from originalData)
      const matchStatus =
        status === "All" || status === allValue
          ? true
          : String(row.originalData?.status || "").toLowerCase() === String(status || "").toLowerCase();

      // Lọc theo assigned status
      const matchAssignedStatus =
        assignedStatus === "All" || assignedStatus === allValue
          ? true
          : assignedStatus === t("common.assigned")
            ? row.assignedStatus === t("common.assigned")
            : row.assignedStatus === t("common.unassigned");

      // Lọc theo khoảng ngày
      let matchDate = true;
      if (dateRange.includes("-")) {
        const [from, to] = dateRange.split("-").map((v) => v.trim());
        const parse = (d) => {
          const [dd, mm, yyyy] = d.split("/").map((x) => parseInt(x));
          if (!dd || !mm || !yyyy) return null;
          return new Date(yyyy, mm - 1, dd).getTime();
        };
        const fromTs = parse(from);
        const toTs = parse(to);
        if (fromTs || toTs) {
          if (row.paymentTime && row.paymentTime !== "-") {
            const paymentDate = row.paymentTime.split(" ")[0];
            const paymentTs = parse(paymentDate);
            if (paymentTs) {
              if (fromTs && paymentTs < fromTs) matchDate = false;
              if (toTs && paymentTs > toTs) matchDate = false;
            }
          }
        }
      }

      return (
        matchSearch &&
        matchPackage &&
        matchMethod &&
        matchStatus &&
        matchAssignedStatus &&
        matchDate
      );
    });
  }, [
    search,
    packageFilter,
    paymentMethod,
    status,
    assignedStatus,
    dateRange,
    rows,
    t,
  ]);

  return (
    <div className="cs-pay-page">
      {/* Summary Counters */}
      <div className="cs-pay-summary">
        <span className="cs-pay-summary-item">
          {t("paymentPage.summary.pending")}: <strong>{counters.pending}</strong>
        </span>
        <span className="cs-pay-summary-item">
          {t("paymentPage.summary.approved")}: <strong>{counters.approved}</strong>
        </span>
        <span className="cs-pay-summary-item">
          {t("paymentPage.summary.rejected")}: <strong>{counters.rejected}</strong>
        </span>
        <span className="cs-pay-summary-item">
          {t("paymentPage.summary.failed")}: <strong>{counters.failed}</strong>
        </span>
        <span className="cs-pay-summary-item">
          {t("paymentPage.summary.cancelled")}: <strong>{counters.cancelled}</strong>
        </span>
        <span className="cs-pay-summary-item">
          {t("paymentPage.summary.total")}: <strong>{counters.total}</strong>
        </span>
      </div>

      <div className="cs-pay-toolbar">
        <div className="cs-pay-toolbar-left">
          <div className="cs-pay-filter-group">
            <label className="cs-pay-filter-label">{t("paymentPage.search")}</label>
            <div className="cs-pay-search">
              <input
                className="cs-pay-search-input"
                placeholder={t("paymentPage.searchPlaceholder")}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
              />
              <span className="cs-pay-search-icon">
                <Search size={16} />
              </span>
            </div>
          </div>

          <div className="cs-pay-filter-group">
            <label className="cs-pay-filter-label">{t("paymentPage.package")}</label>
            <div className="cs-pay-select-wrapper">
              <select
                className="cs-pay-select"
                value={packageFilter}
                onChange={(e) => {
                  setPackageFilter(e.target.value);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
              >
                {packagesList.map((p) => (
                  <option key={p?.value ?? p} value={p?.value ?? p}>
                    {p?.label ?? p}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="cs-pay-select-icon" />
            </div>
          </div>

          <div className="cs-pay-filter-group">
            <label className="cs-pay-filter-label">{t("paymentPage.paymentMethod")}</label>
            <div className="cs-pay-select-wrapper">
              <select
                className="cs-pay-select"
                value={paymentMethod}
                onChange={(e) => {
                  setPaymentMethod(e.target.value);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
              >
                {methodsList.map((m) => (
                  <option key={m?.value ?? m} value={m?.value ?? m}>
                    {m?.label ?? m}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="cs-pay-select-icon" />
            </div>
          </div>

          <div className="cs-pay-filter-group">
            <label className="cs-pay-filter-label">{t("paymentPage.status")}</label>
            <div className="cs-pay-select-wrapper">
              <select
                className="cs-pay-select"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
              >
                {statusesList.map((s) => (
                  <option key={s?.value ?? s} value={s?.value ?? s}>
                    {s?.label ?? s}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="cs-pay-select-icon" />
            </div>
          </div>

          <div className="cs-pay-filter-group">
            <label className="cs-pay-filter-label">{t("paymentPage.assignedStatus")}</label>
            <div className="cs-pay-select-wrapper">
              <select
                className="cs-pay-select"
                value={assignedStatus}
                onChange={(e) => {
                  setAssignedStatus(e.target.value);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
              >
                {ASSIGNED_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="cs-pay-select-icon" />
            </div>
          </div>

          <div className="cs-pay-filter-group">
            <label className="cs-pay-filter-label">{t("paymentPage.dateRange")}</label>
            <DateRangePicker
              value={dateRange}
              onChange={(value) => {
                setDateRange(value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              placeholder={t("paymentPage.dateRangePlaceholder")}
            />
          </div>
        </div>
      </div>

      <div className="cs-pay-table">
        <div className="cs-pay-row cs-pay-header">
          <div className="cs-pay-col cs-pay-col-name">{t("paymentPage.columns.name")}</div>
          <div className="cs-pay-col cs-pay-col-phone">{t("paymentPage.columns.phone")}</div>
          <div className="cs-pay-col cs-pay-col-email">{t("paymentPage.columns.email")}</div>
          <div className="cs-pay-col cs-pay-col-package">{t("paymentPage.columns.package")}</div>
          <div className="cs-pay-col cs-pay-col-method">{t("paymentPage.columns.method")}</div>
          <div className="cs-pay-col cs-pay-col-time">{t("paymentPage.columns.paymentTime")}</div>
          <div className="cs-pay-col cs-pay-col-status">{t("paymentPage.columns.status")}</div>
          <div className="cs-pay-col cs-pay-col-assigned">{t("paymentPage.columns.assignedStatus")}</div>
          <div className="cs-pay-col cs-pay-col-action">{t("paymentPage.columns.action")}</div>
          <div className="cs-pay-col cs-pay-col-note">{t("paymentPage.columns.note")}</div>
        </div>

        {!loading && rows.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px" }}>
            {t("paymentPage.messages.noData")}
          </div>
        ) : (
          rows.map((row) => (
            <div className="cs-pay-row" key={row.id}>
              <div className="cs-pay-col cs-pay-col-name">{row.name}</div>
              <div className="cs-pay-col cs-pay-col-phone">
                {row.phone || "-"}
              </div>
              <div className="cs-pay-col cs-pay-col-email">
                {row.email || "-"}
              </div>
              <div className="cs-pay-col cs-pay-col-package">
                {row.package || "-"}
              </div>
              <div className="cs-pay-col cs-pay-col-method">{row.method}</div>
              <div className="cs-pay-col cs-pay-col-time">
                {row.paymentTime && row.paymentTime !== "-" ? (
                  <>
                    <div>{row.paymentTime.split(" ")[0]}</div>
                    <div className="cs-pay-sub">
                      {row.paymentTime.split(" ")[1]}
                    </div>
                  </>
                ) : (
                  "-"
                )}
              </div>
              <div className="cs-pay-col cs-pay-col-status">
                <span
                  className={`cs-pay-badge cs-pay-badge-${row.statusKey || "pending"}`}
                >
                  {row.status}
                </span>
              </div>
              <div className="cs-pay-col cs-pay-col-assigned">
                {row.assignedStatus === t("common.unassigned") ? (
                  <button
                    className="cs-pay-assign-btn"
                    onClick={async () => {
                      const currentUserId = user?._id || user?.id;
                      if (!user || !currentUserId) {
                        toast.error(t("paymentPage.messages.userNotFound"));
                        return;
                      }

                      try {
                        await axiosInstance.put(
                          `/api/payment-transactions/${row.id}`,
                          {
                            assigned_to: currentUserId,
                          }
                        );
                        toast.success(t("paymentPage.messages.assignSuccess"));
                        fetchPayments();
                      } catch (error) {
                        const errorMessage =
                          error.response?.data?.message ||
                          error.message ||
                          t("paymentPage.messages.assignError");
                        toast.error(errorMessage);
                      }
                    }}
                    title={t("paymentPage.actions.assignTooltip")}
                  >
                    <UserPlus size={18} />
                  </button>
                ) : row.assignedToId &&
                  (user?._id || user?.id) &&
                  String(row.assignedToId) === String(user._id || user.id) ? (
                  <button
                    className="cs-pay-assign-btn cs-pay-assigned-btn"
                    onClick={async () => {
                      try {
                        await axiosInstance.put(
                          `/api/payment-transactions/${row.id}`,
                          {
                            assigned_to: null,
                          }
                        );
                        toast.success(t("paymentPage.messages.unassignSuccess"));
                        fetchPayments();
                      } catch (error) {
                        toast.error(
                          error.response?.data?.message ||
                          error.message ||
                          t("paymentPage.messages.unassignError")
                        );
                      }
                    }}
                    title={t("paymentPage.actions.unassignTooltip")}
                  >
                    <UserCheck size={18} />
                  </button>
                ) : (
                  <span className={`cs-pay-badge cs-pay-badge-assigned`}>
                    {row.assignedToName || t("common.assigned")}
                  </span>
                )}
              </div>
              <div className="cs-pay-col cs-pay-col-action">
                {row.action === "approveReject" ? (
                  <a
                    href="#"
                    className="cs-pay-link"
                    onClick={(e) => {
                      e.preventDefault();
                      // TODO: Implement approve/reject logic
                    }}
                  >
                    {t("paymentManagement.actions.approveReject")}
                  </a>
                ) : row.action === "invoice" ? (
                  <button
                    className="cs-pay-action-btn cs-pay-action-view"
                    onClick={() => {
                      setInvoiceModal({
                        isOpen: true,
                        transactionId: row.id,
                      });
                    }}
                    title={t("paymentManagement.actions.viewInvoice")}
                  >
                    <Eye size={16} />
                  </button>
                ) : (
                  "-"
                )}
              </div>
              <div className="cs-pay-col cs-pay-col-note">
                <NoteEditor
                  targetType="PaymentTransaction"
                  targetId={row.id}
                  initialNote={row.note || ""}
                  noteId={row.noteId}
                  placeholder={t("paymentPage.note.placeholder")}
                  disabled={
                    !(
                      row.assignedStatus === t("common.assigned") &&
                      row.assignedToId &&
                      currentUserId &&
                      String(row.assignedToId) === String(currentUserId)
                    )
                  }
                  disabledMessage={t("paymentPage.note.disabledMessage")}
                  onNoteSaved={() => {
                    fetchPayments();
                  }}
                />
              </div>
            </div>
          ))
        )}
      </div>

      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        totalItems={pagination.total}
        pageSize={pagination.limit}
        onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
        onPageSizeChange={(limit) => setPagination(prev => ({ ...prev, limit, page: 1 }))}
        pageSizeOptions={[25, 50, 75, 100]}
      />

      {/* Loading indicator */}
      {loading && (
        <div style={{ textAlign: "center", padding: "20px" }}>
          {t("paymentPage.messages.loading")}
        </div>
      )}



      {/* Invoice Modal */}
      <Invoice
        isOpen={invoiceModal.isOpen}
        onClose={() => setInvoiceModal({ isOpen: false, transactionId: null })}
        transactionId={invoiceModal.transactionId}
      />
    </div>
  );
}
