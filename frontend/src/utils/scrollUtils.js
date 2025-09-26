/**
 * Scroll Utilities
 * Các hàm tiện ích để quản lý cuộn trang
 */

/**
 * Cuộn lên đầu trang với hiệu ứng smooth
 * @param {Object} options - Tùy chọn cuộn
 * @param {number} options.top - Vị trí cuộn từ trên xuống (mặc định: 0)
 * @param {number} options.left - Vị trí cuộn từ trái sang (mặc định: 0)
 * @param {string} options.behavior - Hiệu ứng cuộn: 'smooth', 'instant', 'auto' (mặc định: 'smooth')
 */
export const scrollToTop = (options = {}) => {
  const defaultOptions = {
    top: 0,
    left: 0,
    behavior: 'smooth'
  }
  
  const scrollOptions = { ...defaultOptions, ...options }
  window.scrollTo(scrollOptions)
}

/**
 * Cuộn đến vị trí cụ thể trên trang
 * @param {number} top - Vị trí cuộn từ trên xuống
 * @param {number} left - Vị trí cuộn từ trái sang (mặc định: 0)
 * @param {string} behavior - Hiệu ứng cuộn (mặc định: 'smooth')
 */
export const scrollToPosition = (top, left = 0, behavior = 'smooth') => {
  window.scrollTo({ top, left, behavior })
}

/**
 * Cuộn đến một element cụ thể
 * @param {string|HTMLElement} element - Selector CSS hoặc HTMLElement
 * @param {Object} options - Tùy chọn cuộn
 */
export const scrollToElement = (element, options = {}) => {
  const defaultOptions = {
    behavior: 'smooth',
    block: 'start',
    inline: 'nearest'
  }
  
  const scrollOptions = { ...defaultOptions, ...options }
  
  if (typeof element === 'string') {
    const el = document.querySelector(element)
    if (el) {
      el.scrollIntoView(scrollOptions)
    }
  } else if (element && element.scrollIntoView) {
    element.scrollIntoView(scrollOptions)
  }
}

/**
 * Cuộn lên đầu trang ngay lập tức (không có hiệu ứng)
 */
export const scrollToTopInstant = () => {
  window.scrollTo(0, 0)
}

/**
 * Kiểm tra xem có đang ở đầu trang không
 * @returns {boolean} true nếu đang ở đầu trang
 */
export const isAtTop = () => {
  return window.pageYOffset === 0
}

/**
 * Lấy vị trí cuộn hiện tại
 * @returns {Object} {x, y} - Vị trí cuộn hiện tại
 */
export const getScrollPosition = () => {
  return {
    x: window.pageXOffset,
    y: window.pageYOffset
  }
}
