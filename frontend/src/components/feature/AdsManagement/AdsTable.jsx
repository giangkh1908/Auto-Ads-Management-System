import { useState, useRef } from "react";
import { Edit, Archive, Trash, Files, LayoutGrid, Megaphone } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { translateStatus, getStatusClass } from "../../../utils/formatters/statusUtils";
import { translateOptimizationGoal, formatTargetingVN } from "../../../utils/formatters/translationUtils";
import Pagination from "../../common/Pagination/Pagination";

/**
 * Table component for Ads Management
 * Renders campaigns, adsets, or ads based on activeTab
 */
export default function AdsTable({
  activeTab,
  rows,
  checkAll,
  onCheckAll,
  onCheckItem,
  onToggleRow,
  togglingItems,
  onUpdate,
  onArchive,
  onDelete,
  onCampaignClick,
  onAdsetClick,
  pagination,
  onPageChange,
  onItemsPerPageChange,
  refreshing,
}) {
  const { t } = useTranslation(['ads']);
  const [columnWidths, setColumnWidths] = useState({});
  const resizingRef = useRef({ colIndex: null, startX: 0, startWidth: 0 });

  const onMouseDown = (e, index) => {
    const th = e.target.parentElement;
    resizingRef.current = {
      colIndex: index,
      startX: e.pageX,
      startWidth: th.offsetWidth,
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const onMouseMove = (e) => {
    const { colIndex, startX, startWidth } = resizingRef.current;
    if (colIndex === null) return;

    const newWidth = Math.max(50, startWidth + (e.pageX - startX));
    setColumnWidths((prev) => ({
      ...prev,
      [colIndex]: newWidth,
    }));
  };

  const onMouseUp = () => {
    resizingRef.current.colIndex = null;
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
    document.body.style.cursor = "default";
    document.body.style.userSelect = "auto";
  };

  const getColSpan = () => {
    if (activeTab === "adsets") return 12;
    return 10;
  };

  const getColStyle = (index) => {
    // Checkbox column is fixed to 50px
    if (index === 0) {
      return { width: '50px', minWidth: '50px', maxWidth: '50px', textAlign: 'center' };
    }
    // Toggle On/Off column is fixed to 81px
    if (index === 1) {
      return { width: '81px', minWidth: '81px', maxWidth: '81px', textAlign: 'center' };
    }
    if (columnWidths[index]) {
      return { width: `${columnWidths[index]}px`, minWidth: `${columnWidths[index]}px` };
    }
    return {};
  };

  const renderHeaderWithResizer = (label, index) => (
    <th style={getColStyle(index)}>
      <div className="th-content">{label}</div>
      {/* Don't render resizer for fixed columns (Checkbox: 0, Toggle: 1) */}
      {index !== 0 && index !== 1 && (
        <div
          className="resizer"
          onMouseDown={(e) => onMouseDown(e, index)}
        />
      )}
    </th>
  );

  return (
    <>
      <div className="ads-table-wrapper">
        <table className="ads-table">
          <thead>
            <tr>
              <th style={getColStyle(0)}>
                <input
                  type="checkbox"
                  checked={checkAll}
                  onChange={onCheckAll}
                />
              </th>
              {renderHeaderWithResizer(t('management.toggle_on_off'), 1)}
              {renderHeaderWithResizer(t('management.name'), 2)}
              {renderHeaderWithResizer(t('management.status'), 3)}
              {renderHeaderWithResizer(t('management.budget'), 4)}
              {activeTab === "adsets" && renderHeaderWithResizer(t('management.runtime'), 5)}
              {activeTab === "adsets" && renderHeaderWithResizer(t('management.targeting'), 6)}
              {renderHeaderWithResizer(t('management.impressions'), 7)}
              {renderHeaderWithResizer(t('management.reach'), 8)}
              {renderHeaderWithResizer(t('management.results'), 9)}
              {renderHeaderWithResizer('Spend', 10)}
              <th style={{ width: '120px', minWidth: '120px', textAlign: 'center' }}>{t('management.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={getColSpan()}>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="ads-empty-state"
                  >
                    {activeTab === "campaigns" ? (
                      <Megaphone size={48} />
                    ) : activeTab === "adsets" ? (
                      <LayoutGrid size={48} />
                    ) : (
                      <Files size={48} />
                    )}
                    <p>{t('management.no_data')}</p>
                  </motion.div>
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.id}>
                <td style={getColStyle(0)}>
                  <input
                    type="checkbox"
                    checked={row.isChecked}
                    onChange={() => onCheckItem(row.id)}
                  />
                </td>
                <td style={getColStyle(1)}>
                  <button
                    type="button"
                    className={`switch ${row.enabled ? "on" : "off"} ${togglingItems.has(row.id) ? "loading" : ""
                      }`}
                    aria-pressed={row.enabled}
                    onClick={() => onToggleRow(row.id)}
                    disabled={togglingItems.has(row.id)}
                  />
                </td>
                <td style={getColStyle(2)}>
                  <span
                    className={`name-text ${activeTab === "ads"
                      ? "ad-name"
                      : "clickable"
                      }`}
                    onClick={() => {
                      if (activeTab === "campaigns")
                        onCampaignClick(row);
                      else if (activeTab === "adsets")
                        onAdsetClick(row);
                    }}
                  >
                    {row.name}
                  </span>
                </td>
                <td className={`${getStatusClass(row.status)} text-center`} style={getColStyle(3)}>
                  {translateStatus(row.status)}
                </td>
                <td className="text-center" style={getColStyle(4)}>{row.budget || "0"}</td>
                {activeTab === "adsets" && (
                  <td className="text-center" style={getColStyle(5)}>
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
                  <td className="text-center" style={getColStyle(6)}>
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
                <td className="text-center" style={getColStyle(7)}>{row.impressions || "0"}</td>
                <td className="text-center" style={getColStyle(8)}>{row.reach || "0"}</td>
                <td className="text-center" style={getColStyle(9)}>{row.results || "0"}</td>
                <td className="text-center" style={getColStyle(10)}>{row.spend ? new Intl.NumberFormat('vi-VN').format(row.spend) : "0"}</td>
                <td style={{ width: '120px', minWidth: '120px', textAlign: 'center' }}>
                  <div className="action-buttons">
                    <button
                      className="ads-action-btn ads-update-btn"
                      onClick={() => onUpdate(row.id)}
                      title={t('management.update')}
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      className="ads-action-btn ads-archive-btn"
                      onClick={() => onArchive(row.id)}
                      title={t('management.archive')}
                    >
                      <Archive size={14} />
                    </button>
                    <button
                      className="ads-action-btn ads-delete-btn"
                      onClick={() => onDelete(row.id)}
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
      </div>

      {/* Pagination */}
      {rows.length > 0 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          itemsPerPage={pagination.limit}
          totalItems={pagination.total}
          startIndex={(pagination.page - 1) * pagination.limit}
          endIndex={Math.min(pagination.page * pagination.limit, pagination.total)}
          onPageChange={onPageChange}
          onItemsPerPageChange={onItemsPerPageChange}
          disabled={refreshing}
        />
      )}
    </>
  );
}

