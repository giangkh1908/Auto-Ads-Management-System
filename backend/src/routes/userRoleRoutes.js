import express from "express";
import { assignRole, getUserRoles, getUserRoleById, updateUserRole, deleteUserRole } from "../controllers/userRoleControllers.js";

const router = express.Router();

router.get("/", getUserRoles);

router.get("/:id", getUserRoleById);

// router.post("/", createUser);

router.put("/:id", updateUserRole);

router.delete("/:id", deleteUserRole);

export default router;