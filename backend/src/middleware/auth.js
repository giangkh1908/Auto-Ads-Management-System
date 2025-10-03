import { verifyToken } from '../utils/jwt.js';
import User from '../models/User.js';

// Middleware xác thực token
export const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Token không được cung cấp'
            });
        }
        
        const token = authHeader.split(' ')[1];
        
        // Verify token
        const decoded = verifyToken(token);
        
        // Tìm user
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Token không hợp lệ'
            });
        }
        
        // Check if user is active
        if (user.status !== 'active') {
            return res.status(401).json({
                success: false,
                message: 'Tài khoản chưa được kích hoạt'
            });
        }
        
        req.user = user;
        next();
        
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Token không hợp lệ'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token đã hết hạn'
            });
        }
        
        console.error('Auth middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi xác thực'
        });
    }
};

// Middleware kiểm tra email đã được verify
export const requireEmailVerification = (req, res, next) => {
    if (!req.user.emailVerified) {
        return res.status(403).json({
            success: false,
            message: 'Vui lòng xác nhận email trước khi sử dụng tính năng này'
        });
    }
    next();
};