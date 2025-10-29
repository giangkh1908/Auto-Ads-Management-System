import Shop from "../../models/shops/shop.model.js";
import User from "../../models/user.model.js";
import fetch from "node-fetch";
import Log from "../../models/log.model.js";
import UserRole from "../../models/userRole.model.js";

//  Tạo Shop
export const createShop = async (req, res) => {
  try {
    if (!req.body.shop_name) {
      return res.status(400).json({ message: "Shop name is required" });
    }
    if (!req.body.industry) {
      return res.status(400).json({ message: "Category is required" });
    }
    const ownerId = req.user._id;
    const shop = new Shop({ ...req.body, owner_id: ownerId });
    await shop.save();
    res.status(201).json({
      success: true,
      message: "Shop created successfully",
      shop,
    });
    console.log("Creating shop:", req.body);
    // Ghi log hành động
    // await Log.create({
    //   user_id: req.user?._id || null, // nếu có middleware auth
    //   shop_id: shop._id,
    //   action: "CREATE_SHOP",
    //   target_type: "Shop",
    //   target_id: shop._id.toString(),
    //   request: req.body,
    //   response: shop,
    //   success: true,
    //   ip_address: req.ip,
    // });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

//  Lấy tất cả Shop
export const getShops = async (req, res) => {
  try {
    const shops = await Shop.find()
      .populate("owner_id", "name email")
      .populate("salesman_id", "name email");
    res.json(shops);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//  Lấy các shop của user hiện tại
export const getMyShops = async (req, res) => {
  try {
    const shops = await Shop.find({ owner_id: req.user._id })
      .populate("owner_id", "name email")
      .populate("salesman_id", "name email");
    
    res.json({
      success: true,
      items: shops,
      total: shops.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

//  Lấy Shop theo ID
export const getShopById = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id)
      .populate("owner_id", "name email")
      .populate("salesman_id", "name email");
    if (!shop) return res.status(404).json({ message: "Shop not found" });
    res.json(shop);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy tất cả shop theo owner_id
export const getShopsByOwner = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1️⃣ Lấy danh sách user_roles theo user
    const userRoles = await UserRole.find({ user_id: userId })
      .populate("role_id", "role_name permissions")
      .select("shop_id role_id");

    if (!userRoles.length) {
      return res.status(403).json({
        success: false,
        message: "User must have at least one role in a shop.",
      });
    }

    // 2️⃣ Lấy danh sách shop_id mà user có quyền
    const shopIds = userRoles.map((ur) => ur.shop_id);

    // 3️⃣ Lấy thông tin các shop này
    const shops = await Shop.find({ _id: { $in: shopIds } })
      .populate({
        path: "owner_id",
        select: "full_name email phone",
      })
      .populate({
        path: "user_roles",
        populate: { path: "role_id", select: "role_name" },
      });

    // 4️⃣ Gắn role tương ứng với user hiện tại
    const shopsWithUserRole = shops.map((shop) => {
      const roleEntry = userRoles.find(
        (ur) => ur.shop_id.toString() === shop._id.toString()
      );
      return {
        ...shop.toObject(),
        user_role: roleEntry.role_id, // chỉ lấy role_id đã populate có role_name
      };
    });

    res.status(200).json({
      success: true,
      data: shopsWithUserRole,
    });
  } catch (error) {
    console.error("❌ Error in getShopsByOwner:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//  Update Shop
export const updateShop = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedShop = await Shop.findByIdAndUpdate(id, req.body, {
      new: true, // trả về bản ghi đã cập nhật
      runValidators: true,
    });
    if (!updatedShop) return res.status(404).json({ message: "Shop not found" });
    res.status(200).json({
      success: true,
      message: "Shop updated successfully",
      data: updatedShop,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

//  Delete (xóa mềm)
export const deleteShop = async (req, res) => {
  try {
    const shop = await Shop.findByIdAndUpdate(
      req.params.id,
      { deleted_at: new Date() },
      { new: true }
    );
    if (!shop) return res.status(404).json({ message: "Shop not found" });
    res.json({ message: "Shop đã xóa tạm thời", shop });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Kích hoạt Shop
export const activateShop = async (req, res) => {
  try {
    const { id } = req.params;

    const shop = await Shop.findByIdAndUpdate(
      id,
      { status: "active", updated_by: req.user?._id || null },
      { new: true }
    );

    if (!shop) return res.status(404).json({ message: "Shop không tồn tại" });

    res.json({ success: true, message: "Shop đã được kích hoạt", data: shop });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Vô hiệu hóa Shop
export const deactivateShop = async (req, res) => {
  try {
    const { id } = req.params;

    const shop = await Shop.findByIdAndUpdate(
      id,
      { status: "inactive", updated_by: req.user?._id || null },
      { new: true }
    );

    if (!shop) return res.status(404).json({ message: "Shop không tồn tại" });

    res.json({ success: true, message: "Shop đã bị vô hiệu hóa", data: shop });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Lấy danh sách trang Facebook từ access token đã lưu (người dùng hiện tại)
export const getFacebookPages = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+facebookAccessToken');
    if (!user?.facebookAccessToken) {
      return res.status(400).json({ success: false, message: 'Không có Facebook access token. Vui lòng đăng nhập Facebook.' });
    }

    const fbResp = await fetch(`https://graph.facebook.com/me/accounts?fields=id,name,category,access_token,tasks,picture.width(200).height(200){url}&access_token=${user.facebookAccessToken}`);
    const fbData = await fbResp.json();
    if (!fbData?.data) {
      return res.status(400).json({ success: false, message: 'Không lấy được danh sách page từ Facebook', detail: fbData });
    }

    const pages = fbData.data.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      pageAccessToken: p.access_token,
      tasks: p.tasks || [],
      picture: p.picture?.data?.url || null,
    }));

    return res.status(200).json({ success: true, data: { pages } });
  } catch (error) {
    console.error('getFacebookPages error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống.' });
  }
};

// Kết nối page vào shop: lưu facebook_page_id và facebook_page_token
export const connectFacebookPage = async (req, res) => {
  try {
    const { shopId, pageId, pageAccessToken } = req.body;
    if (!shopId || !pageId || !pageAccessToken) {
      return res.status(400).json({ success: false, message: 'Thiếu tham số.' });
    }

    // Lấy data page hiển thị lên dashboard
    let pageInfo = null;
    try {
      const infoResp = await fetch(`https://graph.facebook.com/${pageId}?fields=id,name,category,link,picture.width(200).height(200){url}&access_token=${pageAccessToken}`);
      const infoData = await infoResp.json();
      if (infoData && !infoData.error) {
        pageInfo = {
          name: infoData.name,
          category: infoData.category,
          link: infoData.link,
          picture_url: infoData?.picture?.data?.url || null,
        };
      }
    } catch { }

    // Tìm shop và upsert vào mảng facebook_pages
    const shop = await Shop.findById(shopId);
    if (!shop) return res.status(404).json({ success: false, message: 'Shop không tồn tại.' });

    const idx = (shop.facebook_pages || []).findIndex(p => p.page_id === pageId);
    const newEntry = {
      page_id: pageId,
      page_token: pageAccessToken,
      connected_status: 'connected',
      ...(pageInfo ? { page_info: pageInfo } : {}),
      connected_at: new Date(),
      last_synced_at: null,
    };

    if (idx >= 0) {
      shop.facebook_pages[idx] = { ...shop.facebook_pages[idx].toObject?.() || shop.facebook_pages[idx], ...newEntry };
    } else {
      shop.facebook_pages.push(newEntry);
    }

    await shop.save();

    return res.status(200).json({ success: true, message: 'Kết nối page thành công.', data: { shop } });
  } catch (error) {
    console.error('connectFacebookPage error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống.' });
  }
};

// Ngắt kết nối page khỏi shop (đặt connected_status = 'disconnected' và xoá token)
export const disconnectFacebookPage = async (req, res) => {
  try {
    const { shopId, pageId } = req.body;
    if (!shopId || !pageId) {
      return res.status(400).json({ success: false, message: 'Thiếu tham số.' });
    }

    // Xóa phần tử theo page_id để không phụ thuộc index (mảng tự co lại)
    const result = await Shop.updateOne(
      { _id: shopId },
      { $pull: { facebook_pages: { page_id: pageId } } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ success: false, message: 'Page không tồn tại trong shop.' });
    }

    const updated = await Shop.findById(shopId);
    return res.status(200).json({ success: true, message: 'Đã ngắt kết nối page.', data: { shop: updated } });
  } catch (error) {
    console.log('disconnectFacebookPage error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống.' });
  }
};

// Làm mới token Facebook
export const refreshFacebookToken = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+facebookAccessToken');
    if (!user?.facebookAccessToken) {
      return res.status(400).json({
        success: false,
        message: 'Không tìm thấy Facebook access token. Vui lòng đăng nhập lại Facebook.'
      });
    }

    // Đổi token ngắn hạn thành token dài hạn (long-lived)
    const appId = process.env.FB_APP_ID;
    const appSecret = process.env.FB_APP_SECRET;

    if (!appId || !appSecret) {
      console.error('Missing FB_APP_ID or FB_APP_SECRET in environment variables');
      return res.status(500).json({
        success: false,
        message: 'Cấu hình Facebook App chưa đầy đủ. Vui lòng kiểm tra FB_APP_ID và FB_APP_SECRET.'
      });
    }

    console.log('🔄 Attempting to refresh Facebook token...');
    const refreshUrl = `https://graph.facebook.com/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${user.facebookAccessToken}`;

    console.log('🔄 Refresh URL:', refreshUrl.replace(appSecret, '***SECRET***'));

    const fbResp = await fetch(refreshUrl);
    const fbData = await fbResp.json();

    console.log('🔄 Facebook refresh response:', fbData);

    if (fbData.error) {
      console.error('❌ Facebook token refresh error:', fbData.error);
      return res.status(400).json({
        success: false,
        message: `Không thể làm mới access token: ${fbData.error.message || 'Token đã hết hạn'}`,
        detail: fbData.error
      });
    }

    if (!fbData.access_token) {
      console.error('❌ No access_token in response:', fbData);
      return res.status(400).json({
        success: false,
        message: 'Facebook không trả về access token mới.'
      });
    }

    // Cập nhật token mới vào DB
    user.facebookAccessToken = fbData.access_token;
    await user.save();

    console.log('✅ Facebook token refreshed successfully');
    return res.status(200).json({
      success: true,
      message: 'Làm mới access token thành công.',
      data: { accessToken: fbData.access_token }
    });
  } catch (error) {
    console.error('refreshFacebookToken system error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi hệ thống khi làm mới access token.'
    });
  }
};