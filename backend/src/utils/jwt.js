import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

/**
 * 🧩 Hàm tạo JWT token
 * @param {Object} payload - Dữ liệu lưu trong token
 * @param {String} secret - Secret key tương ứng (access hoặc refresh)
 * @param {String} expiresIn - Thời gian hết hạn token
 */
export const generateToken = (payload, secret, expiresIn) => {
  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * ✅ Tạo Access + Refresh Tokens
 * @param {String} userId - ID người dùng
 */
export const generateTokens = (userId) => {
  const payload = { id: userId };

  const accessToken = generateToken(
    payload,
    process.env.JWT_SECRET,
    process.env.JWT_ACCESS_EXPIRES || '15m'
  );

  const refreshToken = generateToken(
    payload,
    process.env.JWT_SECRET,
    process.env.JWT_REFRESH_EXPIRES || '7d'
  );

  return { accessToken, refreshToken };
};

/**
 * 🔐 Verify Access Token
 */
export const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
};

/**
 * 🔁 Verify Refresh Token
 */
export const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};
