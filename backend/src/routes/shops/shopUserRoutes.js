import express from "express";
import { createShopUser, getShopUsers, getShopUserById, getShopsByUser, updateShopUser, deleteShopUser } from "../../controllers/shops/shopUserControllers.js";

const router = express.Router();

router.get("/", getShopUsers);

router.get("/:id", getShopUserById);

router.get("/:user_id", getShopsByUser);

router.post("/", createShopUser);

router.put("/:id", updateShopUser);

router.delete("/:id", deleteShopUser);

export default router;