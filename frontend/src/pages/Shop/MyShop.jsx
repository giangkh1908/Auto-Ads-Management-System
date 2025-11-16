import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { NavLink, Link } from "react-router-dom";
import { Plus, Edit, Play, Pause, Star, MapPin, ArrowRight } from "lucide-react";
import { ROUTES } from "../../constants/app.constants";
import "./Shop.css";
import { STORAGE_KEYS } from '../../constants/app.constants';
import axiosInstance from "../../utils/axios.js";
import { toast } from "sonner";
import { clearShopCache, saveShopCache } from "../../utils/shopCache";
import { useNavigate } from 'react-router-dom';
import { useMyPackage } from "../../hooks/useMyPackage.js";

function MyShop() {
  const { t } = useTranslation();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null); // ← Sửa: null, không phải true
  const navigate = useNavigate();

  // Package
  const { pkg, loading: pkgLoading, hasFeature, canAdd } = useMyPackage();

  // Tính toán current shop
  const currentShop = shops.find(s => s.isCurrent);

  // Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);

  // Forms
  const [addForm, setAddForm] = useState({
    shopName: "",
    category: "other",
  });

  const [updateForm, setUpdateForm] = useState({
    id: null,
    shopName: "",
    category: "other",
  });

  // === LẤY USER ===
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axiosInstance.get("/api/auth/me");
        setCurrentUser(res.data.data.user);
      } catch (error) {
        console.error("Error fetching user:", error);
        toast.error("Lỗi khi tải thông tin người dùng");
      }
    };
    fetchUser();
  }, []);

  // === LẤY DANH SÁCH SHOP ===
  useEffect(() => {
    loadShops();
  }, []);

  const loadShops = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/api/shops/owner");
      const data = res.data;

      if (data.success && Array.isArray(data.data)) {
        const formatted = data.data.map((shop) => {
          const permissions = shop.user_role?.permissions || [];
          const canUpdate = permissions.some(p => p.module === "shop" && p.actions.includes("update_details"));
          const canViewEmployee = permissions.some(p => p.module === "employee" && p.actions.includes("view"));

          return {
            id: shop._id,
            shopName: shop.shop_name || "Unnamed Shop",
            package: shop.package || "Basic",
            employeeCount: shop.employee_count || 0,
            pageCount: shop.page_count || 0,
            industry: shop.industry || "Other",
            isCurrent: shop.is_current || false,
            role: shop.user_role?.role_name || "Owner",
            email: shop.owner_id?.email || "",
            phone: shop.owner_id?.phone || "",
            expired: shop.expired_at ? new Date(shop.expired_at).toISOString().slice(0, 10) : "N/A",
            status: shop.status || "Active",
            canUpdate,
            canViewEmployee,
          };
        });
        setShops(formatted);
      } else {
        toast.error(data.message || "Không thể tải danh sách shop");
        setShops([]);
      }
    } catch (e) {
      console.error("Load shops error:", e);
      toast.error("Lỗi khi tải danh sách shop");
      setShops([]);
    } finally {
      setLoading(false);
    }
  };

  // === KIỂM TRA QUYỀN TẠO SHOP ===
  const canCreateShop = pkg && canAdd("shops");

  // === MỞ MODAL THÊM SHOP ===
  const handleAddNewPage = () => {
    if (!canCreateShop) {
      toast.warning("Bạn cần nâng cấp gói để thêm shop!");
      return;
    }
    setIsAddOpen(true);
  };

  return (
    <div className="shop-border">

      {/* === THÔNG BÁO GÓI === */}
      {pkgLoading && <div>Đang tải gói dịch vụ...</div>}

      {!pkgLoading && !pkg && (
        <div className="alert alert-warning" style={{ margin: "16px 0", padding: "12px", background: "#fff3cd", borderRadius: "8px" }}>
          <strong>Bạn chưa có gói dịch vụ.</strong>{" "}
          <Link to="/service-package" style={{ color: "#d39e00" }}>Chọn gói ngay</Link> để mở khóa AI, thêm shop, v.v.
        </div>
      )}

      {!pkgLoading && pkg && (
        <div style={{ marginBottom: "16px" }}>
          <h3>{pkg.package.name}</h3>
          <div style={{ fontSize: "14px", color: "#555" }}>
            <div>Shops: {pkg.usage.shops}/{pkg.limits.shops}</div>
            <div>Nhân viên: {pkg.usage.employees}/{pkg.limits.employees}</div>
          </div>
          {pkg.status === "expiring soon" && <div style={{ color: "orange" }}>Sắp hết hạn!</div>}
        </div>
      )}

      {/* === TABS === */}
      <div className="shop-tabs">
        <NavLink end to={ROUTES.SHOP} className={({ isActive }) => `shop-tab ${isActive ? "active" : ""}`}>
          {t('shop.my_shop')}
        </NavLink>

        {currentShop?.role !== "Marketer" && currentShop?.canViewEmployee && (
          <NavLink
            to={ROUTES.SHOP_EMPLOYEE.replace(":shopId", currentShop.id)}
            className={({ isActive }) => `shop-tab ${isActive ? "active" : ""}`}
          >
            {t("shop.employee")}
          </NavLink>
        )}

        <NavLink
          to={currentShop?.id ? ROUTES.SHOP_HISTORY.replace(":shopId", currentShop.id) : ROUTES.SHOP}
          className={({ isActive }) => `shop-tab ${isActive ? "active" : ""}`}
        >
          {t('shop.history')}
        </NavLink>
      </div>

      {/* === NÚT THÊM SHOP === */}
      <div className="btn-add" style={{ margin: "16px 0" }}>
        <button
          className="btn-add-new-page"
          onClick={handleAddNewPage}
          disabled={!canCreateShop}
          style={{
            opacity: canCreateShop ? 1 : 0.5,
            cursor: canCreateShop ? "pointer" : "not-allowed"
          }}
          title={!pkg ? "Cần có gói" : !canAdd("shops") ? "Đã đạt giới hạn" : "Thêm shop"}
        >
          <Plus size={16} />
          {t('shop.add_new_shop')}
        </button>
      </div>

      {/* === BẢNG SHOP === */}
      <div className="shop-container">
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <p>Đang tải danh sách shop...</p>
          </div>
        ) : shops.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>
            <p>Chưa có shop nào. Hãy tạo shop đầu tiên!</p>
          </div>
        ) : (
          <div className="shops-table">
            <div className="table-header-shop">
              <div className="table-cell-name">{t('shop.shop_name')}</div>
              <div className="table-cell">{t('shop.package')}</div>
              <div className="table-cell">{t('shop.employee_count')}</div>
              <div className="table-cell">{t('shop.page_count')}</div>
              <div className="table-cell">{t('shop.role')}</div>
              <div className="table-cell">{t('shop.expired')}</div>
              <div className="table-cell">{t('shop.action')}</div>
            </div>

            {shops.map((shop) => (
              <div key={shop.id} className="table-row-shop">
                <div className="table-cell-name">
                  <div className="shop-name">
                    <div className="shop-avatar">
                      {shop.shopName.charAt(0).toUpperCase()}
                    </div>
                    <span>{shop.shopName}</span>
                    {shop.isCurrent && <span className="current-badge"><MapPin size={14} /></span>}
                  </div>
                </div>
                <div className="table-cell">
                  <span className={`package-badge package-${shop.package.toLowerCase()}`}>
                    {shop.package}
                  </span>
                </div>
                <div className="table-cell">{shop.employeeCount}</div>
                <div className="table-cell">{shop.pageCount}</div>
                <div className="table-cell">
                  <span className="role-badge">{shop.role}</span>
                </div>
                <div className="table-cell">{shop.expired}</div>
                <div className="table-cell">
                  <div className="action-buttons">
                    <button
                      className="shop-action-btn shop-update-btn"
                      onClick={() => {
                        setUpdateForm({
                          id: shop.id,
                          shopName: shop.shopName,
                          category: (shop.industry || "other").toLowerCase(),
                        });
                        setIsUpdateOpen(true);
                      }}
                      disabled={!shop.canUpdate}
                      title="Cập nhật"
                    >
                      <Edit size={14} />
                    </button>

                    <button
                      className={`shop-action-btn shop-current-btn ${shop.isCurrent ? "active" : ""}`}
                      onClick={async () => {
                        if (shop.isCurrent) return;
                        try {
                          const res = await axiosInstance.patch(`/api/shops/switch/${shop.id}`);
                          if (res.data.success) {
                            clearShopCache();
                            localStorage.setItem("selectedShopId", shop.id);
                            saveShopCache({
                              id: shop.id,
                              shop_name: shop.shopName,
                              package: shop.package,
                              role: shop.role,
                              is_current: true,
                            });
                            toast.success("Chuyển shop thành công!");
                            await loadShops();
                          }
                        } catch (err) {
                          toast.error("Lỗi chuyển shop");
                        }
                      }}
                      disabled={shop.isCurrent}
                    >
                      {shop.isCurrent ? <MapPin size={14} /> : <ArrowRight size={14} />}
                    </button>

                    <button
                      className="shop-action-btn shop-upgrade-btn"
                      onClick={() => navigate("/service-package")}
                      title={t('shop.upgrade')}
                    >
                      <Star size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* === MODAL THÊM SHOP === */}
      {isAddOpen && canCreateShop && (
        <div className="modal-overlay" onClick={() => setIsAddOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('shop.add_shop')}</h3>
              <button
                className="modal-close"
                onClick={() => setIsAddOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-field">
                <label htmlFor="add-shopName">{t('shop.shop_name')}</label>
                <input
                  id="add-shopName"
                  type="text"
                  className="modal-input"
                  value={addForm.shopName}
                  onChange={(e) =>
                    setAddForm({ ...addForm, shopName: e.target.value })
                  }
                />
              </div>

              <div className="form-field">
                <label htmlFor="add-email">{t('shop.email')}</label>
                <input
                  id="add-email"
                  type="email"
                  className="modal-input"
                  value={currentUser?.email || "Chưa có email"}
                  disabled
                  style={{ backgroundColor: "#e4e7ec" }}
                  title = "Tự động sử dụng email của bạn"
                />
              </div>
              <div className="form-field">
                <label htmlFor="add-phone">{t('shop.phone_number')}</label>
                <input
                  id="add-phone"
                  type="tel"
                  className="modal-input"
                  value={currentUser?.phone || "Chưa có số điện thoại"}
                  disabled
                  style={{ backgroundColor: "#e4e7ec" }}
                  title = "Tự động sử dụng số điện thoại của bạn"
                />
              </div>

              <div className="form-field">
                <label htmlFor="add-category">{t('shop.category')}</label>
                <select
                  id="add-category"
                  className="modal-select-shop"
                  value={addForm.category}
                  onChange={(e) =>
                    setAddForm({ ...addForm, category: e.target.value })
                  }
                >
                  <option value="other">{t('shop.other')}</option>
                  <option value="fashion">{t('shop.fashion')}</option>
                  <option value="food">{t('shop.food')}</option>
                  <option value="tech">{t('shop.tech')}</option>
                  <option value="beauty">{t('shop.beauty')}</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-secondary-shop"
                onClick={() => setIsAddOpen(false)}
              >
                {t('shop.cancel')}
              </button>
              <button
                className="btn-primary-shop"
                onClick={async () => {
                  try {
                    const payload = {
                      shop_name: addForm.shopName,
                      industry: addForm.category,
                    };

                    console.log("Submit Add:", payload);

                    const res = await axiosInstance.post("/api/shops/", payload);
                    const data = res.data;
                    if (data.success) {
                      toast.success("Tạo shop thành công!");
                      setIsAddOpen(false);
                      setIsAddOpen(false);
                      window.location.reload();
                    } else {
                      toast.error(data.message || "Không thể tạo shop");
                    }
                  } catch (err) {
                    console.error("Error:", err);
                    toast.error(err.response?.data?.message || "Lỗi server khi tạo shop");
                  }
                }}
              >
                {t('shop.create')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Shop Modal */}
      {isUpdateOpen && (
        <div className="modal-overlay" onClick={() => setIsUpdateOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('shop.update_shop')}</h3>
              <button
                className="modal-close"
                onClick={() => setIsUpdateOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-field">
                <label htmlFor="upd-shopName">{t('shop.shop_name')}</label>
                <input
                  id="upd-shopName"
                  type="text"
                  className="modal-input"
                  value={updateForm.shopName}
                  onChange={(e) =>
                    setUpdateForm({ ...updateForm, shopName: e.target.value })
                  }
                />
              </div>

              <div className="form-field">
                <label htmlFor="upd-email">{t('shop.email')}</label>
                <input
                  id="upd-email"
                  type="email"
                  className="modal-input"
                  value={currentUser.email}
                  style={{ backgroundColor: "#dddbdbff" }}
                  disabled
                  readOnly
                />
              </div>
              <div className="form-field">
                <label htmlFor="upd-phone">{t('shop.phone_number')}</label>
                <input
                  id="upd-phone"
                  type="tel"
                  className="modal-input"
                  value={currentUser?.phone || "Chưa có số điện thoại"}
                  style={{ backgroundColor: "#dddbdbff" }}
                  disabled
                  readOnly
                />
              </div>

              <div className="form-field">
                <label htmlFor="upd-category">{t('shop.category')}</label>
                <select
                  id="upd-category"
                  className="modal-select-shop"
                  value={updateForm.category}
                  onChange={(e) =>
                    setUpdateForm({ ...updateForm, category: e.target.value })
                  }
                >
                  <option value="other">{t('shop.other')}</option>
                  <option value="fashion">{t('shop.fashion')}</option>
                  <option value="food">{t('shop.food')}</option>
                  <option value="tech">{t('shop.tech')}</option>
                  <option value="beauty">{t('shop.beauty')}</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-secondary-shop"
                onClick={() => setIsUpdateOpen(false)}
              >
                {t('shop.cancel')}
              </button>
              <button
                className="btn-primary-shop"
                onClick={async () => {
                  try {
                    const payload = {
                      shop_name: updateForm.shopName,
                      industry: updateForm.category,
                    };

                    const res = await axiosInstance.put(`/api/shops/${updateForm.id}`, payload);
                    const data = res.data;
                    if (data.success) {
                      toast.success("Cập nhật shop thành công!");
                      setIsUpdateOpen(false);

                      // Refresh danh sách shop
                      await loadShops();
                    } else {
                      toast.error(data.message || "Không thể cập nhật shop");
                    }
                  } catch (err) {
                    console.error("Error updating shop:", err);
                    toast.error(err.response?.data?.message || "Lỗi server khi cập nhật shop");
                  }
                }}
              >
                {t('shop.update')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyShop;