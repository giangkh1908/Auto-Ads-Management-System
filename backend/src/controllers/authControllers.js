import User from '../models/User.js';
import { generateTokens } from '../utils/jwt.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/emailService.js';
import crypto from 'crypto';

// Đăng ký
export const register = async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;
        
        // Kiểm tra xem có điền đầy đủ thông tin bắt buộc không
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ thông tin bắt buộc'
            });
        }
        
        // Kiểm tra xem email đã tồn tại chưa
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false, 
                message: 'Email này đã được đăng ký. Vui lòng sử dụng email khác'
            });
        }
        
        // Tạo người dùng mới
        const user = new User({
            name,
            email,
            password,
            phone
        });
        
        // Tạo token xác nhận email
        const verificationToken = user.createEmailVerificationToken();
        
        await user.save();
        
        // Gửi email xác nhận
        try {
            await sendVerificationEmail(email, name, verificationToken);
        } catch (emailError) {
            console.error('Gửi Email thất bại:', emailError);
            // Không return error để user vẫn được tạo thành công
        }
        
        res.status(201).json({
            success: true,
            message: `Đăng ký thành công. Vui lòng kiểm tra email để xác nhận tài khoản.`,
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    status: user.status
                }
            }
        });
        
    } catch (error) {
        console.error('Lỗi đăng ký:', error);
        
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', ')
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống, vui lòng thử lại sau'
        });
    }
};

// Đăng nhập
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Kiểm tra xem có điền đầy đủ thông tin bắt buộc không
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập email và mật khẩu'
            });
        }
        
        // Tìm người dùng và bao gồm password
        const user = await User.findOne({ email }).select('+password');
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Email hoặc mật khẩu không chính xác'
            });
        }
        
        // Kiểm tra xem tài khoản có bị khóa không
        if (user.isLocked) {
            return res.status(423).json({
                success: false,
                message: 'Tài khoản đã bị khóa do quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau.'
            });
        }
        
        // Kiểm tra xem mật khẩu có chính xác không
        const isPasswordValid = await user.comparePassword(password);
        
        if (!isPasswordValid) {
            await user.incLoginAttempts();
            return res.status(401).json({
                success: false,
                message: 'Email hoặc mật khẩu không chính xác'
            });
        }
        
        // Reset lại số lần đăng nhập thất bại
        if (user.loginAttempts > 0) {
            await user.resetLoginAttempts();
        }
        
        // Tạo token
        const { accessToken, refreshToken } = generateTokens(user._id);
        
        // Remove password from response
        user.password = undefined;
        
        res.status(200).json({
            success: true,
            message: `Chào mừng bạn trở lại, ${user.name}!`,
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    status: user.status,
                    emailVerified: user.emailVerified,
                    profile: user.profile
                },
                tokens: {
                    accessToken,
                    refreshToken
                }
            }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống, vui lòng thử lại sau'
        });
    }
};

// Xác nhận email
export const verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;
        
        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Token xác nhận không hợp lệ'
            });
        }
        
        // Hash token để so sánh
        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');
        
        // Tìm người dùng với token hợp lệ
        const user = await User.findOne({
            emailVerificationToken: hashedToken,
            emailVerificationExpires: { $gt: Date.now() }
        });
        
        if (!user) {
            // Kiểm tra xem token hết hạn chưa?
            const expiredUser = await User.findOne({
                emailVerificationToken: hashedToken
            });
            
            if (expiredUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Liên kết xác nhận đã hết hạn. Vui lòng yêu cầu gửi lại email xác nhận.',
                    code: 'TOKEN_EXPIRED'
                });
            }
            
            // Kiểm tra xem người dùng đã được xác nhận chưa (token đã được sử dụng và đã bị xóa)
            const verifiedUser = await User.findOne({
                email: { $exists: true },
                emailVerified: true,
                emailVerificationToken: { $exists: false }
            });
            
            if (verifiedUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Liên kết xác nhận đã được sử dụng. Tài khoản đã được kích hoạt.',
                    code: 'TOKEN_ALREADY_USED'
                });
            }
            
            return res.status(400).json({
                success: false,
                message: 'Liên kết xác nhận không hợp lệ.',
                code: 'TOKEN_INVALID'
            });
        }
        
        // Cập nhật user
        user.emailVerified = true;
        user.status = 'active';
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        
        await user.save();
        
        // Tạo token cho auto-login
        const { accessToken, refreshToken } = generateTokens(user._id);
        
        // Xóa password khỏi response
        const userResponse = {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            status: user.status,
            emailVerified: user.emailVerified,
            profile: user.profile
        };
        
        res.status(200).json({
            success: true,
            message: 'Xác nhận email thành công! Tài khoản của bạn đã được kích hoạt.',
            data: {
                user: userResponse,
                tokens: {
                    accessToken,
                    refreshToken
                }
            }
        });
        
    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống, vui lòng thử lại sau'
        });
    }
};

// Gửi lại email xác nhận
export const resendVerificationEmail = async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp email'
            });
        }
        
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy tài khoản với email này'
            });
        }
        
        if (user.emailVerified) {
            return res.status(400).json({
                success: false,
                message: 'Email đã được xác nhận'
            });
        }
        
        // Tạo token xác nhận email mới
        const verificationToken = user.createEmailVerificationToken();
        await user.save();
        
        // Gửi email xác nhận
        await sendVerificationEmail(email, user.name, verificationToken);
        
        res.status(200).json({
            success: true,
            message: 'Email xác nhận đã được gửi lại! Vui lòng kiểm tra hộp thư.'
        });
        
    } catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống, vui lòng thử lại sau'
        });
    }
};

// Quên mật khẩu
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp email'
            });
        }
        
        const user = await User.findOne({ email });
        
        if (!user) {
            // Không tiết lộ thông tin user có tồn tại hay không
            return res.status(200).json({
                success: true,
                message: 'Email đặt lại mật khẩu đã được gửi! Vui lòng kiểm tra hộp thư.'
            });
        }
        
        // Tạo token đặt lại mật khẩu
        const resetToken = user.createPasswordResetToken();
        await user.save({ validateBeforeSave: false });
        
        // Gửi email đặt lại mật khẩu
        try {
            await sendPasswordResetEmail(email, user.name, resetToken);
        } catch (emailError) {
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user.save({ validateBeforeSave: false });
            
            return res.status(500).json({
                success: false,
                message: 'Có lỗi khi gửi email. Vui lòng thử lại sau.'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Email đặt lại mật khẩu đã được gửi! Vui lòng kiểm tra hộp thư.'
        });
        
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống, vui lòng thử lại sau'
        });
    }
};

// Đặt lại mật khẩu
export const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        if (!token || !password) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu mới là bắt buộc'
            });
        }
        
        // Lấy user với password cũ
        const user = await User.findById(req.user.id).select('+password');
        
        // Kiểm tra xem mật khẩu mới có trùng với mật khẩu cũ không
        const isCurrentPasswordValid = await user.comparePassword(password);

        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu mới không được trùng với mật khẩu cũ'
            });
        }

        // Hash token
        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');
        
        // Tìm người dùng với token đặt lại mật khẩu hợp lệ
        user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() }
        });
                    
        if (!user) {
            // Kiểm tra xem token có tồn tại nhưng hết hạn chưa?
            const expiredUser = await User.findOne({
                passwordResetToken: hashedToken
            });
            
            if (expiredUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Liên kết đặt lại mật khẩu đã hết hạn. Vui lòng yêu cầu đặt lại mật khẩu mới.',
                    code: 'TOKEN_EXPIRED'
                });
            }
            
            return res.status(400).json({
                success: false,
                message: 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã được sử dụng.',
                code: 'TOKEN_INVALID'
            });
        }
        
        // Cập nhật mật khẩu mới
        user.password = password;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        
        // Reset lại số lần đăng nhập thất bại
        user.loginAttempts = 0;
        user.lockUntil = undefined;
        
        await user.save();
        
        res.status(200).json({
            success: true,
            message: 'Đặt lại mật khẩu thành công'
        });
        
    } catch (error) {
        console.error('Reset password error:', error);
        
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', ')
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống, vui lòng thử lại sau'
        });
    }
};

// Đổi mật khẩu (khi đã đăng nhập)
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp mật khẩu hiện tại và mật khẩu mới'
            });
        }
        
        // Lấy user với password
        const user = await User.findById(req.user.id).select('+password');
        
        // Kiểm tra xem mật khẩu hiện tại có chính xác không
        const isCurrentPasswordValid = await user.comparePassword(currentPassword);
        
        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu hiện tại không chính xác'
            });
        }
        
        // Cập nhật mật khẩu
        user.password = newPassword;
        await user.save();
        
        res.status(200).json({
            success: true,
            message: 'Đổi mật khẩu thành công'
        });
        
    } catch (error) {
        console.error('Change password error:', error);
        
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', ')
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống, vui lòng thử lại sau'
        });
    }
};

// Lấy thông tin user hiện tại
export const getCurrentUser = async (req, res) => {
    try {
        const user = req.user;
        
        res.status(200).json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    status: user.status,
                    emailVerified: user.emailVerified,
                    profile: user.profile,
                    created_at: user.created_at,
                    updated_at: user.updated_at
                }
            }
        });
        
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống, vui lòng thử lại sau'
        });
    }
};
