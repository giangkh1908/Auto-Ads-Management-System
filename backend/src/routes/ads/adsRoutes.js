// src/routes/ads/adsRoutes.js
import express from "express";
import { listAdsCtrl, syncAdsCtrl, deleteAdCtrl } from "../../controllers/ads/ads.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authenticate);

// Thêm route đặc biệt để xử lý yêu cầu cũ đến /count
router.get("/count", (req, res) => {
  return res.status(200).json({ count: 0 });
});

// NEW: đồng bộ ads từ Facebook
router.get("/sync", syncAdsCtrl);

// List ads
router.get("/", listAdsCtrl);
router.delete("/:id", deleteAdCtrl);

export default router;
