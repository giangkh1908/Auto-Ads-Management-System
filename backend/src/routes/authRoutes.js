import express from 'express';
import {
    register,
    login,
    verifyEmail,
    resendVerificationEmail,
    forgotPassword,
    resetPassword,
    changePassword,
    getCurrentUser,
    updateProfile,
    facebookLogin
} from '../controllers/authControllers.js';
import { authenticate } from '../middleware/auth.js';
import { loginLimiter, registerLimiter, forgotPasswordLimiter, resendMailLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Public routes
router.post('/register', registerLimiter, register);

router.post('/login', loginLimiter, login);

router.get('/verify-email/:token', verifyEmail);

router.post('/resend-verification', resendMailLimiter, resendVerificationEmail);

router.post('/forgot-password', forgotPasswordLimiter, forgotPassword);

router.post('/reset-password/:token', resendMailLimiter, resetPassword);
router.post('/facebook-login', facebookLogin);

// Protected routes
router.use(authenticate); // Middleware này sẽ áp dụng cho tất cả routes bên dưới
router.get('/me', getCurrentUser);

router.put('/update-profile', updateProfile);

router.post('/change-password', changePassword);
export default router;
