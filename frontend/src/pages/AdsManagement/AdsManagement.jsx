import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Edit, Archive, Trash, RefreshCw } from "lucide-react";
import Pagination from "../../components/common/Pagination/Pagination";
import "./AdsManagement.css";
import CreateAdsWizard from "../../components/feature/CreateAdsWizard/CreateAdsWizard";
import ConfirmationPopup from "../../components/common/ConfirmationPopup/ConfirmationPopup";
import ProgressPopup from "../../components/common/ProgressPopup/Progress";
import { handleSelectAll, handleSelectItem } from "../../utils/selectionUtils";
import axiosInstance from "../../utils/axios";
import { useToast } from "../../hooks/useToast";
import { translateStatus, getStatusClass } from "../../utils/statusUtils";
import { translateObjective, formatTargetingVN, translateOptimizationGoal } from "../../utils/translationUtils";

// 🎯 Custom Hooks
import { useAdsData } from "../../hooks/useAdsData";
import { useAdsSelection } from "../../hooks/useAdsSelection";
import { useAdsActions } from "../../hooks/useAdsActions";

function AdsManagement() {
  const { t } = useTranslation();
  const toast = useToast();
  
  // 🎯 Custom Hooks
  const {
    datasets,
    setDatasets,
    loading: _dataLoading,
    syncData,
    fetchAllData, // ← Fetch tất cả data 1 lần
    clearDatasets: _clearDatasets
  } = useAdsData();

  const {
    checkAll,
    setCheckAll,
    hasSelectedItems,
    setHasSelectedItems,
    selectedCampaign,
    setSelectedCampaign,
    selectedAdset,
    setSelectedAdset,
    resetSelection,
    selectCampaign,
    selectAdset
  } = useAdsSelection();

  // 🎯 Local State (phải khai báo trước handleRefreshCallback)
  const [activeTab, setActiveTab] = useState("campaigns");
  const [showWizard, setShowWizard] = useState(false);
  const [wizardMode, setWizardMode] = useState("create");
  const [editingItem, setEditingItem] = useState(null);
  const [adAccounts, setAdAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // 🔹 Pagination state (phải khai báo trước getFilteredRows)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });

  // ✅ handleRefreshCallback (sau khi selectedAccountId được khai báo)
  const handleRefreshCallback = useCallback(async () => {
    if (!selectedAccountId) return;
    
    try {
      // 1️⃣ Force sync data từ Facebook
      await syncData(selectedAccountId, true);
      
      // 2️⃣ Fetch lại tất cả data
      await fetchAllData(selectedAccountId);

      console.log("✅ Data refreshed successfully after delete");
    } catch (error) {
      console.error("❌ Error refreshing data:", error);
    }
  }, [selectedAccountId, syncData, fetchAllData]);

  // 🎯 useAdsActions với handleRefreshCallback
  const {
    togglingItems,
    toggleRow,
    handleDelete,
    handleArchive,
    confirmationPopup,
    setConfirmationPopup,
    progressPopup,
    setProgressPopup
  } = useAdsActions(datasets, setDatasets, handleRefreshCallback);

  // 🔹 Get filtered rows với CLIENT-SIDE PAGINATION
const getFilteredRows = () => {
    let allData = [];
    
  if (activeTab === "campaigns") {
      allData = datasets.campaigns; 
    } else if (activeTab === "adsets") {
      allData = datasets.adsets; 
    
    if (selectedCampaign) {
        allData = allData.filter(
        (a) => a.campaignId === selectedCampaign.id
      );
    }
    } else if (activeTab === "ads") {
      allData = datasets.ads;
    
    if (selectedAdset) {
        allData = allData.filter((a) => String(a.adsetId) === String(selectedAdset.id));
    } else if (selectedCampaign) {
      const campaignAdsets = datasets.adsets.filter(
        (adset) => adset.campaignId === selectedCampaign.id
      );
      const campaignAdsetIds = campaignAdsets.map((adset) => String(adset.id));
        allData = allData.filter((ad) => 
        campaignAdsetIds.includes(String(ad.adsetId))
      );
    }
    }
    
    // ✅ CLIENT-SIDE PAGINATION: Slice data dựa trên page & limit
    const total = allData.length;
    const totalPages = Math.ceil(total / pagination.limit) || 1;
    const start = (pagination.page - 1) * pagination.limit;
    const end = start + pagination.limit;
    const paginatedData = allData.slice(start, end);
    
    // Update pagination total (dùng useEffect để tránh update trong render)
    if (pagination.total !== total || pagination.totalPages !== totalPages) {
      setTimeout(() => {
        setPagination(prev => ({
      ...prev,
          total,
          totalPages
        }));
      }, 0);
    }
    
    return paginatedData;
  };
  
  const rows = getFilteredRows();

  // 🔹 Toggle ON/OFF - Sử dụng hook
  const handleToggleRow = useCallback((id) => {
    toggleRow(id, activeTab);
  }, [toggleRow, activeTab]);

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
      campaign =
        datasets.campaigns.find((c) => c.id === item.campaignId) || null;
    } else if (type === "ad") {
      adset = datasets.adsets.find((a) => a.id === item.adsetId) || null;
      // Tìm campaign thông qua adset relationship
      campaign = adset 
        ? datasets.campaigns.find((c) => c.id === adset.campaignId) || null
        : null;
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
  // 🔹 Delete - Sử dụng hook (đã có refresh callback)
  const handleDeleteWithRefresh = useCallback((id) => {
    handleDelete(id, activeTab, hasSelectedItems, setCheckAll, setHasSelectedItems);
  }, [handleDelete, activeTab, hasSelectedItems, setCheckAll, setHasSelectedItems]);

  // 🔹 Archive - Sử dụng hook (đã có refresh callback)
  const handleArchiveWithRefresh = useCallback((id) => {
    handleArchive(id, activeTab, hasSelectedItems, setCheckAll, setHasSelectedItems);
  }, [handleArchive, activeTab, hasSelectedItems, setCheckAll, setHasSelectedItems]);

  // 🔹 Navigation - Chỉ chuyển tab, không fetch (data đã có sẵn)
  const handleCampaignClick = useCallback((campaign) => {
    selectCampaign(campaign);
    setActiveTab("adsets");
    setPagination(prev => ({ ...prev, page: 1 })); // Reset về page 1
  }, [selectCampaign]);

  const handleAdsetClick = useCallback((adset) => {
    selectAdset(adset);
    setActiveTab("ads");
    setPagination(prev => ({ ...prev, page: 1 })); // Reset về page 1
  }, [selectAdset]);

  // ❌ REMOVED: Tất cả wrapper functions không còn dùng
  // Lý do: CLIENT-SIDE PAGINATION - chỉ fetch 1 lần khi chọn account hoặc refresh

  // 🔹 Fetch Ad Accounts
  useEffect(() => {
    const fetchAdAccounts = async () => {
      setLoadingAccounts(true);
      try {
        const response = await axiosInstance.get("/api/ads-accounts");
        if (response.data?.items) {
          setAdAccounts(response.data.items);
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

  // 🔹 Sync data khi chọn account mới hoặc refresh
  useEffect(() => {
    if (selectedAccountId && initialized) {
      syncData(selectedAccountId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccountId, initialized]); // ✅ Không include syncData - nó stable rồi

  // ❌ REMOVED: useEffect fetch khi chuyển tab/pagination
  // Lý do: Giờ dùng CLIENT-SIDE PAGINATION - data đã có sẵn, không cần fetch lại

  // 🔹 Handle account change - Fetch ALL data 1 lần
  const handleAccountChange = async (e) => {
    const accountId = e.target.value;
    setSelectedAccountId(accountId);
    localStorage.setItem("selectedAdAccount", accountId);
    resetSelection();
    setActiveTab("campaigns");
    setPagination(prev => ({ ...prev, page: 1 })); // Reset về page 1
    
    if (accountId) {
      // ✅ Fetch tất cả data 1 lần duy nhất
      await fetchAllData(accountId);
      console.log('✅ All data loaded for account:', accountId);
    } else {
      // Clear datasets when deselecting
      setDatasets({ campaigns: [], adsets: [], ads: [] });
    }
  };

  // 🔹 Handle refresh - Sync + Fetch ALL data 1 lần
  const handleRefresh = useCallback(async () => {
    if (!selectedAccountId) {
      toast.warning(t('ads_management.select_account_warning'), {
        description: t('ads_management.select_account_description'),
      });
      return;
    }

    setRefreshing(true);

    try {
      // 1️⃣ Force sync data từ Facebook
      await syncData(selectedAccountId, true);
      
      // 2️⃣ Fetch lại tất cả data
      await fetchAllData(selectedAccountId);

      console.log("✅ Data refreshed successfully");
      toast.success(t('ads_management.refresh_success'));
    } catch (error) {
      console.error("❌ Error refreshing data:", error);
      toast.error(t('ads_management.refresh_error'));
    } finally {
      setRefreshing(false);
    }
  }, [selectedAccountId, syncData, fetchAllData, toast, t]);

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
                  <option value="">{t('ads_management.select_account')}</option>
                  {loadingAccounts ? (
                    <option disabled>{t('ads_management.loading_accounts')}</option>
                  ) : adAccounts.length === 0 ? (
                    <option disabled>{t('ads_management.no_accounts')}</option>
                  ) : (
                    adAccounts.map((account) => (
                      <option key={account._id} value={account.external_id}>
                        {account.name || t('ads_management.account')} ({account.external_id})
                      </option>
                    ))
                  )}
                </select>

                <button
                  className={`btn-create-ads ${!selectedAccountId ? 'disabled' : ''}`}
                  onClick={() => {
                    if (!selectedAccountId) return;
                    setWizardMode("create");
                    setEditingItem(null);
                    resetSelection();
                    setShowWizard(true);
                  }}
                  disabled={!selectedAccountId}
                >
                  + {t('ads_management.create_campaign')}
                </button>
              </div>

              <div className="filters">
                <span>{t('ads_management.from')}</span>
                <input type="date" />
                <span>{t('ads_management.to')}</span>
                <input type="date" />
                <button className="btn-filter">{t('ads_management.search')}</button>
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
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                >
                  {t('ads_management.all_campaigns')}
                </button>
                {selectedCampaign && (
                  <>
                    <span className="breadcrumb-separator">›</span>
                    <button
                      className="breadcrumb-item"
                      onClick={() => {
                        setSelectedAdset(null);
                        setActiveTab("adsets");
                        setPagination(prev => ({ ...prev, page: 1 }));
                      }}
                    >
                      {t('ads_management.campaign')} <span className="breadcrumb-name">{selectedCampaign.name}</span>
                    </button>
                  </>
                )}
                {selectedAdset && (
                  <>
                    <span className="breadcrumb-separator">›</span>
                    <button
                      className="breadcrumb-item"
                      onClick={() => {
                        setActiveTab("ads");
                        setPagination(prev => ({ ...prev, page: 1 }));
                      }}
                    >
                      {t('ads_management.adset')} <span className="breadcrumb-name">{selectedAdset.name}</span>
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
                  resetSelection();
                  setActiveTab("campaigns");
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
              >
                <span className="tab-icon">▦</span> {t('ads_management.campaigns')}
              </button>
              <button
                className={`tab ${activeTab === "adsets" ? "active" : ""}`}
                onClick={() => {
                  resetSelection();
                  setActiveTab("adsets");
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
              >
                <span className="tab-icon">▣</span> {t('ads_management.adsets')}
              </button>
              <button
                className={`tab ${activeTab === "ads" ? "active" : ""}`}
                onClick={() => {
                  resetSelection();
                  setActiveTab("ads");
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
              >
                <span className="tab-icon">▥</span> {t('ads_management.ads')}
              </button>

              {hasSelectedItems && (
                <div className="icon-beside-tab">
                  <button
                    className="ads-action-btn ads-archive-btn"
                    onClick={() => handleArchiveWithRefresh()}
                    title="Lưu trữ"
                  >
                    <Archive size={15} />
                  </button>
                  <button
                    className="ads-action-btn ads-delete-btn"
                    onClick={() => handleDeleteWithRefresh()}
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
                title={t('account_management.refresh')}
              >
                <RefreshCw size={16} className={refreshing ? "spinning" : ""} />
                {refreshing ? t('ads_management.loading') : t('account_management.refresh')}
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
                    <th>{t('ads_management.on_off')}</th>
                    <th>{t('ads_management.name')}</th>
                    <th>{t('ads_management.status')}</th>
                    <th>{t('ads_management.budget')}</th>
                    {activeTab === "adsets" && <th>{t('ads_management.targeting')}</th>}
                    {activeTab === "adsets" && <th>{t('ads_management.targeting')}</th>}
                    {activeTab === "campaigns" && <th>{t('ads_management.objective')}</th>}
                    <th>{t('ads_management.impressions')}</th>
                    <th>{t('ads_management.reach')}</th>
                    <th>{t('ads_management.results')}</th>
                    <th>{t('ads_management.quality')}</th>
                    <th>{t('ads_management.creator_name')}</th>
                    <th>{t('ads_management.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {(activeTab === "ads" || activeTab === "adsets" || activeTab === "campaigns") && rows.length === 0 && (
                    <tr>
                      <td colSpan={activeTab === "adsets" ? 13 : activeTab === "campaigns" ? 12 : 11} style={{ textAlign: 'center', padding: '16px', color: '#6b7280' }}>
                        {activeTab === "campaigns" ? t('ads_management.no_campaigns') : activeTab === "adsets" ? t('ads_management.no_adsets') : t('ads_management.no_ads')}
                      </td>
                    </tr>
                  )}
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
                          className={`switch ${row.enabled ? "on" : "off"} ${
                            togglingItems.has(row.id) ? "loading" : ""
                          }`}
                          aria-pressed={row.enabled}
                          onClick={() => handleToggleRow(row.id)}
                          disabled={togglingItems.has(row.id)}
                        />
                      </td>
                      <td>
                        <span
                          className={`name-text ${activeTab === "ads" ? "" : "clickable"} ${activeTab === "ads" ? "ad-name" : ""}`}
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
                      {activeTab === "adsets" && (
                        <td className="text-center">
                          {row.start_time && row.end_time ? (
                            <div style={{ fontSize: '12px' }}>
                              <div>{new Date(row.start_time).toLocaleDateString('vi-VN')}</div>
                              <div>đến</div>
                              <div>{new Date(row.end_time).toLocaleDateString('vi-VN')}</div>
                            </div>
                          ) : row.start_time ? (
                            <div style={{ fontSize: '12px' }}>
                              <div>Từ: {new Date(row.start_time).toLocaleDateString('vi-VN')}</div>
                              <div>Không giới hạn</div>
                            </div>
                          ) : (
                            "Chưa thiết lập"
                          )}
                        </td>
                      )}
                      {activeTab === "adsets" && (
                        <td className="text-center">
                          <div style={{ fontSize: '12px', textAlign: 'left' }}>
                            {Array.isArray(formatTargetingVN(row.targeting)) ? (
                              <>
                                {formatTargetingVN(row.targeting).map((line, idx) => (
                                  <div key={idx}>{line}</div>
                                ))}
                                {row.optimization_goal && (
                                  <div>Mục tiêu: {translateOptimizationGoal(row.optimization_goal)}</div>
                                )}
                              </>
                            ) : (
                              <div>{formatTargetingVN(row.targeting)}</div>
                            )}
                          </div>
                        </td>
                      )}
                      {activeTab === "campaigns" && (
                        <td className="text-center">
                          <div style={{ fontSize: '12px' }}>
                            {translateObjective(row.objective)}
                          </div>
                        </td>
                      )}
                      <td className="text-center">{row.impressions || "-"}</td>
                      <td className="text-center">{row.reach || "-"}</td>
                      <td className="text-center">{row.results || "-"}</td>
                      <td className="text-center">{row.quality || "-"}</td>
                      <td className="text-center">
                        {row.creator_name || "Không rõ"}
                      </td>
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
                            onClick={() => handleArchiveWithRefresh(row.id)}
                            title="Lưu trữ"
                          >
                            <Archive size={14} />
                          </button>
                          <button
                            className="ads-action-btn ads-delete-btn"
                            onClick={() => handleDeleteWithRefresh(row.id)}
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

            {/* Pagination */}
            {rows.length > 0 && (
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                itemsPerPage={pagination.limit}
                totalItems={pagination.total}
                startIndex={(pagination.page - 1) * pagination.limit}
                endIndex={Math.min(pagination.page * pagination.limit, pagination.total)}
                onPageChange={(page) => {
                  setPagination(prev => ({ ...prev, page }));
                }}
                onItemsPerPageChange={(limit) => {
                  setPagination(prev => ({ ...prev, page: 1, limit }));
                }}
                disabled={refreshing}
              />
            )}
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
        onClose={() =>
          setConfirmationPopup((prev) => ({ ...prev, isOpen: false }))
        }
        onConfirm={confirmationPopup.onConfirm}
        title={confirmationPopup.title}
        message={confirmationPopup.message}
        type={confirmationPopup.type}
        isLoading={confirmationPopup.isLoading}
      />

      {/* ✅ Progress Popup */}
      <ProgressPopup
        isOpen={progressPopup.isOpen}
        type={progressPopup.type}
        title={progressPopup.title}
        progress={progressPopup.progress}
        onClose={() => setProgressPopup(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}

export default AdsManagement;
