import express from "express";
import { 
    createOrder,
    createUserPackage,
    deleteUserPackage,
    getUserPackageById,
    getUserPackages,
    getMyPackage,
    updateUserPackage,
    getUserStatuses,
} from "../../controllers/package/userPackageControllers.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { adminActionLogger } from "../../middlewares/adminActionLogger.middleware.js";

const router = express.Router();

// Route user thường (không log)
router.get("/my-package", authenticate, getMyPackage);
router.get("/me/package", authenticate, getMyPackage); // Giữ cả 2 cho an toàn
router.post("/order", authenticate, createOrder);

// Routes admin (có log)
router.use(authenticate);
router.use(adminActionLogger); // Log admin actions
router.get("/statuses", getUserStatuses);
router.get("/", getUserPackages);
router.get("/:id", getUserPackageById);
router.post("/package", createUserPackage);
router.put("/:id", updateUserPackage);
router.delete("/:id", deleteUserPackage);

export default router;