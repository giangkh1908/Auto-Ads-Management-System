import { useEffect } from 'react'
import { scrollToTop } from '../utils/scrollUtils'

/**
 * Custom hook để tự động cuộn lên đầu trang
 * @param {Array} dependencies - Mảng dependencies để theo dõi thay đổi
 * @param {Object} options - Tùy chọn cuộn
 * @param {boolean} enabled - Có bật tính năng cuộn hay không (mặc định: true)
 */
export const useScrollToTop = (dependencies = [], options = {}, enabled = true) => {
  useEffect(() => {
    if (enabled) {
      scrollToTop(options)
    }
  }, dependencies)
}

/**
 * Custom hook để cuộn lên đầu khi route thay đổi
 * @param {string} route - Route hiện tại
 * @param {Object} options - Tùy chọn cuộn
 */
export const useScrollOnRouteChange = (route, options = {}) => {
  useScrollToTop([route], options)
}

/**
 * Custom hook để cuộn lên đầu khi component mount
 * @param {Object} options - Tùy chọn cuộn
 * @param {boolean} enabled - Có bật tính năng cuộn hay không
 */
export const useScrollOnMount = (options = {}, enabled = true) => {
  useScrollToTop([], options, enabled)
}

/**
 * Custom hook để cuộn lên đầu khi có sự kiện cụ thể
 * @param {Function} trigger - Hàm trigger để kiểm tra khi nào cuộn
 * @param {Array} dependencies - Dependencies để theo dõi
 * @param {Object} options - Tùy chọn cuộn
 */
export const useScrollOnTrigger = (trigger, dependencies = [], options = {}) => {
  useEffect(() => {
    if (trigger && trigger()) {
      scrollToTop(options)
    }
  }, dependencies)
}
