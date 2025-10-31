import express from "express";
import { createShopUser, getShopUsers, getShopUserById, getShopsByUser, getUsersByShop, updateShopUser, updateUserRole, updateUserStatus, deleteShopUser } from "../../controllers/shops/shopUserControllers.js";

const router = express.Router();

router.get("/", getShopUsers);

router.get("/:shopId", getUsersByShop);

router.post("/", createShopUser);

router.put("/status/:shopId", updateUserStatus);

router.put("/:shopId", updateUserRole);

router.delete("/:id", deleteShopUser);

export default router;