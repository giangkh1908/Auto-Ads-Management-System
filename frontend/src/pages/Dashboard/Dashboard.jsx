import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import facebook_icon from "../../assets/facebook.png";
import { ROUTES, STORAGE_KEYS } from "../../constants/app.constants";
import profileService from "../../services/profileService";
import shopService from "../../services/shopService";
import { toast } from "sonner";

function Dashboard() {
  const [filterValue, setFilterValue] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("my-bots");
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const [connectedPages, setConnectedPages] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const me = await profileService.getCurrentProfile();
        const shop = me?.data?.shop || me?.shop;
        const pages = Array.isArray(shop?.facebook_pages)
          ? shop.facebook_pages
          : [];
        const normalized = pages
          .filter((p) => p.connected_status === "connected")
          .map((p) => ({
            id: p.page_id,
            name: p.page_info?.name || "Facebook Page",
            pageId: p.page_id,
            link: `https://www.facebook.com/${p.id}`,
            avatar:
              p.page_info?.picture_url ||
              `https://graph.facebook.com/${p.page_id}/picture?type=square`,
            status: "active",
            followerCount: 0,
          }));
        setConnectedPages(normalized);
      } catch (e) {
        console.error("Load dashboard shop info error:", e);
      }
    };
    load();
  }, []);

  const handleRefresh = () => {
    console.log("Refreshing...");
  };

  const handleContribute = () => {
    console.log("Contributing page...");
  };

  const handleAddNewPage = () => {
    navigate(ROUTES.CONNECT);
  };

  // Menu items data
  const menuItems = [
    { id: "rename", icon: "✏️", text: "Đổi tên page" },
    { id: "pause", icon: "⏸️", text: "Tạm dừng" },
    { id: "disconnect", icon: "🔌", text: "Ngắt kết nối" },
    { id: "refresh", icon: "🔄", text: "Làm mới kết nối" },
    { id: "switch", icon: "↔️", text: "Chuyển shop" },
    { id: "notifications", icon: "🔔", text: "Thông báo" },
    { id: "customers", icon: "👥", text: "Khách hàng" },
    { id: "livechat", icon: "💬", text: "Livechat" },
    { id: "chatbot", icon: "🤖", text: "Chatbot" },
    { id: "campaigns", icon: "▶️", text: "Chiến dịch" },
    { id: "sequence", icon: "📅", text: "Sequence" },
    { id: "keywords", icon: "🔑", text: "Từ khóa" },
    { id: "settings", icon: "⚙️", text: "Cài đặt page" },
  ];

  const handlePageMenu = (pageId) => {
    setOpenMenuId(openMenuId === pageId ? null : pageId);
  };

  const handleMenuItemClick = async (pageId, itemId) => {
    setOpenMenuId(null);
    if (itemId === "disconnect") {
      try {
        const me = await profileService.getCurrentProfile();
        const shop = me?.data?.shop || me?.shop;
        if (!shop?._id) return;
        const res = await shopService.disconnectFacebookPage({
          shopId: shop._id,
          pageId,
        });
        // ✅ Kiểm tra phản hồi
        if (res?.success) {
          setConnectedPages((prev) => prev.filter((p) => p.id !== pageId));
          toast.success(res.message || "Đã ngắt kết nối page.");
        } else {
          toast.warning(res.message || "Không thể ngắt kết nối page.");
        }
      } catch (e) {
        console.log("Disconnect page error:", e);
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

  return (
    <div className="dashboard-layout">
      <div className="dashboard-content">
        <div className="dashboard-center">
          {/* Header with tabs */}
          <div className="dashboard-header">
            <div className="dashboard-tabs">
              <button
                className={`tab-button-dashboard ${
                  activeTab === "my-bots" ? "active" : ""
                }`}
                onClick={() => setActiveTab("my-bots")}
              >
                Page của tôi
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
                <option value="all">Tất cả</option>
                <option value="active">Hoạt động</option>
                <option value="inactive">Không hoạt động</option>
              </select>

              <div className="search-box">
                <input
                  type="text"
                  className="search-input-dashboard"
                  placeholder="Tìm kiếm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button className="search-button">🔎</button>
              </div>

              <button className="btn-refresh" onClick={handleRefresh}>
                ⟳ Refresh
              </button>

              <button className="btn-contribute" onClick={handleContribute}>
                🔗 Gộp Page
              </button>
            </div>
          </div>

          <div className="dashboard-content-body">
            {/* Page cards grid */}
            <div className="pages-grid">
              {/* Add new page card */}
              <div
                className="page-card add-page-card"
                onClick={handleAddNewPage}
              >
                <div className="add-page-content">
                  <div className="add-icon">➕</div>
                  <div className="add-page-text">
                    Kết nối page mới ({connectedPages.length}/10)
                  </div>
                </div>
              </div>

              {/* Connected pages */}
              {connectedPages.map((page) => (
                <div key={page.id} className="page-card connected-page-card">
                  <div className="page-card-header">
                    <div className="page-avatar-dashboard">
                      <img src={page.avatar} alt={page.name} />
                    </div>
                    <div className="page-info-dashboard">
                      <h3 className="page-name-dashboard">{page.name}</h3>
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
                            {page.followerCount}
                          </span>
                        </div>
                        <div className="page-stats-right">
                          <span className="page-status active">Hoạt động</span>
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
                                {menuItems.map((item) => (
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
