import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import facebook_icon from "../../assets/facebook.png";
import { ROUTES, STORAGE_KEYS } from "../../constants/app.constants";
import { Edit3, Pause, PlugZap, RefreshCcw, Repeat, Bell, Users, MessageCircle, Bot, Play, Calendar, Key, Store, Search as SearchIcon, Plus, Link2, CheckCircle, XCircle } from "lucide-react";
import profileService from "../../services/auth/profileService";
import { useMyPackage } from "../../hooks/package/useMyPackage.js";
import facebookService from "../../services/facebook/facebookService";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import LoadingOverlay from "../../components/common/LoadingOverlay/LoadingOverlay.jsx";

function Dashboard() {
  const [filterValue, setFilterValue] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("my-bots");
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const [connectedPages, setConnectedPages] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { t } = useTranslation();
  const { myPkg: pkg, loading: pkgLoading } = useMyPackage();
  const limitsPages = pkg?.package?.pages || 0;
  const canConnectPage = (pkg && connectedPages.length < limitsPages);

  // Tách logic load thành function riêng để tái sử dụng
  const loadPages = useCallback(async () => {
    try {
      const me = await profileService.getCurrentProfile();
      const shopUserPages = Array.isArray(me?.data?.user?.facebook_pages)
        ? me.data.user.facebook_pages
        : [];
      const userAccessiblePageIds = new Set(
        shopUserPages
          .filter(
            (p) =>
              p.connected_status === "connected" &&
              p.page_status !== "pause"
          )
          .map((p) => p.page_id)
      );

      // Lấy pages từ User.facebook_pages
      const pages = Array.isArray(me?.data?.user?.facebook_pages)
        ? me.data.user.facebook_pages
        : [];

      const normalized = pages
        // .filter((p) => p.connected_status === "connected")
        .map((p) => ({
          id: p.page_id,
          // Shop model dùng page_info.name
          name: p.page_info?.name || "Facebook Page",
          pageId: p.page_id,
          link: `https://www.facebook.com/${p.page_id}`,
          avatar:
            p.page_info?.picture_url ||
            `https://graph.facebook.com/${p.page_id}/picture?type=square`,
          status: p.page_status || "active",
          followerCount: 0,
          userHasAccess:
            userAccessiblePageIds.size === 0
              ? true
              : userAccessiblePageIds.has(p.page_id),
        }));
      setConnectedPages(normalized);
      return true;
    } catch {
      //console.error("Load dashboard shop info error");
      return false;
    }
  }, []);

  // Load pages khi component mount
  useEffect(() => {
    loadPages();
  }, [loadPages]);

  // Handle refresh button
  const handleRefresh = async () => {
    if (isRefreshing) return; // Prevent multiple clicks

    setIsRefreshing(true);
    try {
      await facebookService.refreshFacebookToken();
    } catch (error) {
      //console.error("Refresh user pages error:", error);
      toast.error(
        error?.message ||
        error?.detail?.message ||
        t("dashboard.refresh_error") ||
        "Không thể đồng bộ quyền trang từ Facebook"
      );
    }

    const success = await loadPages();
    if (success) {
      toast.success(t("dashboard.refresh_success") || "Đã làm mới danh sách");
    } else {
      toast.error(t("dashboard.refresh_error") || "Không thể làm mới dữ liệu");
    }
    setIsRefreshing(false);
  };

  // const handleContribute = () => {
  //   // console.log("Contributing page...");
  // };

  const handleAddNewPage = () => {
    navigate(ROUTES.CONNECT_PAGE);
  };

  // Get menu items based on page status
  const getMenuItems = (pageStatus) => {
    const items = [];

    if (pageStatus === "pause") {
      items.push({ id: "resume", icon: <Play size={16} />, text: t("dashboard.resume_page") });
    } else {
      items.push({ id: "pause", icon: <Pause size={16} />, text: t("dashboard.pause_page") });
    }

    items.push({ id: "disconnect", icon: <PlugZap size={16} />, text: t("dashboard.disconnect_page") });

    return items;
  };

  const handlePageMenu = (pageId) => {
    setOpenMenuId(openMenuId === pageId ? null : pageId);
  };

  const handleMenuItemClick = async (pageId, itemId) => {
    setOpenMenuId(null);
    if (itemId === "shop") {
      navigate(ROUTES.SHOP);
      return;
    }
    if (itemId === "pause") {
      try {
        const res = await facebookService.updatePageStatus(pageId, "pause");
        if (res?.success) {
          setConnectedPages((prev) =>
            prev.map((p) =>
              p.id === pageId ? { ...p, status: "pause" } : p
            )
          );
          toast.success(res.message || "Đã tạm dừng page.");
        } else {
          toast.warning(res.message || "Không thể tạm dừng page.");
        }
      } catch {
        // console.log("Pause page error");
        toast.error("Có lỗi khi tạm dừng page.");
      }
      return;
    }
    if (itemId === "resume") {
      try {
        const res = await facebookService.updatePageStatus(pageId, "active");
        if (res?.success) {
          setConnectedPages((prev) =>
            prev.map((p) =>
              p.id === pageId ? { ...p, status: "active" } : p
            )
          );
          toast.success(res.message || "Đã kích hoạt lại page.");
        } else {
          toast.warning(res.message || "Không thể kích hoạt lại page.");
        }
      } catch {
        // console.log("Resume page error");
        toast.error("Có lỗi khi kích hoạt lại page.");
      }
      return;
    }
    if (itemId === "disconnect") {
      try {
        const res = await facebookService.disconnectFacebookPage(pageId);
        // Kiểm tra phản hồi
        if (res?.success) {
          setConnectedPages((prev) => prev.filter((p) => p.id !== pageId));
          toast.success(res.message || "Đã ngắt kết nối page.");
        } else {
          toast.warning(res.message || "Không thể ngắt kết nối page.");
        }
      } catch {
        // console.log("Disconnect page error");
        toast.error("Có lỗi khi ngắt kết nối page.");
      }
    }
  };

  // Đóng menu khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  // Thêm biến filteredPages
  const filteredPages = connectedPages.filter((page) => {
    // Lọc theo trạng thái
    if (filterValue === "active") return page.status === "active";
    if (filterValue === "inactive") return page.status !== "active";
    return true; // "all"
  }).filter((page) => {
    // Lọc theo từ khóa tìm kiếm
    if (!searchQuery) return true;
    return page.name.toLowerCase().includes(searchQuery.toLowerCase()) || page.pageId.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="dashboard-layout">
      <LoadingOverlay isLoading={isRefreshing || pkgLoading} message="Đang tải..." />
      <div className="dashboard-content">
        <div className="dashboard-center">
          {/* Header with tabs */}
          <div className="dashboard-header">
            <div className="dashboard-tabs">
              <button
                className={`tab-button-dashboard ${activeTab === "my-bots" ? "active" : ""
                  }`}
                onClick={() => setActiveTab("my-bots")}
              >
                {t("dashboard.my_page")}
              </button>
              {/* <button 
                                className={`tab-button ${activeTab === 'template-bots' ? 'active' : ''}`}
                                onClick={() => setActiveTab('template-bots')}
                            >
                                Bot mẫu
                            </button> */}
              {/* <button 
                                className={`tab-button ${activeTab === 'facebook-ads' ? 'active' : ''}`}
                                onClick={() => setActiveTab('facebook-ads')}
                            >
                                Facebook Ads
                            </button> */}
            </div>

            <div className="dashboard-controls">
              <select
                className="filter-dropdown"
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
              >
                <option value="all">{t("dashboard.all")}</option>
                <option value="active">{t("dashboard.active")}</option>
                <option value="inactive">{t("dashboard.inactive")}</option>
              </select>

              <div className="search-box">
                <div className="search-icon-wrapper">
                  <SearchIcon size={18} />
                </div>
                <input
                  type="text"
                  className="search-input-dashboard"
                  placeholder={t("dashboard.search_placeholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <button
                className="btn-refresh-dashboard"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCcw
                  size={16}
                  className={isRefreshing ? "spinning-dashboard" : ""}
                />
                &nbsp;{t("dashboard.refresh_page")}
              </button>

              {/* <button className="btn-contribute" onClick={handleContribute}>
                <Link2 size={16} />
                &nbsp;{t("dashboard.merge_page")}
              </button> */}
            </div>
          </div>

          <div className="dashboard-content-body">
            {/* Page cards grid */}
            <div className="pages-grid">
              {/* Add new page card */}
              <div
                className={`page-card add-page-card ${!canConnectPage ? 'disabled' : ''}`}
                onClick={() => canConnectPage && handleAddNewPage()}
                style={{
                  cursor: canConnectPage ? 'pointer' : 'not-allowed',
                  opacity: canConnectPage ? 1 : 0.5,
                }}
                title={
                  canConnectPage
                    ? t("dashboard.connect_new_page")
                    : pkg
                      ? `Đã đạt giới hạn: ${connectedPages.length}/${limitsPages}`
                      : "Người dùng cần gói dịch vụ để kết nối Page"
                }
              >
                <div className="add-page-content">
                  <div className="add-icon">
                    <Plus size={30} />
                  </div>
                  <div className="add-page-text">
                    {t("dashboard.connect_new_page")} (
                    {pkgLoading
                      ? "..."
                      : pkg
                        ? `${connectedPages.length}/${limitsPages}`
                        : `${connectedPages.length}/?`}
                    )
                  </div>
                </div>
              </div>

              {/* Sửa chỗ này: dùng filteredPages thay vì connectedPages */}
              {filteredPages.map((page) => (
                <div key={page.id} className="page-card connected-page-card">
                  <div className="page-card-header">
                    <div className="page-avatar-dashboard">
                      <img src={page.avatar} alt={page.name} />
                    </div>
                    <div className="page-info-dashboard">
                      <div className="page-name-row">
                        <h3 className="page-name-dashboard">{page.name}</h3>
                        <span
                          className={`page-access-indicator ${page.userHasAccess ? "has-access" : "no-access"}`}
                          title={
                            page.userHasAccess
                              ? "Bạn có quyền quản lý trang này"
                              : "Bạn chưa có quyền quảng cáo trên trang này"
                          }
                        >
                          {page.userHasAccess ? (
                            <CheckCircle size={14} />
                          ) : (
                            <XCircle size={14} />
                          )}
                        </span>
                      </div>

                      <p className="page-id-dashboard">
                        <a
                          href={page.link}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {page.pageId}
                        </a>
                      </p>

                      <div className="page-stats">
                        <div className="page-stats-left">
                          <span className="follower-count">
                            <img
                              src={facebook_icon}
                              alt="Facebook"
                              className="fb_icon"
                            />
                            {/* {page.followerCount} */}
                          </span>
                        </div>
                        <div className="page-stats-right">
                          <span className={`page-status ${page.status === "pause" ? "pause" : "active"}`}>
                            {page.status === "pause" ? t("dashboard.pause") : t("dashboard.active")}
                          </span>
                          <div className="page-menu-container" ref={menuRef}>
                            <button
                              className="page-menu-button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePageMenu(page.id);
                              }}
                            >
                              ⋮
                            </button>
                            {openMenuId === page.id && (
                              <div
                                className="page-dropdown-menu"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {getMenuItems(page.status).map((item) => (
                                  <button
                                    key={item.id}
                                    className="dropdown-menu-item"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMenuItemClick(page.id, item.id);
                                    }}
                                  >
                                    <span className="menu-item-icon">
                                      {item.icon}
                                    </span>
                                    <span className="menu-item-text">
                                      {item.text}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;