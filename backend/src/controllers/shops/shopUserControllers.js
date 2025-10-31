import ShopUser from "../../models/shops/shopUser.model.js";
import UserRole from "../../models/userRole.model.js";
import User from "../../models/user.model.js";
import Role from "../../models/role.model.js";

// Thêm User vào Shop
export const createShopUser = async (req, res) => {
  try {
    const shopUser = new ShopUser(req.body);
    await shopUser.save();
    res.status(201).json(shopUser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Lấy danh sách tất cả ShopUser
export const getShopUsers = async (req, res) => {
  try {
    const shopUsers = await ShopUser.find()
      .populate("shop_id", "shop_name status")
      .populate("user_id", "name email");
    res.json(shopUsers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUsersByShop = async (req, res) => {
  try {
    const { shopId } = req.params;

    // Lấy danh sách ShopUser thuộc shop này
    const shopUsers = await ShopUser.find({ shop_id: shopId})
      .populate("user_id", "full_name username email avatar status")
      .lean();

    // Lấy danh sách userId để query sang UserRole
    const userIds = shopUsers.map(su => su.user_id?._id).filter(Boolean);

    // Lấy role tương ứng của từng user trong shop này
    const userRoles = await UserRole.find({
      user_id: { $in: userIds },
      shop_id: shopId
    })
      .populate("role_id", "role_name")
      .lean();

    // Map dữ liệu lại thành danh sách hoàn chỉnh
    const result = shopUsers.map(su => {
      const matchedRole = userRoles.find(
        ur => ur.user_id.toString() === su.user_id?._id?.toString()
      );

      return {
        user_id: su.user_id?._id || null,
        username: su.user_id?.username || "",
        full_name: su.user_id?.full_name || "Chưa cập nhật",
        email: su.user_id?.email || "",
        avatar: su.user_id?.avatar || null,
        role_name: matchedRole?.role_id?.role_name || "N/A",
        page: su.page_count || 0,
        status: su.status || "inactive",
        joined_at: su.joined_at || null,
        is_manager: su.is_manager || false,
      };
    });

    res.status(200).json({
      success: true,
      count: result.length,
      data: result
    });

  } catch (error) {
    console.error("❌ getUsersByShop error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi hệ thống khi lấy danh sách user của shop"
    });
  }
};

// Lấy ShopUser theo ID
export const getShopUserById = async (req, res) => {
  try {
    const shopUser = await ShopUser.findById(req.params.id)
      .populate("shop_id", "shop_name")
      .populate("user_id", "name email");
    if (!shopUser) return res.status(404).json({ message: "ShopUser not found" });
    res.json(shopUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy tất cả shop mà user đang tham gia
export const getShopsByUser = async (req, res) => {
  try {
    const userId = req.params.userId; // hoặc req.user._id nếu đang login

    const memberships = await ShopUser.find({ 
      user_id: userId, 
      status: "active" 
    })
      .populate("shop_id", "shop_name industry status") // populate sang Shop
      .populate("invited_by", "name email"); // optional

    // Lọc ra chỉ phần shop cho gọn
    const shops = memberships.map(m => m.shop_id);

    res.status(200).json({ success: true, count: shops.length, data: shops });
  } catch (error) {
    console.error("getShopsByUser error:", error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
};

// Update ShopUser
export const updateShopUser = async (req, res) => {
  try {
    const shopUser = await ShopUser.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!shopUser) return res.status(404).json({ message: "ShopUser not found" });
    res.json(shopUser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

//Update user's role
export const updateUserRole = async (req, res) => {
  try {
    const { shopId } = req.params;
    const { userId, newRoleId, currentUserId } = req.body;

    // Kiểm tra quyền: chỉ Shop Owner mới có thể thay đổi role
    const ownerRole = await UserRole.findOne({
      shop_id: shopId,
      user_id: currentUserId,
    }).populate("role_id", "role_name");

    if (!ownerRole || ownerRole.role_id.role_name !== "Shop Owner") {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền thay đổi vai trò của nhân viên.",
      });
    }

    // Lấy thông tin role mới
    const newRole = await Role.findById(newRoleId);
    if (!newRole) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy vai trò cần gán.",
      });
    }

    // Chặn gán vai trò "Shop Owner" cho người khác
    if (newRole.role_name === "Shop Owner") {
      return res.status(403).json({
        success: false,
        message: "Không thể gán quyền 'Shop Owner' cho người khác.",
      });
    }

    // Không cho user tự đổi role của chính mình
    if (userId === currentUserId) {
      return res.status(400).json({
        success: false,
        message: "Không thể thay đổi vai trò của chính bạn.",
      });
    }

    // Cập nhật role của user trong shop này
    const updated = await UserRole.findOneAndUpdate(
      { shop_id: shopId, user_id: userId },
      { role_id: newRoleId },
      { new: true }
    ).populate("role_id", "role_name");

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy user hoặc role cần cập nhật.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Cập nhật vai trò thành công.",
      data: updated,
    });
  } catch (error) {
    console.error("updateUserRole error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi hệ thống khi cập nhật vai trò người dùng.",
    });
  }
};

// Cập nhật trạng thái hoạt động của user trong shop (active / inactive / removed)
export const updateUserStatus = async (req, res) => {
  try {
    const { shopId } = req.params;
    const { userId, newStatus, currentUserId } = req.body;

    // Kiểm tra quyền: chỉ Shop Owner mới có thể thay đổi status
    const ownerRole = await UserRole.findOne({
      shop_id: shopId,
      user_id: currentUserId,
    }).populate("role_id", "role_name");

    if (!ownerRole || ownerRole.role_id.role_name !== "Shop Owner") {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền thay đổi trạng thái của nhân viên.",
      });
    }

    // Không cho tự đổi trạng thái của chính mình
    if (userId === currentUserId) {
      return res.status(400).json({
        success: false,
        message: "Không thể thay đổi trạng thái của chính bạn.",
      });
    }

    // Kiểm tra trạng thái hợp lệ
    const allowedStatuses = ["active", "inactive", "removed"];
    if (!allowedStatuses.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: "Trạng thái không hợp lệ.",
      });
    }

    // Cập nhật trạng thái user trong shop
    const updated = await ShopUser.findOneAndUpdate(
      { shop_id: shopId, user_id: userId },
      { status: newStatus },
      { new: true }
    ).populate("user_id", "full_name username email");

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy user trong shop.",
      });
    }

    res.status(200).json({
      success: true,
      message: `Đã cập nhật trạng thái thành '${newStatus}'.`,
      data: updated,
    });
  } catch (error) {
    console.error("updateUserStatus error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi hệ thống khi cập nhật trạng thái người dùng.",
    });
  }
};

// Delete ShopUser (xóa hẳn)
export const deleteShopUser = async (req, res) => {
  try {
    const shopUser = await ShopUser.findByIdAndDelete(req.params.id);
    if (!shopUser) return res.status(404).json({ message: "ShopUser not found" });
    res.json({ message: "ShopUser deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
