import express from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireFeature, FEATURE_KEYS } from '../../middlewares/featureGate.middleware.js';
import {
  createAIConfig,
  getAIConfigs,
  getAIConfig,
  updateAIConfig,
  deleteAIConfig,
  setDefaultAIConfig,
  previewAIConfigPrompt,
  generateAd,
} from '../../controllers/ai/aiControllers.js';

const router = express.Router();

// Tất cả các routes đều yêu cầu xác thực
router.use(authenticate);
router.use(requireFeature(FEATURE_KEYS.CONTENT_AI));

// Generate full ad variants via Manus AI
router.post('/generate-ad', generateAd);

// AI Config routes
router.post('/configs', createAIConfig);
router.get('/configs', getAIConfigs);
router.get('/configs/:id', getAIConfig);
router.get('/configs/:id/preview-prompt', previewAIConfigPrompt);
router.put('/configs/:id', updateAIConfig);
router.delete('/configs/:id', deleteAIConfig);
router.post('/configs/:id/set-default', setDefaultAIConfig);

export default router;