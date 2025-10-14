// src/routes/ads/adsSetRoutes.js
import express from "express";
import { listAdSetsCtrl, syncAdSetsCtrl, deleteAdsetCascadeCtrl  } from "../../controllers/ads/adsSet.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authenticate);

// Thêm route đặc biệt để xử lý yêu cầu cũ đến /count
router.get("/count", (req, res) => {
  return res.status(200).json({ count: 0 });
});

// NEW: đồng bộ adsets từ Facebook
router.get("/sync", syncAdSetsCtrl);

// List adsets
router.get("/", listAdSetsCtrl);
router.delete("/:id", deleteAdsetCascadeCtrl);


export default router;
