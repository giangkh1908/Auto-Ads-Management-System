import { verifyAccessToken } from '../utils/jwt.js';
import User from '../models/user/user.model.js';
import UserPackage from "../models/package/userPackage.model.js"
/**
 * 🧩 Middleware xác thực Access Token
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Token không được cung cấp.' });
    }

    const token = authHeader.split(' ')[1];

    // Verify JWT
    const decoded = verifyAccessToken(token);

    // Lấy thông tin user
    const user = await User.findById(decoded.id).select('-password -facebookAccessToken -facebookRefreshToken');

    if (!user || user.deleted_at) {
      return res.status(401).json({ success: false, message: 'Token không hợp lệ hoặc người dùng không tồn tại.' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Tài khoản chưa được kích hoạt hoặc đã bị khóa.' });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Vui lòng xác nhận email trước khi truy cập hệ thống.',
        code: 'EMAIL_NOT_VERIFIED',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Token không hợp lệ.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token đã hết hạn.' });
    }
    console.error('Auth middleware error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi xác thực hệ thống.' });
  }
};

/**
 * 🧩 Middleware xác thực Access Token cho SSE (từ query parameter)
 */
export const authenticateSSE = async (req, res, next) => {
  try {
    const token = req.query.token;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Token không được cung cấp.' });
    }

    // Verify JWT
    const decoded = verifyAccessToken(token);

    // Lấy thông tin user
    const user = await User.findById(decoded.id).select('-password -facebookAccessToken -facebookRefreshToken');

    if (!user || user.deleted_at) {
      return res.status(401).json({ success: false, message: 'Token không hợp lệ hoặc người dùng không tồn tại.' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Tài khoản chưa được kích hoạt hoặc đã bị khóa.' });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Vui lòng xác nhận email trước khi truy cập hệ thống.',
        code: 'EMAIL_NOT_VERIFIED',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Token không hợp lệ.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token đã hết hạn.' });
    }
    console.error('SSE Auth middleware error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi xác thực hệ thống.' });
  }
};

/**
 * Middleware kiểm tra email đã xác minh
 */
export const requireEmailVerification = (req, res, next) => {
  if (!req.user?.emailVerified) {
    return res.status(403).json({
      success: false,
      message: 'Vui lòng xác nhận email trước khi sử dụng tính năng này.',
      code: 'EMAIL_NOT_VERIFIED',
    });
  }
  next();
};

/**
 * Middleware kiểm tra quyền truy cập
 * @param {String} moduleName - Tên module (ví dụ: "campaign", "ads", "shop")
 * @param {String} action - Hành động cụ thể (ví dụ: "create", "update", "delete", "view")
 */
export const authorize = (moduleName, action) => {
  return async (req, res, next) => {
    try {
      // System Admin hoặc User đều cho phép pass qua, vì cơ chế phân quyền Role/Shop đã bị gỡ.
      // Dữ liệu sẽ được isolate dựa trên user_id ở controller.
      return next();
    } catch (error) {
      console.error('Authorization error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi kiểm tra phân quyền hệ thống.',
      });
    }
  };
};

/**
 * Middleware kiểm tra quyền truy cập trong shop cụ thể
 * @param {String} module - Tên module (ví dụ: "shop", "product")
 * @param {String} action - Hành động cụ thể (ví dụ: "create", "update", "delete", "view")
 */
export const authorizeInShop = (module, action) => {
  return async (req, res, next) => {
    try {
      // Bỏ qua kiểm tra Role / Shop (vì Shop đã bị gỡ), luôn cho phép next()
      next();
    } catch (error) {
      console.error("Authorization error:", error);
      return res.status(500).json({ 
        success: false,
        message: "Internal authorization error.",
        error: error.message 
      });
    }
  };
};

export const checkFeature = (feature) => {
  return async (req, res, next) => {
    try {
      const userPackage = await UserPackage.findOne({
        user_id: req.user._id,
        status: "active"
      }).populate("package_id");

      if (!userPackage) {
        return res.status(403).json({ message: "Không có gói dịch vụ" });
      }

      const hasFeature = userPackage.package_id.features.includes(feature);
      if (!hasFeature) {
        return res.status(403).json({ message: "Tính năng không khả dụng trong gói của bạn" });
      }

      req.subscription = userPackage; // truyền tiếp (giữ nguyên tên property cho đỡ ảnh hưởng chỗ khác)
      next();
    } catch (err) {
      res.status(500).json({ message: "Lỗi server" });
    }
  };
};

export const checkPackageLimit = (resource) => {
  return async (req, res, next) => {
    try {
      const userPackage = await UserPackage.findOne({
        user_id: req.user._id,
        status: "active",
      });

      if (!userPackage) {
        return res.status(403).json({ message: "Không có gói dịch vụ" });
      }

      const limit = userPackage[resource];
      let used = 0;

      if (resource === "shops") {
        used = 0; // Tính năng module shop đã bị gỡ
      } else if (resource === "employees") {
        used = 0; // Tính năng employee đã bị gỡ
      }

      if (used >= limit) {
        return res.status(403).json({
          message: `Đã đạt giới hạn ${resource}: ${used}/${limit}`,
        });
      }

      req.packageLimit = { limit, used };
      next();
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };
};