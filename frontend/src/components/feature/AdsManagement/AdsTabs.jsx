import { Archive, Trash } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

/**
 * Tabs component for Ads Management
 * Shows campaigns, adsets, and ads tabs with action buttons
 */
export default function AdsTabs({
  activeTab,
  onTabChange,
  hasSelectedItems,
  onArchive,
  onDelete,
}) {
  const { t } = useTranslation(['ads']);

  const tabs = [
    { id: "campaigns", label: t('management.campaigns_tab'), symbol: "▦" },
    { id: "adsets", label: t('management.adsets_tab'), symbol: "▣" },
    { id: "ads", label: t('management.ads_tab'), symbol: "▥" },
  ];

  return (
    <div className="ads-tabs">
      <div className="tabs-container">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => onTabChange(tab.id)}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="active-tab"
                className="active-pill"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="tab-symbol">{tab.symbol}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      {hasSelectedItems && (
        <div className="icon-beside-tab">
          <button
            className="ads-action-btn ads-archive-btn"
            onClick={onArchive}
            title="Lưu trữ"
          >
            <Archive size={15} />
          </button>
          <button
            className="ads-action-btn ads-delete-btn"
            onClick={onDelete}
            title="Xóa"
          >
            <Trash size={15} />
          </button>
        </div>
      )}
    </div>
  );
}

