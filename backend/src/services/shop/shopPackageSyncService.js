import Shop from "../../models/shops/shop.model.js";
import UserPackage from "../../models/package/userPackage.model.js";
import User from "../../models/user/user.model.js";
import ShopUser from "../../models/shops/shopUser.model.js";
import UserRole from "../../models/user/userRole.model.js";
import Role from "../../models/admin/role.model.js";
import { saveLog } from "../../utils/log.js";

/**
 * Đồng bộ package của tất cả shop thuộc owner với package hiện tại của owner
 * Tìm tất cả shop mà user là owner (owner_id) hoặc có is_manager = true
 * @param {string} ownerId - ID của shop owner/user
 * @returns {Promise<{updated: number, shops: Array}>}
 */
export const syncShopPackagesWithOwner = async (ownerId) => {
  try {
    if (!ownerId) {
      console.warn("⚠️ syncShopPackagesWithOwner: ownerId is required");
      return { updated: 0, shops: [] };
    }

    // Lấy package active hiện tại của owner
    const ownerPackage = await UserPackage.findOne({
      user_id: ownerId,
      status: { $in: ["active", "expiring soon", "new signup"] },
      deleted_at: null,
    })
      .populate("package_id")
      .sort({ created_at: -1 });

    // Tìm tất cả shop mà user này liên quan:
    // 1. Shop mà user là owner (owner_id = ownerId)
    const shopsAsOwner = await Shop.find({
      owner_id: ownerId,
      deleted_at: null,
    }).select("_id");

    // 2. Shop mà user có is_manager = true
    const shopUsers = await ShopUser.find({
      user_id: ownerId,
      is_manager: true,
      status: "active",
    }).select("shop_id");

    // 3. Shop mà user có UserRole với role Shop Owner
    const shopOwnerRole = await Role.findOne({ role_name: "Shop Owner" });
    const userRoles = shopOwnerRole
      ? await UserRole.find({
          user_id: ownerId,
          role_id: shopOwnerRole._id,
          shop_id: { $ne: null },
          revoked_at: null,
        }).select("shop_id")
      : [];

    // Hợp nhất tất cả shop_id (loại bỏ trùng lặp)
    const shopIdsSet = new Set();
    shopsAsOwner.forEach((shop) => shopIdsSet.add(shop._id.toString()));
    shopUsers.forEach((su) => shopIdsSet.add(su.shop_id.toString()));
    userRoles.forEach((ur) => shopIdsSet.add(ur.shop_id.toString()));

    const shopIds = Array.from(shopIdsSet);

    if (shopIds.length === 0) {
      console.log(`ℹ️ Không tìm thấy shop nào cho user ${ownerId}`);
      return { updated: 0, shops: [] };
    }

    // Lấy thông tin chi tiết của các shop
    const shops = await Shop.find({
      _id: { $in: shopIds },
      deleted_at: null,
    });

    let updateResult;
    let packageInfo = null;

    if (!ownerPackage || !ownerPackage.package_id) {
      // Owner không có package active → set shops về null (None)
      console.log(`ℹ️ Owner ${ownerId} không có package active, set shops về None (null)`);

      updateResult = await Shop.updateMany(
        {
          _id: { $in: shopIds },
          deleted_at: null,
        },
        {
          $set: {
            current_package_id: null,
            package_expired_at: null,
            updated_at: new Date(),
          },
        }
      );
    } else {
      // Owner có package active → sync với package đó
      updateResult = await Shop.updateMany(
        {
          _id: { $in: shopIds },
          deleted_at: null,
        },
        {
          $set: {
            current_package_id: ownerPackage.package_id._id,
            package_expired_at: ownerPackage.to_date || null,
            updated_at: new Date(),
          },
        }
      );

      packageInfo = {
        id: ownerPackage.package_id._id,
        name: ownerPackage.package_id.name,
        expired_at: ownerPackage.to_date,
      };
    }

    // Lấy thông tin owner để ghi log
    const ownerUser = await User.findById(ownerId);

    // Ghi log cho mỗi shop
    for (const shop of shops) {
      await saveLog({
        user_id: ownerId,
        user_name: ownerUser?.full_name || ownerUser?.email,
        shop_id: shop._id,
        shop_name: shop.shop_name,
        action: packageInfo ? "UPGRADE_SHOP" : "DOWNGRADE_SHOP",
        target_type: "Shop",
        target_id: shop._id.toString(),
        target_name: shop.shop_name,
        meta: packageInfo ? {
          package_id: packageInfo.id.toString(),
          package_name: packageInfo.name,
          expired_at: packageInfo.expired_at,
        } : {
          package_id: null,
          package_name: "None",
          expired_at: null,
        },
      });
    }

    console.log(
      `✅ Đã sync package cho ${updateResult.modifiedCount} shop của owner ${ownerId}. Package: ${packageInfo ? packageInfo.name : "None (null)"}`
    );

    return {
      updated: updateResult.modifiedCount,
      shops: shops.map((s) => s._id.toString()),
      package: packageInfo,
    };
  } catch (error) {
    console.error("❌ Lỗi sync shop packages với owner package:", error);
    throw error;
  }
};

/**
 * Đồng bộ package cho một shop cụ thể với package của owner hiện tại
 * @param {string} shopId - ID của shop
 * @returns {Promise<Object>}
 */
export const syncSingleShopPackage = async (shopId) => {
  try {
    const shop = await Shop.findById(shopId).populate("owner_id");
    if (!shop || !shop.owner_id) {
      throw new Error(`Shop ${shopId} không tồn tại hoặc không có owner`);
    }

    const ownerId = shop.owner_id._id || shop.owner_id;

    // Lấy package active hiện tại của owner
    const ownerPackage = await UserPackage.findOne({
      user_id: ownerId,
      status: { $in: ["active", "expiring soon", "new signup"] },
      deleted_at: null,
    })
      .populate("package_id")
      .sort({ created_at: -1 });

    if (!ownerPackage || !ownerPackage.package_id) {
      console.log(`ℹ️ Owner ${ownerId} không có package active, không cần sync shop ${shopId}`);
      return { updated: 0, shop: shopId };
    }

    // Cập nhật package cho shop cụ thể
    const updatedShop = await Shop.findByIdAndUpdate(
      shopId,
      {
        $set: {
          current_package_id: ownerPackage.package_id._id,
          package_expired_at: ownerPackage.to_date || null,
          updated_at: new Date(),
        },
      },
      { new: true }
    );

    console.log(
      `✅ Đã sync package cho shop ${shopId}. Package: ${ownerPackage.package_id.name}`
    );

    return {
      updated: updatedShop ? 1 : 0,
      shop: shopId,
      package: {
        id: ownerPackage.package_id._id,
        name: ownerPackage.package_id.name,
        expired_at: ownerPackage.to_date,
      },
    };
  } catch (error) {
    console.error(`❌ Lỗi sync package cho shop ${shopId}:`, error);
    throw error;
  }
};

