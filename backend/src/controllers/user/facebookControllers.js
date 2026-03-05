import User from "../../models/user/user.model.js";
import axios from "axios";

// 1. Lấy danh sách Facebook Pages của User (kết hợp data từ FB API và DB)
export const fetchFacebookPages = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("+facebookAccessToken").lean();
    console.log(`[fetchFacebookPages] User: ${user?.email}, Has Token: ${!!user?.facebookAccessToken}`);
    
    if (!user || (!user.facebookId && !user.facebookAccessToken)) {
      return res.status(400).json({
        success: false,
        message: "Người dùng chưa liên kết tài khoản Facebook",
      });
    }

    const { facebookAccessToken, facebook_pages = [] } = user;
    console.log(`[fetchFacebookPages] User facebook_pages count: ${facebook_pages.length}`);
    if (facebook_pages.length > 0) {
      console.log(`[fetchFacebookPages] Example connected page_id: ${facebook_pages[0].page_id}`);
    }
    
    // Gọi Graph API để lấy danh sách Pages
    let fbApiPages = [];
    try {
      const fbResp = await axios.get(
        `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,category,access_token,tasks,picture{url}&access_token=${facebookAccessToken}`
      );
      if (fbResp.data && fbResp.data.data) {
        fbApiPages = fbResp.data.data;
      }
    } catch (fbErr) {
      console.error("Lỗi lấy danh sách Pages từ FB API:", fbErr?.response?.data || fbErr.message);
      return res.status(400).json({
        success: false,
        message: fbErr?.response?.data?.error?.message || "Không thể lấy danh sách Trang từ Facebook. Token có thể đã hết hạn.",
        fbError: fbErr?.response?.data || fbErr.message
      });
    }

    // Map dữ liệu
    const mappedPages = fbApiPages.map(apiPage => {
      // Kiểm tra xem page này đã được connect chưa (dựa theo DB của User)
      const connectedPage = facebook_pages.find(p => String(p.page_id) === String(apiPage.id));
      if (connectedPage) {
        console.log(`[fetchFacebookPages] Found match for page: ${apiPage.name} (${apiPage.id})`);
      }
      
      return {
        id: apiPage.id,
        name: apiPage.name,
        category: apiPage.category,
        pageAccessToken: apiPage.access_token,
        tasks: apiPage.tasks || [],
        picture: apiPage.picture?.data?.url || "",
        connected_shop: connectedPage ? { is_current_shop: true, shop_name: user.full_name } : null, // Mock properties để UI ConnectPage hiểu là đã connect với "Bản thân"
        can_connect: true, // Nếu UI cần
      };
    });

    console.log(`[fetchFacebookPages] Returning ${mappedPages.length} pages. Connected count: ${mappedPages.filter(p => p.connected_shop).length}`);
    if (mappedPages.some(p => p.connected_shop)) {
       const connected = mappedPages.find(p => p.connected_shop);
       console.log(`[fetchFacebookPages] Example connected page in response: ${connected.name} (${connected.id})`);
    }

    return res.status(200).json({
      success: true,
      data: {
        pages: mappedPages
      }
    });

  } catch (err) {
    console.error("fetchFacebookPages Error:", err);
    return res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ" });
  }
};

// 2. Kết nối Facebook Page
export const connectFacebookPage = async (req, res) => {
  try {
    const { pageId, pageAccessToken } = req.body;
    
    if (!pageId || !pageAccessToken) {
      return res.status(400).json({ success: false, message: "Thiếu pageId hoặc pageAccessToken" });
    }

    console.log(`[connectFacebookPage] Attempting to connect Page: ${pageId}`);

    const user = await User.findById(req.user._id).select("+facebookAccessToken");
    if (!user) {
      return res.status(404).json({ success: false, message: "Người dùng không tồn tại" });
    }

    // Lấy thông tin page từ Graph API (Bỏ tasks vì gây lỗi #100 trên một số version/loại Page)
    let pageData;
    try {
       const resp = await axios.get(`https://graph.facebook.com/v18.0/${pageId}?fields=name,category,picture{url}&access_token=${pageAccessToken}`);
       pageData = resp.data;
    } catch(err) {
       console.error("Lỗi lấy thông tin FB page verify:", err?.response?.data || err.message);
       return res.status(400).json({ 
         success: false, 
         message: err?.response?.data?.error?.message || "Không thể xác minh phân quyền Trang.",
         fbError: err?.response?.data || err.message
       });
    }

    // Khởi tạo mảng facebook_pages nếu chưa có
    if (!user.facebook_pages) {
      user.facebook_pages = [];
    }

    // Kiểm tra xem đã kết nối chưa
    const alreadyConnected = user.facebook_pages.find(p => p.page_id === pageId);
    if (alreadyConnected) {
      return res.status(200).json({ success: true, message: "Trang đã được kết nối trước đó." });
    }

    // Thêm page vào DB (Đồng bộ với Schema trong user.model.js)
    user.facebook_pages.push({
      page_id: pageId,
      page_token: pageAccessToken, // Schema là page_token
      page_info: {
        name: pageData.name || "Unknown Page",
        category: pageData.category || "",
        picture_url: pageData.picture?.data?.url || "",
      },
      tasks: pageData.tasks || [],
      connected_at: new Date(),
      connected_status: "connected"
    });

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Kết nối Trang thành công",
    });

  } catch (err) {
    console.error("connectFacebookPage Error:", err);
    return res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ" });
  }
};

// 3. Ngắt kết nối Facebook Page
export const disconnectFacebookPage = async (req, res) => {
  try {
    const { pageId } = req.params;
    
    if (!pageId) {
      return res.status(400).json({ success: false, message: "Thiếu pageId" });
    }

    const user = await User.findById(req.user._id).select("+facebookAccessToken");
    if (!user) {
      return res.status(404).json({ success: false, message: "Người dùng không tồn tại" });
    }

    if (!user.facebook_pages || user.facebook_pages.length === 0) {
      return res.status(400).json({ success: false, message: "Không tìm thấy Trang nào được kết nối" });
    }

    user.facebook_pages = user.facebook_pages.filter(p => p.page_id !== pageId);
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Ngắt kết nối Trang thành công",
    });

  } catch (err) {
    console.error("disconnectFacebookPage Error:", err);
    return res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ" });
  }
};

// 4. Refresh Facebook Token
export const refreshFacebookToken = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("+facebookAccessToken");
    console.log(`[refreshFacebookToken] User: ${user?.email}, Has Token: ${!!user?.facebookAccessToken}`);
    
    if (!user || !user.facebookAccessToken) {
       return res.status(400).json({ success: false, message: "Chưa liên kết tài khoản Facebook" });
    }

    // Gọi lên Fb Graph lấy Token mới
    let longLivedToken = user.facebookAccessToken;
    try {
      const tokenResp = await axios.get(
        `https://graph.facebook.com/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.FB_APP_ID}&client_secret=${process.env.FB_APP_SECRET}&fb_exchange_token=${user.facebookAccessToken}`
      );
      if (tokenResp.data?.access_token) {
        longLivedToken = tokenResp.data.access_token;
      }
    } catch (tokenError) {
      console.log("Không thể refresh token:", tokenError?.response?.data || tokenError.message);
      return res.status(400).json({ 
        success: false, 
        message: tokenError?.response?.data?.error?.message || "Refresh token thất bại do lỗi Facebook API.",
        fbError: tokenError?.response?.data || tokenError.message
      });
    }

    user.facebookAccessToken = longLivedToken;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Làm mới FB Token thành công",
    });

  } catch (err) {
    console.error("refreshFacebookToken Error:", err);
    return res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ" });
  }
};

// 5. Cập nhật trạng thái Facebook Page (Active/Pause)
export const updatePageStatus = async (req, res) => {
  try {
    const { pageId } = req.params;
    const { pageStatus } = req.body; // 'active' or 'pause'

    if (!pageId || !pageStatus) {
      return res.status(400).json({ success: false, message: "Thiếu pageId hoặc pageStatus" });
    }

    const user = await User.findById(req.user._id).select("+facebookAccessToken");
    if (!user || !user.facebook_pages) {
      return res.status(404).json({ success: false, message: "Không tìm thấy người dùng hoặc pages" });
    }

    const pageIndex = user.facebook_pages.findIndex(p => p.page_id === pageId);
    if (pageIndex === -1) {
      return res.status(404).json({ success: false, message: "Không tìm thấy Trang" });
    }

    user.facebook_pages[pageIndex].page_status = pageStatus;
    await user.save();

    return res.status(200).json({
      success: true,
      message: pageStatus === 'pause' ? "Đã tạm dừng Trang" : "Đã kích hoạt Trang"
    });
  } catch (err) {
    console.error("updatePageStatus Error:", err);
    return res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ" });
  }
};
