import { useState, useEffect } from "react";
import { Edit, Archive, Trash } from "lucide-react";
import "./AdsManagement.css";
import CreateAdsWizard from "../../components/feature/CreateAdsWizard/CreateAdsWizard";
import { handleSelectAll, handleSelectItem } from "../../utils/selectionUtils";
import {
  deleteCampaign,
  deleteAdSet,
  deleteAd,
} from "../../services/adService";
import axiosInstance from "../../utils/axios";

function AdsManagement() {
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

  // 🔹 Filter data for active tab
  const getFilteredRows = () => {
    if (activeTab === "campaigns") return datasets.campaigns;
    if (activeTab === "adsets") {
      if (selectedCampaign)
        return datasets.adsets.filter(
          (a) => a.campaignId === selectedCampaign.id
        );
      return datasets.adsets;
    }
    if (activeTab === "ads") {
      if (selectedAdset)
        return datasets.ads.filter((a) => a.adsetId === selectedAdset.id);
      if (selectedCampaign)
        return datasets.ads.filter((a) => a.campaignId === selectedCampaign.id);
      return datasets.ads;
    }
    return [];
  };
  const rows = getFilteredRows();

  // 🔹 Toggle ON/OFF
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
        [key]: prev[key].map((r) =>
          r.id !== id
            ? r
            : {
                ...r,
                enabled: !r.enabled,
                status: !r.enabled ? "Hoạt động" : "Đang tắt",
              }
        ),
      };
    });
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
    const item = rows.find((row) => row.id === id);
    if (!item) return;

    setEditingItem({ type: activeTab.slice(0, -1), id });
    setWizardMode("edit");
    setShowWizard(true);

    if (activeTab === "adsets") {
      const campaign = datasets.campaigns.find(
        (c) => c.id === item.campaignId
      );
      setSelectedCampaign(campaign);
    } else if (activeTab === "ads") {
      const adset = datasets.adsets.find((a) => a.id === item.adsetId);
      const campaign = datasets.campaigns.find(
        (c) => c.id === item.campaignId
      );
      setSelectedAdset(adset);
      setSelectedCampaign(campaign);
    }
  };

  // 🔹 Archive (placeholder)
  const handleArchive = (id) => {
    console.log(`Lưu trữ ${activeTab} ID:`, id);
  };

  // 🔹 Delete (main)
  const handleDelete = async (id) => {
    try {
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
        alert("Vui lòng chọn ít nhất một mục để xóa.");
        return;
      }

      if (
        !window.confirm(
          `Bạn có chắc muốn xóa ${idsToDelete.length} ${
            key === "campaigns"
              ? "chiến dịch"
              : key === "adsets"
              ? "nhóm quảng cáo"
              : "quảng cáo"
          }?`
        )
      )
        return;

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

      alert(
        `✅ Đã xóa ${idsToDelete.length} ${
          key === "campaigns"
            ? "chiến dịch"
            : key === "adsets"
            ? "nhóm quảng cáo"
            : "quảng cáo"
        } thành công!`
      );
    } catch (error) {
      console.error("❌ Lỗi khi xóa:", error);
      alert(error?.response?.data?.message || "Xóa thất bại, vui lòng thử lại!");
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
          campaigns: response.data.items.map((campaign) => ({
            ...campaign,
            id: campaign._id || campaign.id || campaign.external_id,
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
          adsets: response.data.items.map((adset) => ({
            ...adset,
            id: adset._id || adset.id || adset.external_id,
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
          ads: response.data.items.map((ad) => ({
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
          adsets: response.data.items.map((adset) => ({
            ...adset,
            id: adset._id || adset.id || adset.external_id,
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
          ads: response.data.items.map((ad) => ({
            ...ad,
            id: ad._id || ad.id || ad.external_id,
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
                          className={`switch ${row.enabled ? "on" : "off"}`}
                          aria-pressed={row.enabled}
                          onClick={() => toggleRow(row.id)}
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
                      <td
                        className={
                          row.status === "Hoạt động"
                            ? "status-active"
                            : "status-inactive"
                        }
                      >
                        {row.status}
                      </td>
                      <td className="text-center">{row.budget || "-"}</td>
                      <td className="text-right">{row.impressions || "-"}</td>
                      <td className="text-right">{row.reach || "-"}</td>
                      <td className="text-right">{row.results || "-"}</td>
                      <td className="text-right">{row.quality || "-"}</td>
                      <td className="text-right">{row.updated_at || "-"}</td>
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
