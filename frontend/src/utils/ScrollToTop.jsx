import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Component tự động cuộn lên đầu khi route thay đổi
 * Đơn giản và hiệu quả
 */
function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    // Cuộn lên đầu trang mỗi khi route thay đổi
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

export default ScrollToTop
