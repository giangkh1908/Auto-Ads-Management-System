// routes/upload.routes.js
import express from "express";
import multer from "multer";
import { uploadImage } from "../controllers/uploadController.js";

const router = express.Router();

// Cấu hình multer (lưu tạm local trước khi gửi Cloudinary)
const storage = multer.diskStorage({});
const upload = multer({ storage });

/**
 * POST /api/upload/image
 * Upload ảnh quảng cáo (Creative)
 */
router.post("/image", upload.single("file"), uploadImage);

export default router;
