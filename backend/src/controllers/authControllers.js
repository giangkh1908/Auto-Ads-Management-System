import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import fetch from "node-fetch";
import { generateTokens, verifyRefreshToken } from "../utils/jwt.js";
import { sendVerificationEmail, sendPasswordResetEmail } from "../services/emailService.js";

// 🔹 Đăng ký tài khoản
// 🔹 Đăng ký tài khoản
export const register = async (req, res) => {
  try {
    const { full_name, email, password, phone } = req.body;
    if (!full_name || !email || !password)
      return res.status(400).json({ success: false, message: "Vui lòng nhập đầy đủ thông tin." });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: "Email đã tồn tại." });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      full_name,
      email,
      password: hashed,
      phone,
      provider: "local",
      emailVerified: false,
      status: "pending",
    });

    // Tạo token xác minh email
    const token = crypto.randomBytes(32).toString("hex");
    user.emailVerificationToken = crypto.createHash("sha256").update(token).digest("hex");
    user.emailVerificationExpires = Date.now() + 3600000; // 1h
    await user.save();

    // Gửi email xác nhận
    await sendVerificationEmail(email, full_name, token);

    res.status(201).json({
      success: true,
      message: "Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản.",
    });
  } catch (error) {
    console.error("❌ Lỗi đăng ký:", error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống." });
  }
};

// 🔹 Xác nhận email
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    });
    if (!user) return res.status(400).json({ success: false, message: "Token xác nhận không hợp lệ hoặc đã hết hạn." });

    user.emailVerified = true;
    user.status = "active";
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    const { accessToken, refreshToken } = generateTokens(user._id);

    res.status(200).json({
      success: true,
      message: "Xác nhận email thành công!",
      data: {
        user: {
          id: user._id,
          full_name: user.full_name,
          email: user.email,
          status: user.status,
        },
        tokens: { accessToken, refreshToken },
      },
    });
  } catch (error) {
    console.error("❌ Verify email error:", error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống." });
  }
};

// 🔹 Đăng nhập
// 🔹 Đăng nhập
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");
    if (!user) return res.status(401).json({ success: false, message: "Email hoặc mật khẩu không chính xác." });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ success: false, message: "Email hoặc mật khẩu không chính xác." });

    if (user.status !== "active")
      return res.status(403).json({ success: false, message: "Tài khoản chưa được kích hoạt." });

    const { accessToken, refreshToken } = generateTokens(user._id);
    user.password = undefined;

    res.status(200).json({
      success: true,
      message: "Đăng nhập thành công!",
      data: {
        user,
        tokens: { accessToken, refreshToken },
      },
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống." });
  }
};

// 🔹 Đăng nhập bằng Facebook
export const facebookLogin = async (req, res) => {
  try {
    const { facebookId, name, email, accessToken } = req.body;
    if (!facebookId || !accessToken)
      return res.status(400).json({ success: false, message: "Thiếu Facebook ID hoặc access token." });

    const fbResp = await fetch(`https://graph.facebook.com/me?access_token=${accessToken}&fields=id,name,email`);
    const fbData = await fbResp.json();
    if (!fbData.id || fbData.id !== facebookId)
      return res.status(400).json({ success: false, message: "Xác thực Facebook thất bại." });

    let user = await User.findOne({ $or: [{ facebookId }, { email: fbData.email }] });
    if (!user) {
      user = await User.create({
        full_name: fbData.name,
        email: fbData.email,
        facebookId,
        provider: "facebook",
        emailVerified: true,
        status: "active",
      });
    }

    const { accessToken: at, refreshToken: rt } = generateTokens(user._id);
    res.status(200).json({
      success: true,
      message: "Đăng nhập Facebook thành công.",
      data: { user, tokens: { accessToken: at, refreshToken: rt } },
    });
  } catch (error) {
    console.error("❌ Facebook login error:", error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống." });
  }
};

// 🔹 Làm mới token
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ success: false, message: "Refresh token không hợp lệ." });

    const tokens = generateTokens(user._id);
    res.status(200).json({
      success: true,
      message: "Làm mới token thành công.",
      data: { tokens },
    });
  } catch {
    res.status(401).json({ success: false, message: "Refresh token hết hạn hoặc không hợp lệ." });
  }
};

// 🔹 Quên mật khẩu
// 🔹 Quên mật khẩu
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(200).json({ success: true, message: "Nếu email tồn tại, hướng dẫn đã được gửi." });

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.passwordResetExpires = Date.now() + 3600000;
    await user.save({ validateBeforeSave: false });

    await sendPasswordResetEmail(email, user.full_name, resetToken);
    res.status(200).json({ success: true, message: "Email đặt lại mật khẩu đã được gửi!" });
  } catch (error) {
    console.error("❌ Forgot password error:", error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống." });
  }
};

// 🔹 Đặt lại mật khẩu
// 🔹 Đặt lại mật khẩu
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });
    if (!user) return res.status(400).json({ success: false, message: "Token không hợp lệ hoặc đã hết hạn." });

    user.password = await bcrypt.hash(password, 10);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.status(200).json({ success: true, message: "Đặt lại mật khẩu thành công!" });
  } catch (error) {
    console.error("❌ Reset password error:", error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống." });
  }
};

// 🔹 Lấy thông tin user hiện tại
export const getCurrentUser = async (req, res) => {
  const user = req.user;
  res.status(200).json({ success: true, data: { user } });
};

// 🔹 Cập nhật profile
// 🔹 Cập nhật profile
export const updateProfile = async (req, res) => {
  try {
    const { full_name, phone, profile } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "Không tìm thấy user." });

    if (full_name) user.full_name = full_name;
    if (phone) user.phone = phone;
    if (profile) user.profile = { ...user.profile, ...profile };

    await user.save();
    res.status(200).json({ success: true, message: "Cập nhật thông tin thành công!", data: { user } });
  } catch (error) {
    console.error("❌ Update profile error:", error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống." });
  }
};

// 🔹 Gửi lại email xác nhận
export const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email là bắt buộc.",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng.",
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email này đã được xác minh rồi.",
      });
    }

    // Tạo token mới
    const token = crypto.randomBytes(32).toString("hex");
    user.emailVerificationToken = crypto.createHash("sha256").update(token).digest("hex");
    user.emailVerificationExpires = Date.now() + 3600000; // 1 giờ
    await user.save({ validateBeforeSave: false });

    // Gửi lại email xác minh
    await sendVerificationEmail(user.email, user.full_name, token);

    res.status(200).json({
      success: true,
      message: "Email xác nhận đã được gửi lại! Vui lòng kiểm tra hộp thư của bạn.",
    });
  } catch (error) {
    console.error("❌ resendVerificationEmail error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi hệ thống.",
    });
  }
};


// 🔹 Logout
export const logout = async (_req, res) => {
  res.status(200).json({ success: true, message: "Đăng xuất thành công." });
};


