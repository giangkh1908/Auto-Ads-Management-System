import { useMemo, useState } from "react";
import "./PaymentManagement.css";
import { Search, ChevronDown, Check, X, FileText } from "lucide-react";
import DateRangePicker from "../../../../components/common/DateRangePicker/DateRangePicker";

// Mock data demo UI – có thể thay bằng dữ liệu API sau
const MOCK_TRANSACTIONS = [
  {
    id: "t1",
    userId: "abc12345",
    name: "Vũ Quỳnh Lan",
    phone: "0123456789",
    email: "quynhlan@gmail.com",
    transactionId: "TXN - 1234567890",
    package: "Basic",
    amount: "1,200,000",
    method: "Momo",
    paymentTime: "01/08/2024 10:30:45",
    status: "Pending",
    action: "Approve/Reject",
    note: "",
  },
  {
    id: "t2",
    userId: "xyz789012",
    name: "Kim Hồng Giang",
    phone: "0123456789",
    email: "kimgiang@gmail.com",
    transactionId: "TXN - 0987654321",
    package: "Chatbot",
    amount: "1,500,000",
    method: "VietQR",
    paymentTime: "02/08/2024 14:20:30",
    status: "Failed",
    action: "-",
    note: "",
  },
  {
    id: "t3",
    userId: "dhe123456",
    name: "Nguyễn Thành Long",
    phone: "0123456789",
    email: "longnthe171630@fpt.edu.vn",
    transactionId: "TXN - 1122334455",
    package: "Chatbot AI",
    amount: "12,000,000",
    method: "Momo",
    paymentTime: "22/07/2024 09:15:20",
    status: "Success",
    action: "View Invoice",
    note: "",
  },
  {
    id: "t4",
    userId: "fgh789012",
    name: "Hà Anh Tuấn",
    phone: "0123456789",
    email: "anhtuan@gmail.com",
    transactionId: "TXN - 5566778899",
    package: "Chatbot",
    amount: "500,000",
    method: "VietQR",
    paymentTime: "11/10/2024 08:20:15",
    status: "Success",
    action: "View Invoice",
    note: "",
  },
  {
    id: "t5",
    userId: "ijk123456",
    name: "Nguyễn Trọng Hưng",
    phone: "0123456789",
    email: "tronghung@gmail.com",
    transactionId: "TXN - 9988776655",
    package: "Basic",
    amount: "-",
    method: "Momo",
    paymentTime: "-",
    status: "Cancelled",
    action: "-",
    note: "",
  },
  {
    id: "t6",
    userId: "lmn789012",
    name: "Nguyễn Trung Kiên",
    phone: "0123456789",
    email: "trungkien@gmail.com",
    transactionId: "TXN - 4433221100",
    package: "Chatbot AI",
    amount: "-",
    method: "VietQR",
    paymentTime: "-",
    status: "Rejected",
    action: "",
    note: "Tài khoản thanh toán nợ xấu.",
  },
];

const PACKAGES = ["All", "Basic", "Premium", "Enterprise"];
const PAYMENT_METHODS = ["All", "Momo", "VietQR", "Bank Transfer"];
const STATUSES = [
  "All",
  "Pending",
  "Success",
  "Failed",
  "Cancelled",
  "Rejected",
];

export default function PaymentManagement() {
  const [transactions] = useState(MOCK_TRANSACTIONS);
  const [search, setSearch] = useState("");
  const [packageFilter, setPackageFilter] = useState("All");
  const [methodFilter, setMethodFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateRange, setDateRange] = useState(""); // format: "dd/mm/yyyy - dd/mm/yyyy"

  // Calculate summary statistics
  const summary = useMemo(() => {
    const pending = transactions.filter((t) => t.status === "Pending").length;
    const approved = transactions.filter((t) => t.status === "Success").length;
    const rejected = transactions.filter((t) => t.status === "Rejected").length;
    const failed = transactions.filter((t) => t.status === "Failed").length;
    const cancelled = transactions.filter(
      (t) => t.status === "Cancelled"
    ).length;
    const total = transactions.length;
    return { pending, approved, rejected, failed, cancelled, total };
  }, [transactions]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return transactions.filter((t) => {
      // Search theo ID, Name, Phone, Email, Transaction ID
      const matchSearch =
        !s ||
        t.userId.toLowerCase().includes(s) ||
        t.name.toLowerCase().includes(s) ||
        (t.phone || "").toLowerCase().includes(s) ||
        (t.email || "").toLowerCase().includes(s) ||
        t.transactionId.toLowerCase().includes(s);

      // Lọc theo package
      const matchPackage =
        packageFilter === "All" ? true : t.package === packageFilter;

      // Lọc theo payment method
      const matchMethod =
        methodFilter === "All" ? true : t.method === methodFilter;

      // Lọc theo status
      const matchStatus =
        statusFilter === "All" ? true : t.status === statusFilter;

      // Lọc theo khoảng ngày
      let matchDate = true;
      if (dateRange.includes("-") && t.paymentTime !== "-") {
        const [from, to] = dateRange.split("-").map((v) => v.trim());
        // Định dạng: dd/mm/yyyy
        const parse = (d) => {
          const [dd, mm, yyyy] = d.split("/").map((x) => parseInt(x));
          if (!dd || !mm || !yyyy) return null;
          return new Date(yyyy, mm - 1, dd).getTime();
        };
        const fromTs = parse(from);
        const toTs = parse(to);
        if (fromTs || toTs) {
          // So sánh với paymentTime (lấy phần ngày)
          const paymentDate = t.paymentTime.split(" ")[0];
          const paymentTs = parse(paymentDate);
          if (paymentTs) {
            if (fromTs && paymentTs < fromTs) matchDate = false;
            if (toTs && paymentTs > toTs) matchDate = false;
          }
        }
      }
      return (
        matchSearch && matchPackage && matchMethod && matchStatus && matchDate
      );
    });
  }, [
    search,
    packageFilter,
    methodFilter,
    statusFilter,
    dateRange,
    transactions,
  ]);

  const handleAction = (transaction, actionType) => {
    // TODO: Implement action handlers
    console.log("Action:", actionType, "for transaction:", transaction.id);
    if (actionType === "approve") {
      // Handle approve
      console.log("Approving transaction:", transaction.id);
    } else if (actionType === "reject") {
      // Handle reject
      console.log("Rejecting transaction:", transaction.id);
    } else if (actionType === "view-invoice") {
      // Handle view invoice
      console.log("Viewing invoice for transaction:", transaction.id);
    }
  };

  return (
    <div className="payment-mgmt">
      {/* Summary Statistics */}
      <div className="payment-mgmt-summary">
        <span>
          Pending: {summary.pending} | Approved: {summary.approved} | Rejected:{" "}
          {summary.rejected} | Failed: {summary.failed} | Cancelled:{" "}
          {summary.cancelled} | Total: {summary.total}
        </span>
      </div>

      {/* Toolbar */}
      <div className="payment-mgmt-toolbar">
        <div className="payment-mgmt-toolbar-left">
          <div className="payment-mgmt-filter-group">
            <label className="payment-mgmt-filter-label">Search</label>
            <div className="payment-mgmt-search">
              <input
                className="payment-mgmt-search-input"
                placeholder="Name, Phone, Email, Transaction ID"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <span className="payment-mgmt-search-icon">
                <Search size={16} />
              </span>
            </div>
          </div>
          <div className="payment-mgmt-filter-group">
            <label className="payment-mgmt-filter-label">Package</label>
            <div className="payment-mgmt-select-wrapper">
              <select
                className="payment-mgmt-select"
                value={packageFilter}
                onChange={(e) => setPackageFilter(e.target.value)}
              >
                {PACKAGES.map((pkg) => (
                  <option key={pkg} value={pkg}>
                    {pkg}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="payment-mgmt-select-icon" />
            </div>
          </div>

          <div className="payment-mgmt-filter-group">
            <label className="payment-mgmt-filter-label">Payment Method</label>
            <div className="payment-mgmt-select-wrapper">
              <select
                className="payment-mgmt-select"
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="payment-mgmt-select-icon" />
            </div>
          </div>

          <div className="payment-mgmt-filter-group">
            <label className="payment-mgmt-filter-label">Status</label>
            <div className="payment-mgmt-select-wrapper">
              <select
                className="payment-mgmt-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="payment-mgmt-select-icon" />
            </div>
          </div>
        </div>

        <div className="payment-mgmt-toolbar-right">
          <DateRangePicker
            value={dateRange}
            onChange={(value) => setDateRange(value)}
            placeholder="dd/mm/yyyy - dd/mm/yyyy"
          />
        </div>
      </div>

      {/* Table */}
      <div className="payment-mgmt-table">
        <div className="payment-mgmt-row payment-mgmt-header">
          <div className="payment-mgmt-col payment-mgmt-col-userid">UserID</div>
          <div className="payment-mgmt-col payment-mgmt-col-name">Name</div>
          <div className="payment-mgmt-col payment-mgmt-col-phone">Phone</div>
          <div className="payment-mgmt-col payment-mgmt-col-email">Email</div>
          <div className="payment-mgmt-col payment-mgmt-col-transactionid">
            Transaction ID
          </div>
          <div className="payment-mgmt-col payment-mgmt-col-package">
            Package
          </div>
          <div className="payment-mgmt-col payment-mgmt-col-amount">Amount</div>
          <div className="payment-mgmt-col payment-mgmt-col-method">Method</div>
          <div className="payment-mgmt-col payment-mgmt-col-paymenttime">
            Payment Time
          </div>
          <div className="payment-mgmt-col payment-mgmt-col-status">Status</div>
          <div className="payment-mgmt-col payment-mgmt-col-action">Action</div>
          <div className="payment-mgmt-col payment-mgmt-col-note">Note</div>
        </div>

        {filtered.map((transaction) => (
          <div className="payment-mgmt-row" key={transaction.id}>
            <div className="payment-mgmt-col payment-mgmt-col-userid">
              {transaction.userId}
            </div>
            <div className="payment-mgmt-col payment-mgmt-col-name">
              {transaction.name}
            </div>
            <div className="payment-mgmt-col payment-mgmt-col-phone">
              {transaction.phone || "-"}
            </div>
            <div className="payment-mgmt-col payment-mgmt-col-email">
              {transaction.email || "-"}
            </div>
            <div className="payment-mgmt-col payment-mgmt-col-transactionid">
              {transaction.transactionId}
            </div>
            <div className="payment-mgmt-col payment-mgmt-col-package">
              {transaction.package || "-"}
            </div>
            <div className="payment-mgmt-col payment-mgmt-col-amount">
              {transaction.amount}
            </div>
            <div className="payment-mgmt-col payment-mgmt-col-method">
              {transaction.method}
            </div>
            <div className="payment-mgmt-col payment-mgmt-col-paymenttime">
              {transaction.paymentTime}
            </div>
            <div className="payment-mgmt-col payment-mgmt-col-status">
              <span
                className={`payment-mgmt-badge payment-mgmt-badge-${transaction.status.toLowerCase()}`}
              >
                {transaction.status}
              </span>
            </div>
            <div className="payment-mgmt-col payment-mgmt-col-action">
              {transaction.status === "Pending" ? (
                <div className="payment-mgmt-action-buttons">
                  <button
                    className="payment-mgmt-action-btn payment-mgmt-action-approve"
                    onClick={() => handleAction(transaction, "approve")}
                    title="Approve"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    className="payment-mgmt-action-btn payment-mgmt-action-reject"
                    onClick={() => handleAction(transaction, "reject")}
                    title="Reject"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : transaction.status === "Success" ? (
                <button
                  className="payment-mgmt-action-btn payment-mgmt-action-view"
                  onClick={() => handleAction(transaction, "view-invoice")}
                  title="View Invoice"
                >
                  <FileText size={16} />
                </button>
              ) : (
                "-"
              )}
            </div>
            <div className="payment-mgmt-col payment-mgmt-col-note">
              {transaction.note || "-"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
