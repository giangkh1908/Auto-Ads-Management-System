// src/routes/ads/adsAccount.routes.js
import express from "express";
import {
  syncAdsAccounts,
  listAdsAccountsCtrl,
  getAdsAccountCtrl,
  getAdsAccountByExternalCtrl,
  updateAdsAccountCtrl,
  deleteAdsAccountCtrl,
  getAccountStatsCtrl, // Thêm import hàm mới
} from "../../controllers/ads/adsAccount.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authenticate);

// Các routes cụ thể phải đặt TRƯỚC các routes có dynamic parameter
router.get("/sync", syncAdsAccounts);
router.get("/by-external/:externalId", getAdsAccountByExternalCtrl);
router.get("/stats", getAccountStatsCtrl); // Thêm route mới này

// Routes có dynamic parameter đặt sau cùng
router.get("/", listAdsAccountsCtrl);
router.get("/:id", getAdsAccountCtrl);
router.patch("/:id", updateAdsAccountCtrl);
router.delete("/:id", deleteAdsAccountCtrl);

export default router;
