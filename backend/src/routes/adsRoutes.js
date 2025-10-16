import express from 'express';
import { createFromWizard } from '../controllers/AdsController.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

// POST /api/ads/from-wizard
router.post('/from-wizard', authenticate, createFromWizard);

export default router;
