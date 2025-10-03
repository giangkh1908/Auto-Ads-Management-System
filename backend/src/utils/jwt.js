import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// Tạo JWT token
export const generateToken = (payload, expiresIn = '7d') => {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

// Verify JWT token
export const verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
};

// Tạo access và refresh token
export const generateTokens = (userId) => {
    const payload = { userId };
    
    const accessToken = generateToken(payload, process.env.JWT_ACCESS_EXPIRES || '15m');
    const refreshToken = generateToken(payload, process.env.JWT_REFRESH_EXPIRES || '7d');
    
    return { accessToken, refreshToken };
};