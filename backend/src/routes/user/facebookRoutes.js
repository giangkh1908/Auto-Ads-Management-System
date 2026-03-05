import express from "express";
import {
  fetchFacebookPages,
  connectFacebookPage,
  disconnectFacebookPage,
  refreshFacebookToken,
  updatePageStatus,
} from "../../controllers/user/facebookControllers.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authenticate);

// Lấy danh sách Facebook Pages (đã connect và chưa connect)
router.get("/pages", fetchFacebookPages);

// Kết nối một Facebook Page
router.post("/pages/connect", connectFacebookPage);

// Ngắt kết nối một Facebook Page
router.delete("/pages/:pageId", disconnectFacebookPage);

// Cập nhật trạng thái Facebook Page
router.put("/pages/:pageId/status", updatePageStatus);

// Làm mới Facebook Token
router.post("/token/refresh", refreshFacebookToken);

export default router;
