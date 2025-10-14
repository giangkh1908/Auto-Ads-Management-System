import { useState, useEffect } from "react";
import { Edit, Archive, Trash } from "lucide-react";
import "./AdsManagement.css";
import CreateAdsWizard from "../../components/feature/CreateAdsWizard/CreateAdsWizard";
import { handleSelectAll, handleSelectItem } from "../../utils/selectionUtils";
import axiosInstance from "../../utils/axios";

function AdsManagement() {
  const [activeTab, setActiveTab] = useState("campaigns");
  const [showWizard, setShowWizard] = useState(false);
  const [wizardMode, setWizardMode] = useState("create"); // "create" | "edit"
  const [editingItem, setEditingItem] = useState(null); // { type: "campaign" | "adset" | "ad", id: number }
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [selectedAdset, setSelectedAdset] = useState(null);

  // Thêm state mới cho tài khoản quảng cáo
  const [adAccounts, setAdAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [initialized, setInitialized] = useState(false);

  //Lấy data từ hàm makeData
  const [datasets, setDatasets] = useState({
    campaigns: [],
    adsets: [],
    ads: []
  });

  //Tạo và gắn false cho checkbox
  const [checkAll, setCheckAll] = useState(false);

  // State để theo dõi có item nào được chọn không
  const [hasSelectedItems, setHasSelectedItems] = useState(false);

  // Set dữ liệu để hiển thị tùy thuộc vào tab và filter theo campaign/adset được chọn
  const getFilteredRows = () => {
    if (activeTab === "campaigns") {
      return datasets.campaigns;
    } else if (activeTab === "adsets") {
      // Nếu đang trong chế độ drill-down (từ breadcrumb), lọc theo campaign
      if (selectedCampaign && datasets.adsets.some(a => a.campaignId === selectedCampaign.id)) {
        return datasets.adsets.filter(adset => adset.campaignId === selectedCampaign.id);
      }
      // Nếu không, hiển thị tất cả adsets
      return datasets.adsets;
    } else if (activeTab === "ads") {
      // Nếu đang trong chế độ drill-down từ adset, lọc theo adset
      if (selectedAdset && datasets.ads.some(a => a.adsetId === selectedAdset.id)) {
        return datasets.ads.filter(ad => ad.adsetId === selectedAdset.id);
      }
      // Nếu đang trong chế độ drill-down từ campaign, lọc theo campaign
      else if (selectedCampaign && datasets.ads.some(a => a.campaignId === selectedCampaign.id)) {
        return datasets.ads.filter(ad => ad.campaignId === selectedCampaign.id);
      }
      // Nếu không, hiển thị tất cả ads
      return datasets.ads;
    }
    return [];
  };

  const rows = getFilteredRows();

  //Function on/off trạng thái
  const toggleRow = (id) => {
    setDatasets((prev) => {
      const key =
        activeTab === "campaigns"
          ? "campaigns"
          : activeTab === "adsets"
            ? "adsets"
            : "ads";
      return {
        ...prev,
        [key]: prev[key].map((r) => {
          if (r.id !== id) return r;
          const nextEnabled = !r.enabled;
          return {
            ...r,
            enabled: nextEnabled,
            status: nextEnabled ? "Hoạt động" : "Đang tắt",
          };
        }),
      };
    });
  };

  // Hàm xử lý chọn tất cả
  const handleCheckAll = (event) => {
    const isChecked = event.target.checked;
    setCheckAll(isChecked);
    setHasSelectedItems(isChecked);
    setDatasets((prev) => {
      const key =
        activeTab === "campaigns"
          ? "campaigns"
          : activeTab === "adsets"
            ? "adsets"
            : "ads";
      const updatedItems = handleSelectAll(isChecked, prev[key]);
      return { ...prev, [key]: updatedItems };
    });
  };

  //Hàm xử lý chọn đơn lẻ
  const handleCheckItem = (id) => {
    setDatasets((prev) => {
      const key =
        activeTab === "campaigns"
          ? "campaigns"
          : activeTab === "adsets"
            ? "adsets"
            : "ads";
      const { updatedItems, allChecked } = handleSelectItem(id, prev[key]);
      setCheckAll(allChecked);

      // Kiểm tra có item nào được chọn không
      const hasSelected = updatedItems.some(item => item.isChecked);
      setHasSelectedItems(hasSelected);

      return { ...prev, [key]: updatedItems };
    });
  };

  // Hàm xử lý cập nhật
  const handleUpdate = (id) => {
    const item = rows.find(row => row.id === id);
    if (item) {
      setEditingItem({ type: activeTab.slice(0, -1), id: id }); // Remove 's' from end
      setWizardMode("edit");
      setShowWizard(true);

      // Set selected items for context
      if (activeTab === "adsets") {
        const campaign = datasets.campaigns.find(c => c.id === item.campaignId);
        setSelectedCampaign(campaign);
      } else if (activeTab === "ads") {
        const adset = datasets.adsets.find(a => a.id === item.adsetId);
        const campaign = datasets.campaigns.find(c => c.id === item.campaignId);
        setSelectedAdset(adset);
        setSelectedCampaign(campaign);
      }
    }
  };

  // Hàm xử lý lưu trữ
  const handleArchive = (id) => {
    console.log(`Lưu trữ ${activeTab} với ID:`, id);
    // TODO: Implement archive logic
  };

  // Hàm xử lý xóa
  const handleDelete = (id) => {
    console.log(`Xóa ${activeTab} với ID:`, id);
    // TODO: Implement delete logic
  };


  // Hàm xử lý click vào campaign để xem adsets
  const handleCampaignClick = (campaign) => {
    setSelectedCampaign(campaign);
    setSelectedAdset(null);
    setActiveTab("adsets");
    // Gọi API để lấy adsets cho campaign này
    fetchAdsetsForCampaign(campaign.id || campaign._id || campaign.external_id, selectedAccountId);
  };

  // Hàm xử lý click vào adset để xem ads
  const handleAdsetClick = (adset) => {
    setSelectedAdset(adset);
    setActiveTab("ads");
    // Gọi API để lấy ads cho adset này
    fetchAdsForAdset(adset.id || adset._id || adset.external_id);
  };

  // Hàm reset selection
  const resetSelection = () => {
    setSelectedCampaign(null);
    setSelectedAdset(null);
    setCheckAll(false);
    setHasSelectedItems(false);
  };

  // Hàm fetch campaigns cho tài khoản đã chọn
  const fetchCampaignsForAccount = async (accountId) => {
    if (!accountId) return;

    try {
      // Đồng bộ dữ liệu từ Facebook trước (tùy chọn)
      await axiosInstance.get(`/api/campaigns/sync?account_id=${accountId}`);

      // Fetch campaigns từ database
      const response = await axiosInstance.get(`/api/campaigns?account_id=${accountId}`);

      if (response.data && response.data.items) {
        // Cập nhật dữ liệu campaigns trong state, đảm bảo mỗi item có id
        setDatasets(prev => ({
          ...prev,
          campaigns: response.data.items.map(campaign => ({
            ...campaign,
            // Đảm bảo luôn có id cho mỗi campaign
            id: campaign._id || campaign.id || campaign.external_id,
            isChecked: false,
            enabled: campaign.status === 'ACTIVE' || campaign.effective_status === 'ACTIVE'
          }))
        }));
      }
    } catch (error) {
      console.error(`Error fetching campaigns for account ${accountId}:`, error);
    }
  };

  // Thêm các hàm fetch adsets và ads từ API

  // Fetch adsets cho một campaign cụ thể
  const fetchAdsetsForCampaign = async (campaignId, accountId) => {
    if (!campaignId || !accountId) return;

    try {
      // Đồng bộ adsets từ Facebook (tùy chọn)
      await axiosInstance.get(`/api/adsets/sync?account_id=${accountId}`);

      // Fetch adsets từ database
      const response = await axiosInstance.get(`/api/adsets?campaign_id=${campaignId}`);

      if (response.data && response.data.items) {
        setDatasets(prev => ({
          ...prev,
          adsets: response.data.items.map(adset => ({
            ...adset,
            id: adset._id || adset.id || adset.external_id,
            campaignId: campaignId,
            isChecked: false,
            enabled: adset.status === 'ACTIVE' || adset.effective_status === 'ACTIVE'
          }))
        }));
      }
    } catch (error) {
      console.error(`Error fetching adsets for campaign ${campaignId}:`, error);
    }
  };

  // Fetch ads cho một adset cụ thể
  const fetchAdsForAdset = async (adsetId) => {
    if (!adsetId) return;

    try {
      // Đồng bộ ads từ Facebook (tùy chọn)
      await axiosInstance.get(`/api/ads/sync?account_id=${selectedAccountId}`);

      // Fetch ads từ database
      const response = await axiosInstance.get(`/api/ads?adset_id=${adsetId}`);

      if (response.data && response.data.items) {
        setDatasets(prev => ({
          ...prev,
          ads: response.data.items.map(ad => ({
            ...ad,
            id: ad._id || ad.id || ad.external_id,
            adsetId: adsetId,
            isChecked: false,
            enabled: ad.status === 'ACTIVE' || ad.effective_status === 'ACTIVE'
          }))
        }));
      }
    } catch (error) {
      console.error(`Error fetching ads for adset ${adsetId}:`, error);
    }
  };

  // Fetch ads cho một campaign cụ thể (khi cần hiển thị tất cả ads của một campaign)
  // const fetchAdsForCampaign = async (campaignId) => {
  //   if (!campaignId) return;

  //   try {
  //     // Fetch ads từ database
  //     const response = await axiosInstance.get(`/api/ads?campaign_id=${campaignId}`);

  //     if (response.data && response.data.items) {
  //       setDatasets(prev => ({
  //         ...prev,
  //         ads: response.data.items.map(ad => ({
  //           ...ad,
  //           id: ad._id || ad.id || ad.external_id,
  //           campaignId: campaignId,
  //           isChecked: false,
  //           enabled: ad.status === 'ACTIVE' || ad.effective_status === 'ACTIVE'
  //         }))
  //       }));
  //     }
  //   } catch (error) {
  //     console.error(`Error fetching ads for campaign ${campaignId}:`, error);
  //   }
  // };

  // Fetch tất cả adsets của một tài khoản
  const fetchAllAdsetsForAccount = async (accountId) => {
    if (!accountId) return;

    try {
      // Đồng bộ dữ liệu từ Facebook (tùy chọn)
      await axiosInstance.get(`/api/adsets/sync?account_id=${accountId}`);

      // Fetch adsets từ database
      const response = await axiosInstance.get(`/api/adsets?account_id=${accountId}`);

      if (response.data && response.data.items) {
        setDatasets(prev => ({
          ...prev,
          adsets: response.data.items.map(adset => ({
            ...adset,
            id: adset._id || adset.id || adset.external_id,
            campaignId: adset.campaign_id,
            isChecked: false,
            enabled: adset.status === 'ACTIVE' || adset.effective_status === 'ACTIVE'
          }))
        }));
      }
    } catch (error) {
      console.error(`Error fetching all adsets for account ${accountId}:`, error);
    }
  };

  // Fetch tất cả ads của một tài khoản
  const fetchAllAdsForAccount = async (accountId) => {
    if (!accountId) return;

    try {
      // Đồng bộ dữ liệu từ Facebook (tùy chọn)
      await axiosInstance.get(`/api/ads/sync?account_id=${accountId}`);

      // Fetch ads từ database
      const response = await axiosInstance.get(`/api/ads?account_id=${accountId}`);

      if (response.data && response.data.items) {
        setDatasets(prev => ({
          ...prev,
          ads: response.data.items.map(ad => ({
            ...ad,
            id: ad._id || ad.id || ad.external_id,
            adsetId: ad.adset_id || ad.set_id,
            campaignId: ad.campaign_id,
            isChecked: false,
            enabled: ad.status === 'ACTIVE' || ad.effective_status === 'ACTIVE'
          }))
        }));
      }
    } catch (error) {
      console.error(`Error fetching all ads for account ${accountId}:`, error);
    }
  };

  // Gọi API khi component mount - chỉ chạy một lần
  useEffect(() => {
    // Định nghĩa fetchAdAccounts bên trong useEffect để tránh spam API
    const fetchAdAccounts = async () => {
      setLoadingAccounts(true);
      try {
        const response = await axiosInstance.get('/api/ads-accounts');
        if (response.data && response.data.items) {
          setAdAccounts(response.data.items);

          // Tự động chọn tài khoản đầu tiên nếu có
          if (response.data.items.length > 0) {
            setSelectedAccountId(response.data.items[0].external_id);
          }
          setInitialized(true); // Đánh dấu đã khởi tạo
        }
      } catch (error) {
        console.error('Error fetching ad accounts:', error);
      } finally {
        setLoadingAccounts(false);
      }
    };

    if (!initialized) {
      fetchAdAccounts();
    }
  }, [initialized]); // Thêm initialized vào dependency array

  // Thêm useEffect mới để fetch dữ liệu khi có selectedAccountId
  useEffect(() => {
    if (selectedAccountId && initialized) {
      fetchCampaignsForAccount(selectedAccountId);
      fetchAllAdsetsForAccount(selectedAccountId);
      fetchAllAdsForAccount(selectedAccountId);
    }
  }, [selectedAccountId, initialized]); // Thêm initialized vào dependency array

  // Xử lý khi thay đổi tài khoản
  const handleAccountChange = (e) => {
    const accountId = e.target.value;
    setSelectedAccountId(accountId);
    localStorage.setItem("selectedAdAccount", accountId);
    resetSelection();

    // Luôn bắt đầu với tab campaigns
    setActiveTab("campaigns");

    // Fetch dữ liệu cho tài khoản mới
    fetchCampaignsForAccount(accountId);

    // Fetch luôn adsets và ads để sẵn sàng khi user chuyển tab
    fetchAllAdsetsForAccount(accountId);
    fetchAllAdsForAccount(accountId);
  };

  return (
    <div className="ads-management-layout">
      <div className="ads-management-content">
        <div className="ads-management-center">
          <div className="ads-card">
            <div className="ads-toolbar">
              <div className="account-select">
                <select
                  value={selectedAccountId}
                  onChange={handleAccountChange}
                  disabled={loadingAccounts}
                >
                  {loadingAccounts ? (
                    <option>Đang tải tài khoản...</option>
                  ) : adAccounts.length === 0 ? (
                    <option value="">Không có tài khoản nào</option>
                  ) : (
                    adAccounts.map(account => (
                      <option key={account._id} value={account.external_id}>
                        {account.name || 'Tài khoản'} ({account.external_id})
                      </option>
                    ))
                  )}
                </select>
                {/* Show Wizard tạo chiến dịch */}
                <button
                  className="btn-create"
                  onClick={() => {
                    setWizardMode("create");
                    setEditingItem(null);
                    resetSelection();
                    setShowWizard(true);
                  }}
                >
                  + Tạo chiến dịch
                </button>
              </div>

              {/* Tạo trường dữ liệu thời gian để tìm kiếm chiến dịch và nhóm quảng cáo */}
              <div className="filters">
                <span> Từ </span>
                <input type="date" />
                <span> đến </span>
                <input type="date" />
                <button className="btn-filter">Tìm</button>
              </div>
            </div>

            {/* Breadcrumb Navigation */}
            {(selectedCampaign || selectedAdset) && (
              <div className="breadcrumb-nav">
                <button
                  className="breadcrumb-item"
                  onClick={() => {
                    resetSelection();
                    setActiveTab("campaigns");
                  }}
                >
                  Tất cả chiến dịch
                </button>
                {selectedCampaign && (
                  <>
                    <span className="breadcrumb-separator">›</span>
                    <button
                      className="breadcrumb-item"
                      onClick={() => {
                        setSelectedAdset(null);
                        setActiveTab("adsets");
                      }}
                    >
                      {selectedCampaign.name}
                    </button>
                  </>
                )}
                {selectedAdset && (
                  <>
                    <span className="breadcrumb-separator">›</span>
                    <button
                      className="breadcrumb-item active"
                      onClick={() => setActiveTab("ads")}
                    >
                      {selectedAdset.name}
                    </button>
                  </>
                )}
              </div>
            )}

            <div className="ads-tabs">
              <button
                className={`tab ${activeTab === "campaigns" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("campaigns");
                  resetSelection();
                  // Không cần fetch vì đã có dữ liệu campaigns
                }}
              >
                <span className="tab-icon">▦</span>
                Chiến dịch
              </button>
              <button
                className={`tab ${activeTab === "adsets" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("adsets");

                  // Fetch tất cả adsets của tài khoản, không phụ thuộc campaign
                  if (selectedAccountId) {
                    fetchAllAdsetsForAccount(selectedAccountId);
                  }

                  // Vẫn giữ selection để breadcrumb hoạt động
                  // nhưng không filter dữ liệu hiển thị theo selection
                }}
              >
                <span className="tab-icon">▣</span>
                Nhóm quảng cáo
              </button>
              <button
                className={`tab ${activeTab === "ads" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("ads");

                  // Fetch tất cả ads của tài khoản, không phụ thuộc campaign/adset
                  if (selectedAccountId) {
                    fetchAllAdsForAccount(selectedAccountId);
                  }

                  // Vẫn giữ selection để breadcrumb hoạt động
                  // nhưng không filter dữ liệu hiển thị theo selection
                }}
              >
                <span className="tab-icon">▥</span>
                Quảng cáo
              </button>
              {hasSelectedItems && (
                <div className="icon-beside-tab">
                  <button
                    className="ads-action-btn ads-archive-btn"
                    onClick={() => handleArchive()}
                    title="Lưu trữ"
                  >
                    <Archive size={15} />
                  </button>
                  <button
                    className="ads-action-btn ads-delete-btn"
                    onClick={() => handleDelete()}
                    title="Xóa"
                  >
                    <Trash size={15} />
                  </button>
                </div>
              )}
            </div>

            {/* Content chính */}
            <div className="ads-table-wrapper">
              <table className="ads-table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={checkAll}
                        onChange={handleCheckAll}
                      />
                    </th>
                    <th>Tắt/Bật</th>
                    <th>Chiến dịch</th>
                    <th>Trạng thái</th>
                    <th>Ngân sách</th>
                    <th>Số tiền đã tiêu</th>
                    <th>Số lần hiển thị</th>
                    <th>Lượt tiếp cận</th>
                    <th>Kết quả</th>
                    <th>Chất lượng</th>
                    <th>Cập nhật lần cuối</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={row.isChecked}
                          onChange={() => handleCheckItem(row.id)}
                        />
                      </td>
                      <td className="cell-name">
                        <button
                          type="button"
                          className={`switch ${row.enabled ? "on" : "off"}`}
                          aria-pressed={row.enabled}
                          onClick={() => toggleRow(row.id)}
                        />
                      </td>
                      <td>
                        <div className="name-cell">
                          <span
                            className="name-text clickable"
                            onClick={() => {
                              if (activeTab === "campaigns") {
                                handleCampaignClick(row);
                              } else if (activeTab === "adsets") {
                                handleAdsetClick(row);
                              }
                            }}
                          >
                            {row.name}
                          </span>
                        </div>
                      </td>
                      <td
                        className={
                          row.status === "Hoạt động"
                            ? "status-active"
                            : "status-inactive"
                        }
                      >
                        {row.status}
                      </td>
                      <td className="text-center">{row.budget}</td>
                      <td className="text-right">{row.impressions}</td>
                      <td className="text-right">{row.reach}</td>
                      <td className="text-right">{row.reach}</td>
                      <td className="text-right">{row.reach}</td>
                      <td className="text-right">{row.reach}</td>
                      <td className="text-right">{row.time}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="ads-action-btn ads-update-btn"
                            onClick={() => handleUpdate(row.id)}
                            title="Cập nhật"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            className="ads-action-btn ads-archive-btn"
                            onClick={() => handleArchive(row.id)}
                            title="Lưu trữ"
                          >
                            <Archive size={14} />
                          </button>
                          <button
                            className="ads-action-btn ads-delete-btn"
                            onClick={() => handleDelete(row.id)}
                            title="Xóa"
                          >
                            <Trash size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      {/* Đóng Wizard tạo chiến dịch */}
      {showWizard && (
        <CreateAdsWizard
          onClose={() => {
            setShowWizard(false);
            setEditingItem(null);
            setWizardMode("create");
          }}
          mode={wizardMode}
          editingItem={editingItem}
          selectedCampaign={selectedCampaign}
          selectedAdset={selectedAdset}
          datasets={datasets}
          setDatasets={setDatasets}
          selectedAccountId={selectedAccountId}
        />
      )}
    </div>
  );
}

export default AdsManagement;