/**
 * Scroll Constants
 * Các hằng số cấu hình cho tính năng cuộn trang
 */

// Các tùy chọn cuộn mặc định
export const SCROLL_OPTIONS = {
  // Cuộn mượt mà lên đầu trang
  SMOOTH_TO_TOP: {
    top: 0,
    left: 0,
    behavior: 'smooth'
  },
  
  // Cuộn ngay lập tức lên đầu trang
  INSTANT_TO_TOP: {
    top: 0,
    left: 0,
    behavior: 'instant'
  },
  
  // Cuộn mượt mà đến vị trí giữa trang
  SMOOTH_TO_MIDDLE: {
    top: window.innerHeight / 2,
    left: 0,
    behavior: 'smooth'
  }
}

// Các tùy chọn scrollIntoView
export const SCROLL_INTO_VIEW_OPTIONS = {
  // Cuộn đến đầu element
  TO_START: {
    behavior: 'smooth',
    block: 'start',
    inline: 'nearest'
  },
  
  // Cuộn đến giữa element
  TO_CENTER: {
    behavior: 'smooth',
    block: 'center',
    inline: 'center'
  },
  
  // Cuộn đến cuối element
  TO_END: {
    behavior: 'smooth',
    block: 'end',
    inline: 'nearest'
  }
}

// Các selector CSS thường dùng
export const SCROLL_SELECTORS = {
  TOP: 'html',
  HEADER: 'header',
  MAIN: 'main',
  FOOTER: 'footer'
}

// Các event scroll
export const SCROLL_EVENTS = {
  SCROLL_TO_TOP: 'scrollToTop',
  SCROLL_TO_ELEMENT: 'scrollToElement',
  SCROLL_TO_POSITION: 'scrollToPosition'
}
