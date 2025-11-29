import React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import "./Pagination.css";

/**
 * Reusable Pagination Component
 * @param {number} currentPage - Current page number (1-based)
 * @param {number} totalPages - Total number of pages
 * @param {number} totalItems - Total number of items
 * @param {number} pageSize - Number of items per page
 * @param {Function} onPageChange - Callback when page changes (page) => {}
 * @param {Function} onPageSizeChange - Callback when page size changes (size) => {}
 * @param {Array<number>} pageSizeOptions - Options for page size selector (default: [25, 50, 75, 100])
 */
const Pagination = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [25, 50, 75, 100],
}) => {
  // Generate page numbers to display
  const getPageNumbers = () => {
    const delta = 2; // Number of pages to show on each side of current page
    const range = [];
    const rangeWithDots = [];
    let l;

    range.push(1);

    if (totalPages <= 1) return [1];

    for (let i = currentPage - delta; i <= currentPage + delta; i++) {
      if (i < totalPages && i > 1) {
        range.push(i);
      }
    }
    range.push(totalPages);

    for (let i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push("...");
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  const handlePageSizeChange = (e) => {
    const newSize = parseInt(e.target.value, 10);
    onPageSizeChange(newSize);
  };

  if (totalItems === 0) return null;

  return (
    <div className="amu-pagination-container">
      <div className="amu-pagination-info">
        <span>Hiển thị</span>
        <select
          className="amu-pagination-size-select"
          value={pageSize}
          onChange={handlePageSizeChange}
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
        <span>
          bản ghi / trang. Tổng số: <strong>{totalItems}</strong> bản ghi
        </span>
      </div>

      <div className="amu-pagination-controls">
        <button
          className="amu-pagination-btn"
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
          title="Trang đầu"
        >
          <ChevronsLeft size={16} />
        </button>
        <button
          className="amu-pagination-btn"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          title="Trang trước"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="amu-pagination-pages">
          {getPageNumbers().map((page, index) => (
            <button
              key={index}
              className={`amu-pagination-page-btn ${page === currentPage ? "active" : ""
                } ${page === "..." ? "dots" : ""}`}
              onClick={() => typeof page === "number" && handlePageChange(page)}
              disabled={page === "..."}
            >
              {page}
            </button>
          ))}
        </div>

        <button
          className="amu-pagination-btn"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          title="Trang sau"
        >
          <ChevronRight size={16} />
        </button>
        <button
          className="amu-pagination-btn"
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
          title="Trang cuối"
        >
          <ChevronsRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
