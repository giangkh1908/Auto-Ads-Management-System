# Luồng Đăng Nhập Internal (Email/Password)

## Tổng Quan
Luồng login internal bắt đầu từ hàm `login({ email, password })` trong component `LoginForm.jsx` và trải qua ba tầng chính: **Frontend UI → Hook AuthContext → Backend API**.

---

## 1. Frontend - LoginForm.jsx (Điểm Khởi Đầu)

### Điểm Khác Biệt Với Facebook Login
- **Internal Login**: Sử dụng email + password
- **Facebook Login**: Dùng Facebook SDK, sau đó gọi BE

### Quy Trình Trong `handleSubmit()`
```jsx
const result = await login({ email, password });
```

**Các bước thực hiện:**

1. **Validate Form** (Line 53-54)
   - Kiểm tra email không trống và format hợp lệ
   - Kiểm tra password không trống và độ dài >= 6 ký tự

2. **Clear Errors** (Line 57)
   - Xóa error message cũ trước khi submit

3. **Gọi Hook `useAuth().login()`** (Line 59)
   - Truyền `{ email, password }` 
   - Hàm này là async, trả về object result

4. **Xử Lý Response** (Line 61-74)

#### Case 1: Đăng Nhập Thành Công
```jsx
if (result.success) {
  if (onSuccess) onSuccess(); // Đóng modal
}
```

#### Case 2: Tài Khoản Bị Vô Hiệu/Cấm
```jsx
else if (result.showAccountStatusError && result.status) {
  setAccountStatus(result.status);
  setShowAccountStatusError(true);
  // → Hiển thị AccountStatusError component
}
```

#### Case 3: Email Chưa Xác Thực
```jsx
else if (result.requiresEmailVerification) {
  setUserEmail(email);
  setShowVerificationForm(true);
  // → Hiển thị EmailVerification component
}
```

#### Case 4: Lỗi Khác (403, 401, etc.)
```jsx
else if (result.error) {
  const errorMessage = result.error || t("auth.login_failed");
  setErrors({ submit: errorMessage });
  // → Hiển thị error message trong form
}
```

---

## 2. Custom Hook - AuthContext.jsx

### Hàm `login()` - Chi Tiết Xử Lý

#### Bước 1: Gọi Service API
```javascript
const result = await login({ email, password });
```
→ Gọi `authService.login(credentials)` (trong services/auth/authService.js)

#### Bước 2: Kiểm Tra Response Success
Nếu BE trả về `success: true`:

**2a. Kiểm Tra Email Verification**
```javascript
const { user, tokens, requiresEmailVerification } = response.data

if (requiresEmailVerification || !user.emailVerified) {
  // Email chưa verify
  localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
  setUser(user);
  setIsAuthenticated(false); // ← Chưa đăng nhập thực sự
  
  return {
    success: false,
    error: 'Email chưa được xác nhận',
    requiresEmailVerification: true,
    user
  }
}
```

**2b. Lưu Tokens & User Data**
```javascript
localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, tokens.accessToken);
localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));

// Xóa FB pages nếu có (login internal)
localStorage.removeItem(STORAGE_KEYS.FB_PAGES);
setFbPages([]);
```

**2c. Lấy Thông Tin Shop (Nếu Cần)**
```javascript
let finalUser = user;
if (!user.internal_role) {
  // Chỉ lấy shop_id nếu user không phải admin/internal
  const userWithShop = await refreshUserWithShopId();
  finalUser = userWithShop || user;
}

setUser(finalUser);
setIsAuthenticated(true);
```

**2d. Điều Hướng (Navigate)**
```javascript
setTimeout(() => {
  if (redirectTo) {
    navigate(redirectTo); // Custom redirect
  } else {
    const internalRole = finalUser?.internal_role;
    
    if (internalRole) {
      // Admin -> Chuyển tới trang admin tương ứng
      const adminRoute = getDefaultAdminRoute(internalRole);
      navigate(adminRoute);
    } else {
      // User bình thường -> Dashboard
      navigate(ROUTES.DASHBOARD);
    }
  }
}, 1000);

return { success: true, user };
```

#### Bước 3: Xử Lý Lỗi từ Backend

**3a. Tài Khoản Bị Vô Hiệu/Cấm**
```javascript
const errorCode = errorResponse?.error?.code;
const status = errorResponse?.status;

if (errorCode === 'AUTH_010' || errorCode === 'AUTH_011') {
  return {
    success: false,
    error: errorResponse?.error?.message,
    errorCode,
    status,
    showAccountStatusError: true // ← Hiển thị AccountStatusError component
  }
}
```

**3b. Lỗi Khác**
```javascript
toast.error(errorMessage);
return { 
  success: false, 
  error: errorMessage, 
  errorCode, 
  status 
}
```

---

## 3. Service Layer - authService.js

### Hàm `login(credentials)`

```javascript
async login(credentials) {
  try {
    // POST tới /api/auth/login
    const response = await axiosInstance.post(
      API_ENDPOINTS.AUTH.LOGIN,
      credentials // { email, password }
    );
    const data = response.data;

    // Lưu vào localStorage (backup, chủ yếu là AuthContext)
    if (data?.data?.tokens?.accessToken) {
      localStorage.setItem("accessToken", data.data.tokens.accessToken);
      localStorage.setItem("refreshToken", data.data.tokens.refreshToken);
      localStorage.setItem("user_data", JSON.stringify(data.data.user));
    }

    return data; // Trả về toàn bộ response
  } catch (error) {
    throw this.handleError(error);
  }
}
```

---

## 4. Backend API - authControllers.js (`POST /api/auth/login`)

### Hàm `login()` - Chi Tiết Server-Side

#### Bước 1: Kiểm Tra Email
```javascript
const user = await User.findOne({ email }).select("+password");
if (!user) {
  // Log thất bại
  await saveSystemLog({
    category: 'security',
    level: 'warning',
    action: 'LOGIN_FAILED',
    description: `Email không tồn tại (${email})`,
    // ...
  });
  
  return res.status(401).json({
    success: false,
    message: "Email hoặc mật khẩu không chính xác."
  });
}
```

#### Bước 2: So Sánh Password (Bcrypt)
```javascript
const match = await bcrypt.compare(password, user.password);
if (!match) {
  // Log thất bại
  await saveSystemLog({
    category: 'security',
    level: 'warning',
    action: 'LOGIN_FAILED',
    description: `Mật khẩu không đúng cho user ${user.email}`,
    user_id: user._id,
    // ...
  });
  
  return res.status(401).json({
    success: false,
    message: "Email hoặc mật khẩu không chính xác."
  });
}
```

#### Bước 3: Kiểm Tra Status

**3a. Inactive Account**
```javascript
if (user.status === "inactive") {
  return res.status(403).json({
    success: false,
    error: {
      code: ErrorCode.AUTH_010,
      message: "Tài khoản đã bị vô hiệu hoá"
    },
    status: 'inactive'
  });
}
```

**3b. Banned Account**
```javascript
if (user.status === "banned") {
  return res.status(403).json({
    success: false,
    error: {
      code: ErrorCode.AUTH_011,
      message: "Tài khoản đã bị cấm"
    },
    status: 'banned'
  });
}
```

**3c. Pending Account**
```javascript
if (user.status !== "active") {
  return res.status(403).json({
    success: false,
    message: "Tài khoản chưa được kích hoạt."
  });
}
```

#### Bước 4: Tạo JWT Tokens & Cập Nhật Last Login
```javascript
const { accessToken, refreshToken } = generateTokens(user._id);
user.last_login_at = Date.now();
await user.save();
user.password = undefined; // Không gửi password về

// Log thành công
await saveSystemLog({
  category: 'auth',
  level: 'success',
  action: 'USER_LOGIN',
  user_id: user._id,
  // ...
  success: true
});

return res.status(200).json({
  success: true,
  message: "Đăng nhập thành công!",
  data: {
    user,
    tokens: { accessToken, refreshToken }
  }
});
```

---

## 5. Diagram Luồng

```
┌─────────────────────────────────────────────────────────────┐
│ 1. LoginForm.jsx - handleSubmit()                           │
│    • validateForm() → Kiểm tra email/password               │
│    • setErrors({}) → Clear errors                           │
│    • const result = await login({ email, password })        │
│    • Xử lý 4 cases: success/accountStatus/verify/error      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. AuthContext.jsx - login()                                │
│    • Gọi authService.login(credentials)                     │
│    • Nếu success:                                           │
│      - Check emailVerified (yes? lưu tokens)                │
│      - Lưu tokens & user data vào localStorage              │
│      - Lấy shop_id nếu user không phải admin                │
│      - navigate() dựa trên role                             │
│    • Nếu error:                                             │
│      - AUTH_010/011 (inactive/banned)                       │
│      - Lỗi khác (401/403)                                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. authService.js - login()                                 │
│    • POST to /api/auth/login with { email, password }       │
│    • Lưu tokens vào localStorage (backup)                   │
│    • Return response                                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Backend API - POST /api/auth/login                       │
│    • findOne({ email }) - kiểm tra user                     │
│    • bcrypt.compare() - kiểm tra password                   │
│    • Check user.status (inactive/banned/pending/active)     │
│    • generateTokens() - tạo JWT                             │
│    • saveSystemLog() - log thao tác                         │
│    • Return tokens + user                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Error Codes & Status

### Backend Error Codes
| Code | Meaning | HTTP | Action |
|------|---------|------|--------|
| AUTH_010 | Tài khoản bị vô hiệu | 403 | Hiển thị AccountStatusError |
| AUTH_011 | Tài khoản bị cấm | 403 | Hiển thị AccountStatusError |
| (none) | Email/Password sai | 401 | Hiển thị error message |
| (none) | Tài khoản chưa active | 403 | Hiển thị error message |

### User Status
- `active` ✅ Có thể login
- `inactive` ❌ Cần xác thực từ AccountStatusError
- `banned` ❌ Cần xác thực từ AccountStatusError
- `pending` ❌ Email chưa xác thực

---

## 7. Key Points

### Email Verification Flow
- User đăng ký → Status = `pending`, emailVerified = false
- Login → BE kiểm tra `emailVerified`
- Nếu false → Return `requiresEmailVerification: true`
- Frontend hiển thị `EmailVerification` component
- User xác thực email → Status = `active`, emailVerified = true
- Login lại → Thành công

### Password Security
- Frontend: Gửi plaintext password
- Backend: Dùng bcrypt để hash + compare
- JWT: Access token lưu user id, không chứa password

### Navigation Logic
```javascript
if (user.internal_role) {
  // Admin/Staff -> /admin/dashboard, /admin/users, etc.
  navigate(getDefaultAdminRoute(internal_role));
} else {
  // Shop Owner -> /dashboard
  navigate(ROUTES.DASHBOARD);
}
```

### localStorage Keys
```javascript
STORAGE_KEYS.AUTH_TOKEN       // "accessToken"
STORAGE_KEYS.REFRESH_TOKEN    // "refreshToken"
STORAGE_KEYS.USER_DATA        // "user_data"
STORAGE_KEYS.FB_PAGES         // "fbPages" (cleared on internal login)
STORAGE_KEYS.FB_AD_ACCOUNTS   // "fbAdAccounts"
```

---

## 8. Comparison: Internal vs Facebook Login

| Aspect | Internal | Facebook |
|--------|----------|----------|
| Credentials | Email + Password | Facebook Access Token |
| Validation | Bcrypt compare | FB Graph API verify |
| Frontend | Email/Password form | Facebook SDK dialog |
| Pages | None (internal) | Lấy từ FB Graph API |
| First Time | Requires email verify | Auto-created |
| Route | POST /api/auth/login | POST /api/auth/facebook |

