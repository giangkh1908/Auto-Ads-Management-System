import express from "express";
import { 
    createShop, 
    getShops, 
    getShopById, 
    updateShop, 
    deleteShop, 
    activateShop, 
    deactivateShop,
    getFacebookPages, 
    connectFacebookPage, 
    disconnectFacebookPage, 
    refreshFacebookToken 
} from "../../controllers/shops/shopControllers.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", getShops);
router.get("/facebook/pages", authenticate, getFacebookPages);
router.get("/:id", getShopById);

router.post("/", createShop);

router.put("/:id", updateShop);

router.delete("/:id", deleteShop);

router.patch("/:id/activate", activateShop);

router.patch("/:id/deactivate", deactivateShop);

// Facebook integration helpers
router.post("/facebook/connect", authenticate, connectFacebookPage);
router.post("/facebook/disconnect", authenticate, disconnectFacebookPage);
router.post("/facebook/refresh-token", authenticate, refreshFacebookToken);

export default router;