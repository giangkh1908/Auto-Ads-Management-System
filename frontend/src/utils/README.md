# Scroll Utilities

Bộ công cụ quản lý cuộn trang cho ứng dụng React.

## Cấu trúc thư mục

```
utils/
├── scrollUtils.js          # Các hàm tiện ích cuộn trang
├── scrollConstants.js      # Hằng số cấu hình
├── index.js               # Export tất cả utilities
└── README.md              # Tài liệu hướng dẫn
```

## Cách sử dụng

### 1. Import utilities

```javascript
import { 
  scrollToTop, 
  scrollToPosition, 
  scrollToElement,
  SCROLL_OPTIONS 
} from './utils'
```

### 2. Sử dụng các hàm cuộn

```javascript
// Cuộn lên đầu trang
scrollToTop()

// Cuộn với tùy chọn tùy chỉnh
scrollToTop({ top: 0, left: 0, behavior: 'smooth' })

// Cuộn đến vị trí cụ thể
scrollToPosition(500, 0, 'smooth')

// Cuộn đến element
scrollToElement('#header')
```

### 3. Sử dụng custom hooks

```javascript
import { useScrollOnMount, useScrollOnRouteChange } from './utils'

function MyComponent() {
  const [route, setRoute] = useState('home')
  
  // Cuộn lên đầu khi component mount
  useScrollOnMount(SCROLL_OPTIONS.SMOOTH_TO_TOP)
  
  // Cuộn lên đầu khi route thay đổi
  useScrollOnRouteChange(route, SCROLL_OPTIONS.SMOOTH_TO_TOP)
  
  return <div>...</div>
}
```

## API Reference

### scrollUtils.js

#### scrollToTop(options)
Cuộn lên đầu trang với hiệu ứng smooth.

**Parameters:**
- `options` (Object): Tùy chọn cuộn
  - `top` (number): Vị trí cuộn từ trên xuống (mặc định: 0)
  - `left` (number): Vị trí cuộn từ trái sang (mặc định: 0)
  - `behavior` (string): Hiệu ứng cuộn (mặc định: 'smooth')

#### scrollToPosition(top, left, behavior)
Cuộn đến vị trí cụ thể trên trang.

#### scrollToElement(element, options)
Cuộn đến một element cụ thể.

### Custom Hooks

#### useScrollOnMount(options, enabled)
Cuộn lên đầu khi component mount.

#### useScrollOnRouteChange(route, options)
Cuộn lên đầu khi route thay đổi.

#### useScrollOnTrigger(trigger, dependencies, options)
Cuộn lên đầu khi có sự kiện trigger.

## Constants

### SCROLL_OPTIONS
- `SMOOTH_TO_TOP`: Cuộn mượt mà lên đầu trang
- `INSTANT_TO_TOP`: Cuộn ngay lập tức lên đầu trang
- `SMOOTH_TO_MIDDLE`: Cuộn mượt mà đến giữa trang

### SCROLL_INTO_VIEW_OPTIONS
- `TO_START`: Cuộn đến đầu element
- `TO_CENTER`: Cuộn đến giữa element
- `TO_END`: Cuộn đến cuối element
