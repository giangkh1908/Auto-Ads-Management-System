// controllers/upload.controller.js
import cloudinary from "../config/cloudinary.js";

/**
 * Upload image to Cloudinary
 * @param {*} req
 * @param {*} res
 */
export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Không có file nào được tải lên.",
      });
    }

    const filePath = req.file.path;

    // Upload lên Cloudinary
    const result = await cloudinary.uploader.upload(filePath, {
      folder: "ads_creatives", // folder riêng cho quảng cáo
      resource_type: "image",
      transformation: [
        { quality: "auto" },
        { fetch_format: "auto" },
      ],
    });

    return res.status(200).json({
      success: true,
      message: "Upload thành công.",
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (error) {
    console.error("❌ Upload image error:", error);
    return res.status(500).json({
      success: false,
      message: "Upload thất bại.",
      detail: error?.message,
    });
  }
};
