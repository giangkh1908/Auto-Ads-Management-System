// routes/ads/adsWizardRoutes.js
import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";
import { publishAdsWizard, updateAdsWizard } from "../../controllers/ads/adsWizard.controller.js";

const router = Router();
router.post("/publish", authenticate, publishAdsWizard);
router.put("/update", authenticate, updateAdsWizard);
export default router;
