import { useState, useEffect, useCallback, useRef } from "react";
import { Edit, Archive, Trash, RefreshCw } from "lucide-react";
import Pagination from "../../components/common/Pagination/Pagination";
import "./AdsManagement.css";
import CreateAdsWizard from "../../components/feature/CreateAdsWizard/CreateAdsWizard";
import ConfirmationPopup from "../../components/common/ConfirmationPopup/ConfirmationPopup";
import ProgressPopup from "../../components/common/ProgressPopup/Progress";
import { handleSelectAll, handleSelectItem } from "../../utils/selectionUtils";
import {
  deleteCampaign,
  deleteAdSet,
  deleteAd,
} from "../../services/adService";
import { toggleEntityStatus } from "../../services/toggleStatusService";
import axiosInstance from "../../utils/axios";
import { useToast } from "../../hooks/useToast";
import { translateStatus, getStatusClass } from "../../utils/statusUtils";
import { useProgressState } from "../../hooks/useProgressState";
import { useTranslation } from "react-i18next";
import { translateObjective, translateOptimizationGoal, formatTargetingVN } from "../../utils/translationUtils";

function AdsManagement() {
  const { t } = useTranslation(['ads']);
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

  // Cache để tránh gọi API trùng lặp
  const [cache, setCache] = useState({
    lastSync: null,
    lastFetch: {}
  });

  // Track tab trước đó để tránh xung đột logic
  const prevActiveTabRef = useRef(activeTab);

  const [checkAll, setCheckAll] = useState(false);
  const [hasSelectedItems, setHasSelectedItems] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [togglingItems, setTogglingItems] = useState(new Set()); // Track items being toggled

  // Confirmation popup state
  const [confirmationPopup, setConfirmationPopup] = useState({
    isOpen: false,
    type: "delete", // 'delete' | 'archive'
    title: "",
    message: "",
    onConfirm: null,
    isLoading: false,
  });

  // Progress popup state
  const { progressState, openProgress, updateProgress, closeProgress } = useProgressState();

  // Helper function to get entity name
  const getEntityName = (key) => {
    return t(`entity_names.${key}`, { defaultValue: key });
  };

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
          adset.status !== "DELETED" && adset.effective_status !== "DELETED"
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
        (ad) => ad.status !== "DELETED" && ad.effective_status !== "DELETED"
      );

      if (selectedAdset) {
        filteredAds = filteredAds.filter((a) => String(a.adsetId) === String(selectedAdset.id));
      } else if (selectedCampaign) {
        // Filter ads thông qua adset relationship
        // Lấy tất cả adsets thuộc campaign này
        const campaignAdsets = datasets.adsets.filter(
          (adset) => adset.campaignId === selectedCampaign.id
        );
        const campaignAdsetIds = campaignAdsets.map((adset) => String(adset.id));
        
        // Filter ads thuộc các adsets này
        filteredAds = filteredAds.filter((ad) => 
          campaignAdsetIds.includes(String(ad.adsetId))
        );
      }
      return filteredAds;
    }
    return [];
  };
  const rows = getFilteredRows();

  // 🔹 Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });

  // 🔹 Toggle ON/OFF với đồng bộ Facebook API
  const toggleRow = async (id) => {
    const key =
      activeTab === "campaigns"
        ? "campaigns"
        : activeTab === "adsets"
        ? "adsets"
        : "ads";

    const entityType = activeTab.slice(0, -1); // "campaigns" -> "campaign", "adsets" -> "adset", "ads" -> "ad"
    const row = datasets[key].find((r) => r.id === id);

    if (!row) {
      toast.error(t('toasts.item_not_found'));
      return;
    }

    // Kiểm tra có external_id không (cần để gọi Facebook API)
    if (!row.external_id) {
      toast.warning(t('toasts.cannot_sync_facebook'), {
        description: t('toasts.no_external_id'),
      });
      return;
    }

    const newStatus = !row.enabled;
    const facebookStatus = newStatus ? "ACTIVE" : "PAUSED";
    const displayStatus = newStatus ? "Hoạt động" : "Tạm dừng";

    // Thêm vào loading state
    setTogglingItems((prev) => new Set(prev).add(id));

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
      await toggleEntityStatus(entityType, row.external_id, facebookStatus);
      const entityLabel = getEntityName(entityType);
      const action = newStatus ? t('toasts.toggle_on') : t('toasts.toggle_off');
      toast.success(
        `${entityLabel.charAt(0).toUpperCase() + entityLabel.slice(1)} ${t('toasts.toggle_success')} ${action}`
      );
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

      const action = newStatus ? t('toasts.toggle_on') : t('toasts.toggle_off');
      toast.error(`${t('toasts.toggle_error')} ${action} ${getEntityName(entityType)}`, {
        description: error.message,
      });
    } finally {
      // Xóa khỏi loading state
      setTogglingItems((prev) => {
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
      toast.warning(t('toasts.select_item_archive_warning'));
      return;
    }

    const entityName = getEntityName(key);

    setConfirmationPopup({
      isOpen: true,
      type: "archive",
      title: t('confirmations.archive_title', { count: idsToArchive.length, entity: entityName }),
      message: t('confirmations.archive_message', { count: idsToArchive.length, entity: entityName }),
      onConfirm: () => executeArchive(idsToArchive),
      isLoading: false,
    });
  };

  const executeArchive = async (idsToArchive) => {
    setConfirmationPopup((prev) => ({ ...prev, isLoading: true }));

    try {
      // TODO: Implement archive API calls
      console.log(`Lưu trữ ${idsToArchive.length} items:`, idsToArchive);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const entityName = getEntityName(activeTab);
      toast.success(t('toasts.archive_success', { count: idsToArchive.length, entity: entityName }));

      // Refresh data
      handleRefresh();
    } catch (error) {
      console.error("❌ Lỗi khi lưu trữ:", error);
      toast.error(t('toasts.archive_failed'));
    } finally {
      setConfirmationPopup((prev) => ({
        ...prev,
        isLoading: false,
        isOpen: false,
      }));
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
      toast.warning(t('toasts.select_item_warning'));
      return;
    }

    const entityName = getEntityName(key);

    setConfirmationPopup({
      isOpen: true,
      type: "delete",
      title: t('confirmations.delete_title', { count: idsToDelete.length, entity: entityName }),
      message: t('confirmations.delete_message', { count: idsToDelete.length, entity: entityName }),
      onConfirm: () => executeDelete(idsToDelete),
      isLoading: false,
    });
  };

  const executeDelete = async (idsToDelete) => {
    // Đóng confirmation popup
    setConfirmationPopup((prev) => ({
      ...prev,
      isOpen: false,
    }));

    const key =
      activeTab === "campaigns"
        ? "campaigns"
        : activeTab === "adsets"
        ? "adsets"
        : "ads";

    const entityName = getEntityName(key);

    // Mở progress popup
    openProgress({
      type: 'delete',
      title: t('progress.deleting', { entity: entityName }),
      total: idsToDelete.length,
    });

    try {
      // 🧩 Lấy token FB từ localStorage
      const fbToken = localStorage.getItem("fb_access_token") || null;

      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      // 🔹 Gọi đúng service cho từng loại và cập nhật progress
      for (let i = 0; i < idsToDelete.length; i++) {
        const delId = idsToDelete[i];
        
        try {
          updateProgress({
            current: i,
            message: t('progress.deleting_progress', { entity: entityName, current: i + 1, total: idsToDelete.length }),
          });

          if (key === "campaigns") {
            await deleteCampaign(delId, fbToken);
          } else if (key === "adsets") {
            await deleteAdSet(delId, fbToken);
          } else {
            await deleteAd(delId, fbToken);
          }

          successCount++;
          
          updateProgress({
            current: i + 1,
            message: t('progress.deleted', { current: i + 1, total: idsToDelete.length, entity: entityName }),
          });
        } catch (itemError) {
          errorCount++;
          errors.push({
            id: delId,
            error: itemError?.response?.data?.message || itemError.message,
          });
          console.error(`❌ Lỗi khi xóa ${delId}:`, itemError);
        }
      }

      // 🔹 Cập nhật UI - xóa tất cả items đã được xử lý (bao gồm cả success)
      const processedIds = idsToDelete.slice(0, successCount);
      
      setDatasets((prev) => ({
        ...prev,
        [key]: prev[key].filter((item) => !processedIds.includes(item.id)),
      }));
      setCheckAll(false);
      setHasSelectedItems(false);

      // Cập nhật trạng thái cuối cùng
      if (errorCount === 0) {
        updateProgress({
          status: 'success',
          current: idsToDelete.length,
          message: t('progress.completed'),
          successCount,
          errorCount: 0,
        });
        toast.success(t('toasts.delete_success', { count: successCount, entity: entityName }));
      } else if (successCount > 0) {
        updateProgress({
          status: 'partial',
          current: idsToDelete.length,
          message: t('progress.completed_with_errors', { errorCount }),
          successCount,
          errorCount,
          errors,
        });
        toast.warning(t('toasts.delete_partial', { successCount, total: idsToDelete.length, entity: entityName, errorCount }));
      } else {
        updateProgress({
          status: 'error',
          message: t('progress.delete_failed'),
          errorCount,
          errors,
        });
        toast.error(t('toasts.delete_failed'));
      }

      // Refresh data after deletion
      if (successCount > 0) {
        handleRefresh();
      }
    } catch (error) {
      console.error("❌ Lỗi khi xóa:", error);
      
      updateProgress({
        status: 'error',
        message: error?.response?.data?.message || t('toasts.delete_failed'),
      });
      
      toast.error(
        error?.response?.data?.message || t('toasts.delete_failed')
      );
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

  // 🔹 Sync data từ Facebook (chỉ gọi khi cần thiết)
  const syncData = useCallback(async (accountId, forceSync = false) => {
    if (!accountId) return;
    
    // Kiểm tra cache - chỉ sync nếu chưa sync trong 30 giây hoặc force sync
    const now = Date.now();
    const lastSync = cache.lastSync;
    const cacheKey = `${accountId}_${activeTab}`;
    
    if (!forceSync && lastSync && (now - lastSync) < 30000) {
      console.log("⏭️ Skip sync - cached recently");
      return;
    }
    
    try {
      await Promise.all([
        axiosInstance.get(`/api/campaigns/sync?account_id=${accountId}`),
        axiosInstance.get(`/api/adsets/sync?account_id=${accountId}`),
        axiosInstance.get(`/api/ads/sync?account_id=${accountId}`)
      ]);
      
      // Cập nhật cache
      setCache(prev => ({
        ...prev,
        lastSync: now,
        lastFetch: { ...prev.lastFetch, [cacheKey]: now }
      }));
    } catch (error) {
      console.error("Sync error:", error);
    }
  }, [cache.lastSync, activeTab]);

  // 🔹 Fetch campaigns (không sync)
  const fetchCampaignsForAccount = useCallback(async (accountId) => {
    if (!accountId) return;
    try {
      const response = await axiosInstance.get(`/api/campaigns`, {
        params: {
          account_id: accountId,
          page: pagination.page,
          limit: pagination.limit
        }
      });
      if (response.data) {
        const { items, total, pages } = response.data;
        
        // Cập nhật thông tin phân trang từ response
        setPagination(prev => ({
          ...prev,
          total,
          totalPages: pages
        }));

        // ✅ Không cần filter thêm - backend đã filter DELETED
        const mapped = items.map((campaign) => ({
          ...campaign,
          id: campaign._id || campaign.id || campaign.external_id,
          external_id: campaign.external_id,
          isChecked: false,
          enabled:
            campaign.status === "ACTIVE" ||
            campaign.effective_status === "ACTIVE",
          budget: campaign.daily_budget || campaign.lifetime_budget || 0,
          start_time: campaign.start_time,
          end_time: campaign.stop_time,
          objective: campaign.objective,
          buying_type: campaign.buying_type,
          created_by: campaign.created_by,
        }));

        // Fetch insights for these campaigns
        const campaignIds = mapped.map((c) => c.external_id).filter(Boolean);
        let insightsMap = {};
        if (campaignIds.length) {
          try {
            const { data: ins } = await axiosInstance.get(`/api/campaigns/insights?ids=${campaignIds.join(',')}`);
            if (ins?.items?.length) {
              insightsMap = ins.items.reduce((acc, it) => {
                acc[it.id] = it.insights || {};
                return acc;
              }, {});
            }
          } catch (e) {
            console.warn('Campaign insights fetch failed', e);
          }
        }

        const merged = mapped.map((c) => {
          const ins = insightsMap[c.external_id] || {};
          const actions = Array.isArray(ins.actions) ? ins.actions : [];
          const results = actions.reduce((sum, act) => sum + (Number(act.value) || 0), 0);
          return {
            ...c,
            impressions: ins.impressions || 0,
            reach: ins.reach || 0,
            results,
            quality: ins.quality_ranking || '-',
          };
        });

        setDatasets((prev) => ({
          ...prev,
          campaigns: merged,
        }));
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    }
  }, [pagination.page, pagination.limit]);

  // 🔹 Fetch AdSets for campaign (không sync)
  const fetchAdsetsForCampaign = useCallback(async (campaignId, accountId) => {
    if (!campaignId || !accountId) return;
    try {
      const response = await axiosInstance.get(`/api/adsets`, {
        params: {
          campaign_id: campaignId,
          page: pagination.page,
          limit: pagination.limit
        }
      });
      if (response.data) {
        const { items, total, pages } = response.data;
        
        // Cập nhật thông tin phân trang từ response
        setPagination(prev => ({
          ...prev,
          total,
          totalPages: pages
        }));

        // ✅ Không cần filter thêm - backend đã filter DELETED
        const mapped = items.map((adset) => ({
          ...adset,
          id: adset._id || adset.id || adset.external_id,
          external_id: adset.external_id,
          campaignId,
          isChecked: false,
          enabled:
            adset.status === "ACTIVE" ||
            adset.effective_status === "ACTIVE",
          budget: adset.daily_budget || adset.lifetime_budget || 0,
          start_time: adset.start_time,
          end_time: adset.end_time,
          targeting: adset.targeting || {},
          optimization_goal: adset.optimization_goal,
          bid_strategy: adset.bid_strategy,
          bid_amount: adset.bid_amount,
          created_by: adset.created_by,
        }));

        // Fetch insights for these adsets
        const adsetIds = mapped.map((a) => a.external_id).filter(Boolean);
        let insightsMap = {};
        if (adsetIds.length) {
          try {
            const { data: ins } = await axiosInstance.get(`/api/adsets/insights?ids=${adsetIds.join(',')}`);
            if (ins?.items?.length) {
              insightsMap = ins.items.reduce((acc, it) => {
                acc[it.id] = it.insights || {};
                return acc;
              }, {});
            }
          } catch (e) {
            console.warn('Adset insights fetch failed', e);
          }
        }

        const merged = mapped.map((a) => {
          const ins = insightsMap[a.external_id] || {};
          const actions = Array.isArray(ins.actions) ? ins.actions : [];
          const results = actions.reduce((sum, act) => sum + (Number(act.value) || 0), 0);
          return {
            ...a,
            impressions: ins.impressions || 0,
            reach: ins.reach || 0,
            results,
            quality: ins.quality_ranking || '-',
          };
        });

        setDatasets((prev) => ({
          ...prev,
          adsets: merged,
        }));
      }
    } catch (error) {
      console.error("Error fetching adsets:", error);
    }
  }, [pagination.page, pagination.limit]);

  // 🔹 Fetch Ads for AdSet (không sync)
  const fetchAdsForAdset = useCallback(async (adsetId) => {
    if (!adsetId) return;
    try {
      const response = await axiosInstance.get(`/api/ads`, {
        params: {
          adset_id: adsetId,
          page: pagination.page,
          limit: pagination.limit
        }
      });
      if (response.data) {
        const { items, total, pages } = response.data;
        
        // Cập nhật thông tin phân trang từ response
        setPagination(prev => ({
          ...prev,
          total,
          totalPages: pages
        }));

        // ✅ Không cần filter thêm - backend đã filter DELETED
        const mapped = items.map((ad) => ({
          ...ad,
          id: ad._id || ad.id || ad.external_id,
          external_id: ad.external_id,
          adsetId,
          isChecked: false,
          enabled: ad.status === "ACTIVE" || ad.effective_status === "ACTIVE",
          budget: 0, // Ads don't have budget, it's inherited from adset
          created_by: ad.created_by,
        }));

        // Fetch insights for these ads
        const adIds = mapped.map((a) => a.external_id).filter(Boolean);
        let insightsMap = {};
        if (adIds.length) {
          try {
            const { data: ins } = await axiosInstance.get(`/api/ads/insights?ids=${adIds.join(',')}`);
            if (ins?.items?.length) {
              insightsMap = ins.items.reduce((acc, it) => {
                acc[it.id] = it.insights || {};
                return acc;
              }, {});
            }
          } catch (e) {
            console.warn('Insights fetch failed', e);
          }
        }

        const merged = mapped.map((a) => {
          const ins = insightsMap[a.external_id] || {};
          // derive fields for UI columns
          const actions = Array.isArray(ins.actions) ? ins.actions : [];
          const results = actions.reduce((sum, act) => sum + (Number(act.value) || 0), 0);
          return {
            ...a,
            impressions: ins.impressions || 0,
            reach: ins.reach || 0,
            results,
            quality: ins.quality_ranking || '-',
            updated_at: a.updated_at || a.updatedAt,
          };
        });

        setDatasets((prev) => ({ ...prev, ads: merged }));
      }
    } catch (error) {
      console.error("Error fetching ads:", error);
    }
  }, [pagination.page, pagination.limit]);

  // 🔹 Fetch all Adsets & Ads by account (không sync)
  const fetchAllAdsetsForAccount = useCallback(async (accountId) => {
    if (!accountId) return;
    try {
      const response = await axiosInstance.get(`/api/adsets`, {
        params: {
          account_id: accountId,
          page: pagination.page,
          limit: pagination.limit
        }
      });
      if (response.data) {
        const { items, total, pages } = response.data;
        
        // Cập nhật thông tin phân trang từ response
        setPagination(prev => ({
          ...prev,
          total,
          totalPages: pages
        }));

        // ✅ Không cần filter thêm - backend đã filter DELETED
        const mapped = items.map((adset) => ({
          ...adset,
          id: adset._id || adset.id || adset.external_id,
          external_id: adset.external_id,
          campaignId: adset.campaign_id,
          isChecked: false,
          enabled:
            adset.status === "ACTIVE" ||
            adset.effective_status === "ACTIVE",
          budget: adset.daily_budget || adset.lifetime_budget || 0,
          start_time: adset.start_time,
          end_time: adset.end_time,
          targeting: adset.targeting || {},
          optimization_goal: adset.optimization_goal,
          bid_strategy: adset.bid_strategy,
          bid_amount: adset.bid_amount,
          created_by: adset.created_by,
        }));

        // Fetch insights for these adsets
        const adsetIds = mapped.map((a) => a.external_id).filter(Boolean);
        let insightsMap = {};
        if (adsetIds.length) {
          try {
            const { data: ins } = await axiosInstance.get(`/api/adsets/insights?ids=${adsetIds.join(',')}`);
            if (ins?.items?.length) {
              insightsMap = ins.items.reduce((acc, it) => {
                acc[it.id] = it.insights || {};
                return acc;
              }, {});
            }
          } catch (e) {
            console.warn('Adset insights fetch failed', e);
          }
        }

        const merged = mapped.map((a) => {
          const ins = insightsMap[a.external_id] || {};
          const actions = Array.isArray(ins.actions) ? ins.actions : [];
          const results = actions.reduce((sum, act) => sum + (Number(act.value) || 0), 0);
          return {
            ...a,
            impressions: ins.impressions || 0,
            reach: ins.reach || 0,
            results,
            quality: ins.quality_ranking || '-',
          };
        });

        setDatasets((prev) => ({
          ...prev,
          adsets: merged,
        }));
      }
    } catch (error) {
      console.error("Error fetching adsets:", error);
    }
  }, [pagination.page, pagination.limit]);

  const fetchAllAdsForAccount = useCallback(async (accountId) => {
    if (!accountId) return;
    try {
      const response = await axiosInstance.get(`/api/ads`, {
        params: {
          account_id: accountId,
          page: pagination.page,
          limit: pagination.limit
        }
      });
      if (response.data) {
        const { items, total, pages } = response.data;
        
        // Cập nhật thông tin phân trang từ response
        setPagination(prev => ({
          ...prev,
          total,
          totalPages: pages
        }));

        // ✅ Không cần filter thêm - backend đã filter DELETED
        const mapped = items.map((ad) => ({
          ...ad,
          id: ad._id || ad.id || ad.external_id,
          external_id: ad.external_id,
          adsetId: ad.adset_id || ad.set_id,
          isChecked: false,
          enabled: ad.status === "ACTIVE" || ad.effective_status === "ACTIVE",
          budget: 0, // Ads don't have budget, it's inherited from adset
          created_by: ad.created_by,
        }));

        // Fetch insights in batch
        const adIds = mapped.map((a) => a.external_id).filter(Boolean);
        let insightsMap = {};
        if (adIds.length) {
          try {
            const { data: ins } = await axiosInstance.get(`/api/ads/insights?ids=${adIds.join(',')}`);
            if (ins?.items?.length) {
              insightsMap = ins.items.reduce((acc, it) => {
                acc[it.id] = it.insights || {};
                return acc;
              }, {});
            }
          } catch (e) {
            console.warn('Insights fetch failed', e);
          }
        }

        const merged = mapped.map((a) => {
          const ins = insightsMap[a.external_id] || {};
          const actions = Array.isArray(ins.actions) ? ins.actions : [];
          const results = actions.reduce((sum, act) => sum + (Number(act.value) || 0), 0);
          return {
            ...a,
            impressions: ins.impressions || 0,
            reach: ins.reach || 0,
            results,
            quality: ins.quality_ranking || '-',
            updated_at: a.updated_at || a.updatedAt,
          };
        });

        setDatasets((prev) => ({ ...prev, ads: merged }));
      }
    } catch (error) {
      console.error("Error fetching ads:", error);
    }
  }, [pagination.page, pagination.limit]);

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
  }, [selectedAccountId, initialized, syncData]);

  // 🔹 Load data khi pagination thay đổi hoặc chuyển tab (gộp logic reset)
  useEffect(() => {
    if (selectedAccountId && initialized) {
      // Reset pagination về page 1 khi chuyển tab
      if (prevActiveTabRef.current !== activeTab) {
        setPagination(prev => ({ ...prev, page: 1 }));
        prevActiveTabRef.current = activeTab;
        return; // Không fetch data ngay, để useEffect chạy lại với page: 1
      }

      // Fetch data dựa trên tab hiện tại
      if (activeTab === "campaigns") {
        fetchCampaignsForAccount(selectedAccountId);
      } else if (activeTab === "adsets") {
        if (selectedCampaign) {
          fetchAdsetsForCampaign(selectedCampaign.id, selectedAccountId);
        } else {
          fetchAllAdsetsForAccount(selectedAccountId);
        }
      } else if (activeTab === "ads") {
        if (selectedAdset) {
          fetchAdsForAdset(selectedAdset.id);
        } else {
          fetchAllAdsForAccount(selectedAccountId);
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedAccountId,
    initialized,
    activeTab,
    pagination.page,
    pagination.limit,
    selectedCampaign?.id,
    selectedAdset?.id,
    fetchCampaignsForAccount,
    fetchAdsetsForCampaign,
    fetchAllAdsetsForAccount,
    fetchAdsForAdset,
    fetchAllAdsForAccount
  ]);

  // 🔹 Handle account change
  const handleAccountChange = (e) => {
    const accountId = e.target.value;
    setSelectedAccountId(accountId);
    localStorage.setItem("selectedAdAccount", accountId);
    resetSelection();
    setActiveTab("campaigns");
    if (accountId) {
      fetchCampaignsForAccount(accountId);
      fetchAllAdsetsForAccount(accountId);
      fetchAllAdsForAccount(accountId);
    } else {
      // Clear datasets when deselecting
      setDatasets({ campaigns: [], adsets: [], ads: [] });
    }
  };

  // 🔹 Handle refresh data (tối ưu - chỉ sync và fetch tab hiện tại)
  const handleRefresh = useCallback(async () => {
    if (!selectedAccountId) {
      toast.warning(t('toasts.select_account_warning'), {
        description: t('toasts.select_account_description'),
      });
      return;
    }

    setRefreshing(true);

    try {
      // Force sync data từ Facebook
      await syncData(selectedAccountId, true);
      
      // Sau đó fetch data cho tab hiện tại
      if (activeTab === "campaigns") {
        await fetchCampaignsForAccount(selectedAccountId);
      } else if (activeTab === "adsets") {
        if (selectedCampaign) {
          await fetchAdsetsForCampaign(selectedCampaign.id, selectedAccountId);
        } else {
          await fetchAllAdsetsForAccount(selectedAccountId);
        }
      } else if (activeTab === "ads") {
        if (selectedAdset) {
          await fetchAdsForAdset(selectedAdset.id);
        } else {
          await fetchAllAdsForAccount(selectedAccountId);
        }
      }

      console.log("✅ Data refreshed successfully");
      toast.success(t('toasts.refresh_success'));
    } catch (error) {
      console.error("❌ Error refreshing data:", error);
      toast.error(t('toasts.refresh_error'));
    } finally {
      setRefreshing(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccountId, activeTab, selectedCampaign?.id, selectedAdset?.id, syncData, fetchCampaignsForAccount, fetchAdsetsForCampaign, fetchAllAdsetsForAccount, fetchAdsForAdset, fetchAllAdsForAccount, toast, t]);

  // ✅ Chỉ fetch từ DB, không sync Facebook (dùng cho draft)
  const handleFetchOnly = useCallback(async () => {
    if (!selectedAccountId) {
      return;
    }

    try {
      // Chỉ fetch data cho tab hiện tại (KHÔNG sync Facebook)
      if (activeTab === "campaigns") {
        await fetchCampaignsForAccount(selectedAccountId);
      } else if (activeTab === "adsets") {
        if (selectedCampaign) {
          await fetchAdsetsForCampaign(selectedCampaign.id, selectedAccountId);
        } else {
          await fetchAllAdsetsForAccount(selectedAccountId);
        }
      } else if (activeTab === "ads") {
        if (selectedAdset) {
          await fetchAdsForAdset(selectedAdset.id);
        } else {
          await fetchAllAdsForAccount(selectedAccountId);
        }
      }

      console.log("✅ Data fetched successfully");
    } catch (error) {
      console.error("❌ Error fetching data:", error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccountId, activeTab, selectedCampaign?.id, selectedAdset?.id, fetchCampaignsForAccount, fetchAdsetsForCampaign, fetchAllAdsetsForAccount, fetchAdsForAdset, fetchAllAdsForAccount]);

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
                  <option value="">{t('management.select_account')}</option>
                  {loadingAccounts ? (
                    <option disabled>{t('management.loading_accounts')}</option>
                  ) : adAccounts.length === 0 ? (
                    <option disabled>{t('management.no_accounts')}</option>
                  ) : (
                    adAccounts.map((account) => (
                      <option key={account._id} value={account.external_id}>
                        {account.name || t('management.account')} ({account.external_id})
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
                  + {t('management.create_campaign')}
                </button>
              </div>

              <div className="filters">
                <span>{t('management.from')}</span>
                <input type="date" />
                <span>{t('management.to')}</span>
                <input type="date" />
                <button className="btn-filter">{t('management.search')}</button>
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
                  {t('management.all_campaigns')}
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
                <span className="tab-icon">▦</span> {t('management.campaigns_tab')}
              </button>
              <button
                className={`tab ${activeTab === "adsets" ? "active" : ""}`}
                onClick={() => {
                  resetSelection();
                  setActiveTab("adsets");
                  if (selectedAccountId)
                    fetchAllAdsetsForAccount(selectedAccountId);
                }}
              >
                <span className="tab-icon">▣</span> {t('management.adsets_tab')}
              </button>
              <button
                className={`tab ${activeTab === "ads" ? "active" : ""}`}
                onClick={() => {
                  resetSelection();
                  setActiveTab("ads");
                  if (selectedAccountId)
                    fetchAllAdsForAccount(selectedAccountId);
                }}
              >
                <span className="tab-icon">▥</span> {t('management.ads_tab')}
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
                title={t('management.refresh')}
              >
                <RefreshCw size={16} className={refreshing ? "spinning" : ""} />
                {refreshing ? t('management.refreshing') : t('management.refresh')}
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
                    <th>{t('management.toggle_on_off')}</th>
                    <th>{t('management.name')}</th>
                    <th>{t('management.status')}</th>
                    <th>{t('management.budget')}</th>
                    {activeTab === "adsets" && <th>{t('management.runtime')}</th>}
                    {activeTab === "adsets" && <th>{t('management.targeting')}</th>}
                    {activeTab === "campaigns" && <th>{t('management.objective')}</th>}
                    <th>{t('management.impressions')}</th>
                    <th>{t('management.reach')}</th>
                    <th>{t('management.results')}</th>
                    <th>{t('management.quality')}</th>
                    <th>{t('management.creator')}</th>
                    <th>{t('management.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {(activeTab === "ads" || activeTab === "adsets" || activeTab === "campaigns") && rows.length === 0 && (
                    <tr>
                      <td colSpan={activeTab === "adsets" ? 13 : activeTab === "campaigns" ? 12 : 11} style={{ textAlign: 'center', padding: '16px', color: '#6b7280' }}>
                        {t('management.no_data')}
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
                      {activeTab === "adsets" && (
                        <td className="text-center">
                          {row.start_time && row.end_time ? (
                            <div style={{ fontSize: '12px' }}>
                              <div>{new Date(row.start_time).toLocaleDateString('vi-VN')}</div>
                              <div>{t('management.to')}</div>
                              <div>{new Date(row.end_time).toLocaleDateString('vi-VN')}</div>
                            </div>
                          ) : row.start_time ? (
                            <div style={{ fontSize: '12px' }}>
                              <div>{t('management.from')}: {new Date(row.start_time).toLocaleDateString('vi-VN')}</div>
                              <div>{t('management.no_limit')}</div>
                            </div>
                          ) : (
                            t('labels.not_set')
                          )}
                        </td>
                      )}
                      {activeTab === "adsets" && (
                        <td className="text-center">
                          <div style={{ fontSize: '12px', textAlign: 'left' }}>
                            {row.targeting && Object.keys(row.targeting).length > 0 ? (
                              formatTargetingVN(row.targeting).map((line, idx) => (
                                <div key={idx}>{line}</div>
                              ))
                            ) : (
                              t('labels.not_set')
                            )}
                            {row.optimization_goal && (
                              <div>{t('management.goal_label')}: {translateOptimizationGoal(row.optimization_goal)}</div>
                            )}
                          </div>
                        </td>
                      )}
                      {activeTab === "campaigns" && (
                        <td className="text-center">
                          <div style={{ fontSize: '12px' }}>
                            {row.objective ? translateObjective(row.objective) : t('labels.not_set')}
                          </div>
                        </td>
                      )}
                      <td className="text-center">{row.impressions || "0"}</td>
                      <td className="text-center">{row.reach || "0"}</td>
                      <td className="text-center">{row.results || "0"}</td>
                      <td className="text-center">{row.quality || "0"}</td>
                      <td className="text-center">
                        {row.created_by?.full_name || row.created_by?.email || t('labels.not_set')}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="ads-action-btn ads-update-btn"
                            onClick={() => handleUpdate(row.id)}
                            title={t('management.update')}
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            className="ads-action-btn ads-archive-btn"
                            onClick={() => handleArchive(row.id)}
                            title={t('management.archive')}
                          >
                            <Archive size={14} />
                          </button>
                          <button
                            className="ads-action-btn ads-delete-btn"
                            onClick={() => handleDelete(row.id)}
                            title={t('management.delete')}
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
            // Refresh data after successful create/update (sync Facebook)
            handleRefresh();
          }}
          onDraftSaved={() => {
            // ✅ CHỈ FETCH LẠI TỪ DB (KHÔNG SYNC FACEBOOK)
            handleFetchOnly();
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

      {/* Progress Popup */}
      <ProgressPopup
        isOpen={progressState.isOpen}
        type={progressState.type}
        title={progressState.title}
        progress={progressState.progress}
        onClose={closeProgress}
      />
    </div>
  );
}

export default AdsManagement;