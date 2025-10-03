import express from 'express';
import {
    register,
    login,
    verifyEmail,
    resendVerificationEmail,
    forgotPassword,
    resetPassword,
    changePassword,
    getCurrentUser
} from '../controllers/authControllers.js';
import { authenticate } from '../middleware/auth.js';
import { loginLimiter, registerLimiter, forgotPasswordLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Public routes
router.post('/register', registerLimiter, register);

router.post('/login', loginLimiter, login);

router.get('/verify-email/:token', verifyEmail);

router.post('/resend-verification', resendVerificationEmail);

router.post('/forgot-password', forgotPasswordLimiter, forgotPassword);

router.post('/reset-password/:token', resetPassword);

// Protected routes
router.use(authenticate); // Middleware này sẽ áp dụng cho tất cả routes bên dưới
router.get('/me', getCurrentUser);
router.post('/change-password', changePassword);

export default router;
