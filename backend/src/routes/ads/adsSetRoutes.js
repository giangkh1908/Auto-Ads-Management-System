// src/routes/ads/adsSetRoutes.js
import express from "express";
import { listAdSetsCtrl, syncAdSetsCtrl, getAdSetsLiveCtrl, toggleAdsetStatusCtrl, deleteAdsetCascadeCtrl, getAdsetFromDatabase, copyAdsetCascadeCtrl } from "../../controllers/ads/adsSet.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authenticate);

// Thêm route đặc biệt để xử lý yêu cầu cũ đến /count
router.get("/count", (req, res) => {
  return res.status(200).json({ count: 0 });
});

// NEW: lấy adsets trực tiếp từ Facebook
router.get("/live", getAdSetsLiveCtrl);
// Database endpoints
router.get("/database", getAdsetFromDatabase);
router.post("/:id/copy", copyAdsetCascadeCtrl);
// Đồng bộ adsets từ Facebook
router.get("/sync", syncAdSetsCtrl);

// List adsets
router.get("/", listAdSetsCtrl);
router.patch("/:id/status", toggleAdsetStatusCtrl);
router.delete("/:id", deleteAdsetCascadeCtrl);

export default router;
