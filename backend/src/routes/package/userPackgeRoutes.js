import express from "express";
import { 
    createOrder,
    createUserPackage,
    deleteUserPackage,
    getUserPackageById,
    getUserPackages,
    updateUserPackage,
} from "../../controllers/package/userPackgeControllers.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", getUserPackages);
router.post("/package", createUserPackage);
router.post("/order", authenticate, createOrder);

export default router;