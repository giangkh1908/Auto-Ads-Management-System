import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axios";
import { ROUTES, STORAGE_KEYS } from "../../constants/app.constants";
import "./AccountManagement.css";

function AccountManagement() {
  const navigate = useNavigate();

  // UI states
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");

  // query states
  const [searchText, setSearchText] = useState("");
  const [items, setItems] = useState([]); // raw items từ API
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  // state thống kê
  const [accountStats, setAccountStats] = useState({});

  /** Gọi API list ads accounts */
  const fetchAccounts = useCallback(
    async ({ q = "", page = 1, limit = 10 } = {}) => {
      setLoading(true);
      setError("");
      try {
        const params = { page, limit };
        if (q) params.q = q;

        const res = await axiosInstance.get("/api/ads-accounts", { params });
        // API trả: { items, total, page, limit, pages }
        console.log("📦 Dữ liệu API trả về:", res.data);
        setItems(res.data?.items || []);
        setTotal(res.data?.total || 0);
      } catch (err) {
        console.error(err);
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Không thể tải dữ liệu tài khoản quảng cáo."
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /** Lần đầu & khi đổi trang */
  useEffect(() => {
    fetchAccounts({ q: "", page, limit });
  }, [fetchAccounts, page, limit]);

  /** Đồng bộ từ Facebook rồi tải lại list */
  const handleSync = async () => {
    try {
      setSyncing(true);

      // 1️⃣ Đồng bộ danh sách tài khoản quảng cáo
      await axiosInstance.get("/api/ads-accounts/sync");

      // 2️⃣ Tải lại danh sách tài khoản
      await fetchAccounts({ q: searchText.trim(), page, limit });

      // 3️⃣ Lấy danh sách account_id từ items (sau khi load lại)
      const accountIds = items.map((acc) => acc.external_id).filter(Boolean);

      if (accountIds.length > 0) {
        for (const accountId of accountIds) {
          const formattedId = accountId.startsWith("act_")
            ? accountId
            : `act_${accountId}`;

          try {
            // 🌀 Đồng bộ Campaigns
            await axiosInstance.get(`/api/campaigns/sync?account_id=${formattedId}`);
            console.log(`✅ Đã đồng bộ campaigns cho: ${formattedId}`);

            // 🌀 Đồng bộ AdSets
            await axiosInstance.get(`/api/adsets/sync?account_id=${formattedId}`);
            console.log(`✅ Đã đồng bộ adsets cho: ${formattedId}`);

            // 🌀 Đồng bộ Ads
            await axiosInstance.get(`/api/ads/sync?account_id=${formattedId}`);
            console.log(`✅ Đã đồng bộ ads cho: ${formattedId}`);
          } catch (error) {
            console.error(`❌ Lỗi đồng bộ cho ${formattedId}:`, error);
          }
        }

        // 4️⃣ Cập nhật thống kê sau khi đồng bộ
        await fetchAccountStats(accountIds);
      }
    } catch (e) {
      console.error(e);
      alert("Đồng bộ thất bại");
    } finally {
      setSyncing(false);
    }
  };

  /** Lấy thống kê cho các tài khoản */
  const fetchAccountStats = useCallback(async (accountIds) => {
    if (!accountIds?.length) return;

    const stats = {};
    const timestamp = new Date().getTime();

    try {
      await Promise.all(
        accountIds.map(async (accountId) => {
          try {
            const response = await axiosInstance.get(
              `/api/ads-accounts/stats?account_id=${accountId}&_t=${timestamp}`,
              { headers: { "Cache-Control": "no-cache" } }
            );

            if (response.data && response.data.stats) {
              stats[accountId] = response.data.stats;
            } else {
              stats[accountId] = { campaigns: 0, adsets: 0, ads: 0 };
            }
          } catch (error) {
            console.error(`Lỗi lấy thống kê cho ${accountId}:`, error);
            stats[accountId] = { campaigns: 0, adsets: 0, ads: 0 };
          }
        })
      );
      setAccountStats(stats);
    } catch (error) {
      console.error("Lỗi lấy thống kê tài khoản:", error);
    }
  }, []);

  /** Gọi lại thống kê khi danh sách tài khoản thay đổi */
  useEffect(() => {
    if (items?.length > 0) {
      const accountIds = items.map((acc) => acc.external_id).filter(Boolean);
      if (accountIds.length > 0) fetchAccountStats(accountIds);
    }
  }, [items, fetchAccountStats]);

  /** Chuẩn hóa dữ liệu hiển thị */
  const accounts = useMemo(() => {
    return (items || []).map((acc, idx) => {
      const fbAccountStatus = Number(acc?.account_status);
      const fbStatusLabel =
        fbAccountStatus === 1
          ? "Hoạt động"
          : fbAccountStatus === 2
          ? "Vô hiệu hóa"
          : fbAccountStatus === 3
          ? "Chưa xác minh"
          : "Không hoạt động";

      const accountId = acc.external_id;
      const stats = accountStats[accountId] || {
        campaigns: 0,
        adsets: 0,
        ads: 0,
      };

      return {
        id: acc._id || idx,
        name: acc.name || "Facebook Ad Account",
        number: accountId || "-",
        campaignCount: stats.campaigns,
        adsetCount: stats.adsets,
        adCount: stats.ads,
        status: fbStatusLabel,
        updatedAt: new Date(
          acc.last_updated_at || acc.updated_at || acc.created_at || Date.now()
        ).toLocaleString("vi-VN"),
      };
    });
  }, [items, accountStats]);

  /** Tìm kiếm */
  const onSearch = () => {
    setPage(1);
    fetchAccounts({ q: searchText.trim(), page: 1, limit });
  };

  return (
    <div className="account-management-layout">
      <div className="account-management-content">
        <div className="account-management-center">
          <div className="account-management-card">
            {/* Header */}
            <div className="account-management-header">
              <div>
                <h3>Tài khoản quảng cáo</h3>
                <p>
                  Kết nối tài khoản quảng cáo Facebook để đo hiệu quả của từng
                  Chiến dịch.
                </p>
                <div className="search-row">
                  <input
                    className="search-input"
                    placeholder="Tìm kiếm ID, tên tài khoản"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && onSearch()}
                  />
                  <button
                    className="btn-find"
                    onClick={onSearch}
                    disabled={loading || syncing}
                  >
                    {loading ? "Tìm..." : "Tìm"}
                  </button>
                  <button
                    className="btn-find"
                    onClick={handleSync}
                    disabled={loading || syncing}
                  >
                    {syncing ? "Refresh..." : "Refresh"}
                  </button>
                </div>
              </div>

              <div>
                <button
                  className="add-account"
                  onClick={() => navigate(ROUTES.CONNECT_AD_ACCOUNT)}
                >
                  + Thêm tài khoản
                </button>
              </div>
            </div>

            {error && (
              <div style={{ color: "#ef4444", marginBottom: 12 }}>{error}</div>
            )}

            {/* Table */}
            <table className="table">
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Tên tài khoản</th>
                  <th className="text-right">Chiến dịch</th>
                  <th className="text-right">Nhóm quảng cáo</th>
                  <th className="text-right">Quảng cáo</th>
                  <th>Trạng thái</th>
                  <th>Cập nhật cuối</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center", color: "#6b7280" }}>
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : accounts.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center", color: "#6b7280" }}>
                      Không tìm thấy tài khoản quảng cáo nào.
                    </td>
                  </tr>
                ) : (
                  accounts.map((acc, idx) => (
                    <tr key={acc.id}>
                      <td>{(page - 1) * limit + idx + 1}</td>
                      <td>
                        <div>{acc.name}</div>
                        <div style={{ color: "#6b7280", fontSize: 12 }}>
                          {acc.number}
                        </div>
                      </td>
                      <td className="text-right">{acc.campaignCount}</td>
                      <td className="text-right">{acc.adsetCount}</td>
                      <td className="text-right">{acc.adCount}</td>
                      <td className="status-active">{acc.status}</td>
                      <td>{acc.updatedAt}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {total > limit && (
              <div
                style={{
                  marginTop: 12,
                  display: "flex",
                  gap: 8,
                  justifyContent: "flex-end",
                }}
              >
                <button
                  className="btn-find"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || loading || syncing}
                >
                  Trang trước
                </button>
                <button
                  className="btn-find"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={loading || syncing || page * limit >= total}
                >
                  Trang sau
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AccountManagement;
