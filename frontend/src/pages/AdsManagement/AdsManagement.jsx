import { useState, useEffect } from "react";
import { Edit, Archive, Trash, RefreshCw } from "lucide-react";
import "./AdsManagement.css";
import CreateAdsWizard from "../../components/feature/CreateAdsWizard/CreateAdsWizard";
import ConfirmationPopup from "../../components/common/ConfirmationPopup/ConfirmationPopup";
import { handleSelectAll, handleSelectItem } from "../../utils/selectionUtils";
import {
  deleteCampaign,
  deleteAdSet,
  deleteAd,
} from "../../services/adService";
import { toggleEntityStatus } from '../../services/toggleStatusService';
import axiosInstance from "../../utils/axios";
import { useToast } from "../../hooks/useToast";
import { translateStatus, getStatusClass } from '../../utils/statusUtils';

function AdsManagement() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("campaigns");
  const [showWizard, setShowWizard] = useState(false);
  const [wizardMode, setWizardMode] = useState("create");
  const [editingItem, setEditingItem] = useState(null);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [selectedAdset, setSelectedAdset] = useState(null);

  // Account
  const [adAccounts, setAdAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Data
  const [datasets, setDatasets] = useState({
    campaigns: [],
    adsets: [],
    ads: [],
  });

  const [checkAll, setCheckAll] = useState(false);
  const [hasSelectedItems, setHasSelectedItems] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [togglingItems, setTogglingItems] = useState(new Set()); // Track items being toggled
  
  // Confirmation popup state
  const [confirmationPopup, setConfirmationPopup] = useState({
    isOpen: false,
    type: 'delete', // 'delete' | 'archive'
    title: '',
    message: '',
    onConfirm: null,
    isLoading: false
  });

  // 🔹 Filter data for active tab
  const getFilteredRows = () => {
    if (activeTab === "campaigns") {
      // Filter out campaigns with DELETE status
      return datasets.campaigns.filter(
        (campaign) => 
          campaign.status !== "DELETED" && 
          campaign.effective_status !== "DELETED"
      );
    }
    if (activeTab === "adsets") {
      // Filter out adsets with DELETE status
      let filteredAdsets = datasets.adsets.filter(
        (adset) => 
          adset.status !== "DELETED" && 
          adset.effective_status !== "DELETED"
      );
      
      if (selectedCampaign) {
        filteredAdsets = filteredAdsets.filter(
          (a) => a.campaignId === selectedCampaign.id
        );
      }
      return filteredAdsets;
    }
    if (activeTab === "ads") {
      // Filter out ads with DELETE status
      let filteredAds = datasets.ads.filter(
        (ad) => 
          ad.status !== "DELETED" && 
          ad.effective_status !== "DELETED"
      );
      
      if (selectedAdset) {
        filteredAds = filteredAds.filter((a) => a.adsetId === selectedAdset.id);
      } else if (selectedCampaign) {
        filteredAds = filteredAds.filter((a) => a.campaignId === selectedCampaign.id);
      }
      return filteredAds;
    }
    return [];
  };
  const rows = getFilteredRows();

  // 🔹 Toggle ON/OFF với đồng bộ Facebook API
  const toggleRow = async (id) => {
    const key =
      activeTab === "campaigns"
        ? "campaigns"
        : activeTab === "adsets"
          ? "adsets"
          : "ads";
    
    const entityType = activeTab.slice(0, -1); // "campaigns" -> "campaign", "adsets" -> "adset", "ads" -> "ad"
    const row = datasets[key].find(r => r.id === id);
    
    if (!row) {
      toast.error("Không tìm thấy item để toggle");
      return;
    }

    // Kiểm tra có external_id không (cần để gọi Facebook API)
    if (!row.external_id) {
      toast.warning("Không thể đồng bộ với Facebook", {
        description: "Item chưa có external_id từ Facebook"
      });
      return;
    }

    const newStatus = !row.enabled;
    const facebookStatus = newStatus ? "ACTIVE" : "PAUSED";
    const displayStatus = newStatus ? "Hoạt động" : "Tạm dừng";

    // Thêm vào loading state
    setTogglingItems(prev => new Set(prev).add(id));

    // Optimistic update - cập nhật UI trước
    setDatasets((prev) => ({
      ...prev,
      [key]: prev[key].map((r) =>
        r.id !== id
          ? r
          : {
            ...r,
            enabled: newStatus,
            status: displayStatus,
          }
      ),
    }));

    try {
      // Gọi API để đồng bộ với Facebook
      toast.info(`Đang ${newStatus ? 'bật' : 'tắt'} ${entityType} trên Facebook...`);
      
      await toggleEntityStatus(entityType, row.external_id, facebookStatus);
      
      toast.success(`${entityType.charAt(0).toUpperCase() + entityType.slice(1)} đã được ${newStatus ? 'bật' : 'tắt'} thành công!`, {
        description: `Trạng thái đã được đồng bộ với Facebook`
      });
      
    } catch (error) {
      // Revert UI nếu API call thất bại
      setDatasets((prev) => ({
        ...prev,
        [key]: prev[key].map((r) =>
          r.id !== id
            ? r
            : {
              ...r,
              enabled: !newStatus,
              status: !newStatus ? "Hoạt động" : "Tạm dừng",
            }
        ),
      }));
      
      toast.error(`Lỗi ${newStatus ? 'bật' : 'tắt'} ${entityType}`, {
        description: error.message
      });
    } finally {
      // Xóa khỏi loading state
      setTogglingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  // 🔹 Check All
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

  // 🔹 Check Single
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
      setHasSelectedItems(updatedItems.some((item) => item.isChecked));
      return { ...prev, [key]: updatedItems };
    });
  };

  // 🔹 Edit item
  const handleUpdate = (id) => {
    // 1️⃣ Lấy item được click
    const item = rows.find((row) => row.id === id);
    if (!item) return;

    // 2️⃣ Xác định loại (campaign / adset / ad)
    const type =
      activeTab === "campaigns"
        ? "campaign"
        : activeTab === "adsets"
          ? "adset"
          : "ad";

    // 3️⃣ Lấy campaign / adset tương ứng (để truyền vào Wizard)
    let campaign = null;
    let adset = null;

    if (type === "campaign") {
      campaign = item;
    } else if (type === "adset") {
      adset = item;
      campaign = datasets.campaigns.find((c) => c.id === item.campaignId) || null;
    } else if (type === "ad") {
      adset = datasets.adsets.find((a) => a.id === item.adsetId) || null;
      campaign =
        datasets.campaigns.find((c) => c.id === item.campaignId) || null;
    }

    // 4️⃣ Lưu state để mở Wizard
    setEditingItem({
      type,
      data: { ...item, external_id: item.external_id },
    });
    setWizardMode("edit");
    setShowWizard(true);

    // 5️⃣ Cập nhật selection để Wizard hiểu context
    if (campaign) setSelectedCampaign(campaign);
    if (adset) setSelectedAdset(adset);
  };


  // 🔹 Archive (placeholder)
  const handleArchive = (id) => {
    const key =
      activeTab === "campaigns"
        ? "campaigns"
        : activeTab === "adsets"
          ? "adsets"
          : "ads";

    const idsToArchive = id
      ? [id]
      : datasets[key].filter((item) => item.isChecked).map((item) => item.id);

    if (idsToArchive.length === 0) {
      toast.warning("Vui lòng chọn ít nhất một mục để lưu trữ.");
      return;
    }

    const entityName = key === "campaigns"
      ? "chiến dịch"
      : key === "adsets"
        ? "nhóm quảng cáo"
        : "quảng cáo";

    setConfirmationPopup({
      isOpen: true,
      type: 'archive',
      title: `Lưu trữ ${idsToArchive.length} ${entityName}`,
      message: `Bạn có chắc muốn lưu trữ ${idsToArchive.length} ${entityName}? Hành động này có thể được hoàn tác.`,
      onConfirm: () => executeArchive(idsToArchive),
      isLoading: false
    });
  };

  const executeArchive = async (idsToArchive) => {
    setConfirmationPopup(prev => ({ ...prev, isLoading: true }));
    
    try {
      // TODO: Implement archive API calls
      console.log(`Lưu trữ ${idsToArchive.length} items:`, idsToArchive);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success(`Đã lưu trữ ${idsToArchive.length} ${activeTab} thành công!`);
      
      // Refresh data
      handleRefresh();
      
    } catch (error) {
      console.error("❌ Lỗi khi lưu trữ:", error);
      toast.error("Lưu trữ thất bại, vui lòng thử lại!");
    } finally {
      setConfirmationPopup(prev => ({ ...prev, isLoading: false, isOpen: false }));
    }
  };

  // 🔹 Delete (main)
  const handleDelete = (id) => {
    const key =
      activeTab === "campaigns"
        ? "campaigns"
        : activeTab === "adsets"
          ? "adsets"
          : "ads";

    const idsToDelete = id
      ? [id]
      : datasets[key].filter((item) => item.isChecked).map((item) => item.id);

    if (idsToDelete.length === 0) {
      toast.warning("Vui lòng chọn ít nhất một mục để xóa.");
      return;
    }

    const entityName = key === "campaigns"
      ? "chiến dịch"
      : key === "adsets"
        ? "nhóm quảng cáo"
        : "quảng cáo";

    setConfirmationPopup({
      isOpen: true,
      type: 'delete',
      title: `Xóa ${idsToDelete.length} ${entityName}`,
      message: `Bạn có chắc muốn xóa ${idsToDelete.length} ${entityName}? Hành động này không thể hoàn tác.`,
      onConfirm: () => executeDelete(idsToDelete),
      isLoading: false
    });
  };

  const executeDelete = async (idsToDelete) => {
    setConfirmationPopup(prev => ({ ...prev, isLoading: true }));
    
    try {
      const key =
        activeTab === "campaigns"
          ? "campaigns"
          : activeTab === "adsets"
            ? "adsets"
            : "ads";

      // 🧩 Lấy token FB từ localStorage
      const fbToken = localStorage.getItem("fb_access_token") || null;

      // 🔹 Gọi đúng service cho từng loại
      for (const delId of idsToDelete) {
        if (key === "campaigns") await deleteCampaign(delId, fbToken);
        else if (key === "adsets") await deleteAdSet(delId, fbToken);
        else await deleteAd(delId, fbToken);
      }

      // 🔹 Cập nhật UI
      setDatasets((prev) => ({
        ...prev,
        [key]: prev[key].filter((item) => !idsToDelete.includes(item.id)),
      }));
      setCheckAll(false);
      setHasSelectedItems(false);

      const entityName = key === "campaigns"
        ? "chiến dịch"
        : key === "adsets"
          ? "nhóm quảng cáo"
          : "quảng cáo";

      toast.success(`Đã xóa ${idsToDelete.length} ${entityName} thành công!`);
      
      // Refresh data after successful deletion
      handleRefresh();
      
    } catch (error) {
      console.error("❌ Lỗi khi xóa:", error);
      toast.error(error?.response?.data?.message || "Xóa thất bại, vui lòng thử lại!");
    } finally {
      setConfirmationPopup(prev => ({ ...prev, isLoading: false, isOpen: false }));
    }
  };

  // 🔹 Navigation
  const handleCampaignClick = (campaign) => {
    setSelectedCampaign(campaign);
    setSelectedAdset(null);
    setActiveTab("adsets");
    fetchAdsetsForCampaign(
      campaign.id || campaign._id || campaign.external_id,
      selectedAccountId
    );
  };

  const handleAdsetClick = (adset) => {
    setSelectedAdset(adset);
    setActiveTab("ads");
    fetchAdsForAdset(adset.id || adset._id || adset.external_id);
  };

  // 🔹 Reset selections
  const resetSelection = () => {
    setSelectedCampaign(null);
    setSelectedAdset(null);
    setCheckAll(false);
    setHasSelectedItems(false);
  };

  // 🔹 Fetch campaigns
  const fetchCampaignsForAccount = async (accountId) => {
    if (!accountId) return;
    try {
      await axiosInstance.get(`/api/campaigns/sync?account_id=${accountId}`);
      const response = await axiosInstance.get(
        `/api/campaigns?account_id=${accountId}`
      );
      if (response.data?.items) {
        setDatasets((prev) => ({
          ...prev,
          campaigns: response.data.items
            .filter((campaign) => 
              campaign.status !== "DELETED" && 
              campaign.effective_status !== "DELETED"
            )
            .map((campaign) => ({
              ...campaign,
              id: campaign._id || campaign.id || campaign.external_id,
              external_id: campaign.external_id,
              isChecked: false,
              enabled:
                campaign.status === "ACTIVE" ||
                campaign.effective_status === "ACTIVE",
            })),
        }));
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    }
  };

  // 🔹 Fetch AdSets for campaign
  const fetchAdsetsForCampaign = async (campaignId, accountId) => {
    if (!campaignId || !accountId) return;
    try {
      await axiosInstance.get(`/api/adsets/sync?account_id=${accountId}`);
      const response = await axiosInstance.get(
        `/api/adsets?campaign_id=${campaignId}`
      );
      if (response.data?.items) {
        setDatasets((prev) => ({
          ...prev,
          adsets: response.data.items
            .filter((adset) => 
              adset.status !== "DELETED" && 
              adset.effective_status !== "DELETED"
            )
            .map((adset) => ({
              ...adset,
              id: adset._id || adset.id || adset.external_id,
              external_id: adset.external_id,
              campaignId,
              isChecked: false,
              enabled:
                adset.status === "ACTIVE" ||
                adset.effective_status === "ACTIVE",
            })),
        }));
      }
    } catch (error) {
      console.error("Error fetching adsets:", error);
    }
  };

  // 🔹 Fetch Ads for AdSet
  const fetchAdsForAdset = async (adsetId) => {
    if (!adsetId) return;
    try {
      await axiosInstance.get(`/api/ads/sync?account_id=${selectedAccountId}`);
      const response = await axiosInstance.get(`/api/ads?adset_id=${adsetId}`);
      if (response.data?.items) {
        setDatasets((prev) => ({
          ...prev,
          ads: response.data.items
            .filter((ad) => 
              ad.status !== "DELETED" && 
              ad.effective_status !== "DELETED"
            )
            .map((ad) => ({
              ...ad,
              id: ad._id || ad.id || ad.external_id,
              adsetId,
              isChecked: false,
              enabled:
                ad.status === "ACTIVE" ||
                ad.effective_status === "ACTIVE",
            })),
        }));
      }
    } catch (error) {
      console.error("Error fetching ads:", error);
    }
  };

  // 🔹 Fetch all AdSets & Ads by account
  const fetchAllAdsetsForAccount = async (accountId) => {
    if (!accountId) return;
    try {
      await axiosInstance.get(`/api/adsets/sync?account_id=${accountId}`);
      const response = await axiosInstance.get(
        `/api/adsets?account_id=${accountId}`
      );
      if (response.data?.items) {
        setDatasets((prev) => ({
          ...prev,
          adsets: response.data.items
            .filter((adset) => 
              adset.status !== "DELETED" && 
              adset.effective_status !== "DELETED"
            )
            .map((adset) => ({
              ...adset,
              id: adset._id || adset.id || adset.external_id,
              external_id: adset.external_id,
              campaignId: adset.campaign_id,
              isChecked: false,
              enabled:
                adset.status === "ACTIVE" ||
                adset.effective_status === "ACTIVE",
            })),
        }));
      }
    } catch (error) {
      console.error("Error fetching adsets:", error);
    }
  };

  const fetchAllAdsForAccount = async (accountId) => {
    if (!accountId) return;
    try {
      await axiosInstance.get(`/api/ads/sync?account_id=${accountId}`);
      const response = await axiosInstance.get(
        `/api/ads?account_id=${accountId}`
      );
      if (response.data?.items) {
        setDatasets((prev) => ({
          ...prev,
          ads: response.data.items
            .filter((ad) => 
              ad.status !== "DELETED" && 
              ad.effective_status !== "DELETED"
            )
            .map((ad) => ({
              ...ad,
              id: ad._id || ad.id || ad.external_id,
              external_id: ad.external_id,
              adsetId: ad.adset_id || ad.set_id,
              campaignId: ad.campaign_id,
              isChecked: false,
              enabled:
                ad.status === "ACTIVE" ||
                ad.effective_status === "ACTIVE",
            })),
        }));
      }
    } catch (error) {
      console.error("Error fetching ads:", error);
    }
  };

  // 🔹 Fetch Ad Accounts
  useEffect(() => {
    const fetchAdAccounts = async () => {
      setLoadingAccounts(true);
      try {
        const response = await axiosInstance.get("/api/ads-accounts");
        if (response.data?.items) {
          setAdAccounts(response.data.items);
          if (response.data.items.length > 0) {
            setSelectedAccountId(response.data.items[0].external_id);
          }
          setInitialized(true);
        }
      } catch (error) {
        console.error("Error fetching ad accounts:", error);
      } finally {
        setLoadingAccounts(false);
      }
    };
    if (!initialized) fetchAdAccounts();
  }, [initialized]);

  // 🔹 Load campaigns/adsets/ads when account selected
  useEffect(() => {
    if (selectedAccountId && initialized) {
      fetchCampaignsForAccount(selectedAccountId);
      fetchAllAdsetsForAccount(selectedAccountId);
      fetchAllAdsForAccount(selectedAccountId);
    }
  }, [selectedAccountId, initialized]);

  // 🔹 Handle account change
  const handleAccountChange = (e) => {
    const accountId = e.target.value;
    setSelectedAccountId(accountId);
    localStorage.setItem("selectedAdAccount", accountId);
    resetSelection();
      setActiveTab("campaigns");
    fetchCampaignsForAccount(accountId);
    fetchAllAdsetsForAccount(accountId);
    fetchAllAdsForAccount(accountId);
  };

  // 🔹 Handle refresh data
  const handleRefresh = async () => {
    if (!selectedAccountId) {
      toast.warning("Vui lòng chọn tài khoản quảng cáo", {
        description: "Chọn tài khoản quảng cáo trước khi làm mới dữ liệu"
      });
      return;
    }
    
    setRefreshing(true);
    toast.info("Đang làm mới dữ liệu...", {
      description: "Vui lòng chờ trong giây lát"
    });
    
    try {
      // Refresh all data based on current tab
      if (activeTab === "campaigns") {
        await fetchCampaignsForAccount(selectedAccountId);
      } else if (activeTab === "adsets") {
        await fetchAllAdsetsForAccount(selectedAccountId);
      } else if (activeTab === "ads") {
        await fetchAllAdsForAccount(selectedAccountId);
      }
      
      // Also refresh all data to ensure consistency
      await Promise.all([
        fetchCampaignsForAccount(selectedAccountId),
        fetchAllAdsetsForAccount(selectedAccountId),
        fetchAllAdsForAccount(selectedAccountId)
      ]);
      
      console.log("✅ Data refreshed successfully");
      toast.success("Làm mới dữ liệu thành công!", {
        description: "Dữ liệu quảng cáo đã được cập nhật"
      });
    } catch (error) {
      console.error("❌ Error refreshing data:", error);
      toast.error("Lỗi khi làm mới dữ liệu", {
        description: "Vui lòng thử lại hoặc kiểm tra kết nối mạng"
      });
    } finally {
      setRefreshing(false);
    }
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
                    adAccounts.map((account) => (
                      <option
                        key={account._id}
                        value={account.external_id}
                      >
                        {account.name || "Tài khoản"} ({account.external_id})
                      </option>
                    ))
                  )}
                </select>

                <button
                  className="btn-create-ads"
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

              <div className="filters">
                <span>Từ</span>
                <input type="date" />
                <span>đến</span>
                <input type="date" />
                <button className="btn-filter">Tìm</button>
              </div>
            </div>

            {/* Breadcrumb */}
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

            {/* Tabs */}
            <div className="ads-tabs">
              <button
                className={`tab ${activeTab === "campaigns" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("campaigns");
                  resetSelection();
                }}
              >
                <span className="tab-icon">▦</span> Chiến dịch
              </button>
              <button
                className={`tab ${activeTab === "adsets" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("adsets");
                  if (selectedAccountId)
                    fetchAllAdsetsForAccount(selectedAccountId);
                }}
              >
                <span className="tab-icon">▣</span> Nhóm quảng cáo
              </button>
              <button
                className={`tab ${activeTab === "ads" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("ads");
                  if (selectedAccountId)
                    fetchAllAdsForAccount(selectedAccountId);
                }}
              >
                <span className="tab-icon">▥</span> Quảng cáo
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
                <button
                  className="btn-refresh-ads"
                  onClick={handleRefresh}
                  disabled={refreshing || !selectedAccountId}
                  title="Làm mới dữ liệu"
                >
                  <RefreshCw size={16} className={refreshing ? "spinning" : ""} />
                  {refreshing ? "Đang tải..." : "Làm mới"}
                </button>
            </div>

            {/* Table */}
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
                    <th>Tên</th>
                    <th>Trạng thái</th>
                    <th>Ngân sách</th>
                    <th>Hiển thị</th>
                    <th>Tiếp cận</th>
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
                          <td>
                            <button
                          type="button"
                              className={`switch ${row.enabled ? "on" : "off"} ${togglingItems.has(row.id) ? 'loading' : ''}`}
                          aria-pressed={row.enabled}
                          onClick={() => toggleRow(row.id)}
                          disabled={togglingItems.has(row.id)}
                            />
                          </td>
                          <td>
                              <span 
                          className="name-text clickable"
                                onClick={() => {
                            if (activeTab === "campaigns")
                                    handleCampaignClick(row);
                            else if (activeTab === "adsets")
                                    handleAdsetClick(row);
                                }}
                              >
                                {row.name}
                              </span>
                          </td>
                          <td className={getStatusClass(row.status)}>
                        {translateStatus(row.status)}
                          </td>
                      <td className="text-center">{row.budget || "0"}</td>
                      <td className="text-center">{row.impressions || "0"}</td>
                      <td className="text-center">{row.reach || "0"}</td>
                      <td className="text-center">{row.results || "0"}</td>
                      <td className="text-center">{row.quality || "0"}</td>
                      <td className="text-center">{row.updated_at || "0"}</td>
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

      {showWizard && (
        <CreateAdsWizard
          onClose={() => {
            setShowWizard(false);
            setEditingItem(null);
            setWizardMode("create");
          }}
          onSuccess={() => {
            // Refresh data after successful create/update
            handleRefresh();
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

      <ConfirmationPopup
        isOpen={confirmationPopup.isOpen}
        onClose={() => setConfirmationPopup(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmationPopup.onConfirm}
        title={confirmationPopup.title}
        message={confirmationPopup.message}
        type={confirmationPopup.type}
        isLoading={confirmationPopup.isLoading}
      />
    </div>
  );
}

export default AdsManagement;
