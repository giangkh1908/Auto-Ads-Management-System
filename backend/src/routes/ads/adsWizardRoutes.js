// routes/ads/adsWizardRoutes.js
import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";
import { publishAdsWizard } from "../../controllers/ads/adsWizard.controller.js";

const router = Router();
router.post("/ads/wizard/publish", authenticate, authorize("ads", "create"), publishAdsWizard);
export default router;
