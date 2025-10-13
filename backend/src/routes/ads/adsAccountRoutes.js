// src/routes/ads/adsAccount.routes.js
import express from "express";
import {
  syncAdsAccounts,
  listAdsAccountsCtrl,
  getAdsAccountCtrl,
  getAdsAccountByExternalCtrl,
  updateAdsAccountCtrl,
  deleteAdsAccountCtrl,
} from "../../controllers/ads/adsAccount.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authenticate);

router.get("/sync", syncAdsAccounts);
router.get("/", listAdsAccountsCtrl);
router.get("/:id", getAdsAccountCtrl);
router.get("/by-external/:externalId", getAdsAccountByExternalCtrl);
router.patch("/:id", updateAdsAccountCtrl);
router.delete("/:id", deleteAdsAccountCtrl);

export default router;