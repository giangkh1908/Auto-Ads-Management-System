// Constants và initial data cho CreateAdsWizard

export const INITIAL_DATA = {
  campaign: {
    id: 1,
    name: "Chiến dịch mới",
    status: "PAUSED",
    objective: "POST_ENGAGEMENT",
    budgetType: "CAMPAIGN",
    facebookPage: "Fchat.vn",
    facebookPageId: null,
    facebookPageAvatar: null,
    createdAt: new Date().toISOString(),
    adsets: [],
  },
  adset: {
    id: 101,
    _id: null, // ✅ Thêm _id cho adset
    name: "Nhóm quảng cáo mới",
    budget: "100.000đ",
    status: "PAUSED",
    optimization_goal: "REACH",
    billing_event: "IMPRESSIONS",
    bid_strategy: "LOWEST_COST_WITHOUT_CAP",
    bid_amount: 100,
    budgetType: "daily",
    budgetAmount: 100000,
    placement: "AUTOMATIC",
    targeting: { location: "Việt Nam", ageMin: 18, ageMax: 45 },
    conversion_event: "VIEW_CONTENT",
    ads: [],
  },
  ad: {
    id: 1001,
    adset_id: null, // ✅ Thêm adset_id cho ad
    name: "Quảng cáo mới",
    status: "PAUSED",
    page: "Fchat.vn",
    media: "text",
    mediaUrl: "",
    primaryText: "Khám phá sản phẩm/dịch vụ tuyệt vời của chúng tôi!",
    headline: "Sản phẩm/Dịch vụ chất lượng cao",
    description: "Đội ngũ chuyên nghiệp, kinh nghiệm lâu năm trong lĩnh vực.",
    cta: "Liên hệ ngay",
    destinationUrl: "https://fchat.vn",
  },
};

export const FB_OBJECTIVE_MAP = {
  AWARENESS: "OUTCOME_AWARENESS",
  TRAFFIC: "OUTCOME_TRAFFIC",
  ENGAGEMENT: "OUTCOME_ENGAGEMENT",
  LEADS: "OUTCOME_LEADS",
  SALES: "OUTCOME_SALES",
  APP_PROMOTION: "OUTCOME_APP_PROMOTION",
};

export const FB_ADSET_DEFAULTS_BY_OBJECTIVE = {
  OUTCOME_AWARENESS: {
    optimization_goal: "REACH",
    billing_event: "IMPRESSIONS",
    bid_strategy: "LOWEST_COST_WITH_BID_CAP",
    bid_amount: 1000,
  },
  OUTCOME_ENGAGEMENT: {
    optimization_goal: "POST_ENGAGEMENT",
    billing_event: "IMPRESSIONS",
    bid_strategy: "LOWEST_COST_WITH_BID_CAP",
    bid_amount: 1000,
  },
  OUTCOME_TRAFFIC: {
    optimization_goal: "LINK_CLICKS",
    billing_event: "IMPRESSIONS",
    bid_strategy: "LOWEST_COST_WITH_BID_CAP",
    bid_amount: 1000,
  },
  OUTCOME_LEADS: {
    optimization_goal: "LEAD_GENERATION",
    billing_event: "IMPRESSIONS",
    bid_strategy: "LOWEST_COST_WITH_BID_CAP",
    bid_amount: 1000,
  },
  OUTCOME_SALES: {
    optimization_goal: "CONVERSIONS",
    billing_event: "IMPRESSIONS",
    bid_strategy: "LOWEST_COST_WITH_BID_CAP",
    bid_amount: 1000,
  },
  OUTCOME_APP_PROMOTION: {
    optimization_goal: "APP_INSTALLS",
    billing_event: "IMPRESSIONS",
    bid_strategy: "LOWEST_COST_WITH_BID_CAP",
    bid_amount: 1000,
  },
};

export const WIZARD_STEPS = {
  TARGET: 0,
  CAMPAIGN: 1,
  ADSET: 2,
  AD: 3,
  CREATIVE: 4,
};

export const EDITING_ITEM_TYPES = {
  CAMPAIGN: "campaign",
  ADSET: "adset",
  AD: "ad",
};

export const TAB_TYPES = {
  CAMPAIGN: "campaign",
  CHILD: "child",
};

// Thêm vào cuối file wizardConstants.js

// 🌐 Vietnamese translation maps
export const OBJECTIVE_LABELS_VN = {
  // Facebook Objective values
  OUTCOME_AWARENESS: "Mức độ nhận biết",
  OUTCOME_TRAFFIC: "Lưu lượng truy cập",
  OUTCOME_ENGAGEMENT: "Tương tác",
  OUTCOME_LEADS: "Khách hàng tiềm năng",
  OUTCOME_SALES: "Doanh sô",
  OUTCOME_APP_PROMOTION: "Quảng bá ứng dụng",
  
  // Legacy/Short format (nếu backend trả về format ngắn)
  AWARENESS: "Mức độ nhận biết",
  TRAFFIC: "Lưu lượng truy cập",
  ENGAGEMENT: "Tương tác",
  LEADS: "Khách hàng tiềm năng",
  SALES: "Doanh sô",
  APP_PROMOTION: "Quảng bá ứng dụng",
  
  // Other possible values
  POST_ENGAGEMENT: "Tương tác bài viết",
  CONVERSIONS: "Chuyển đổi",
  LINK_CLICKS: "Nhấp chuột liên kết",
  PAGE_LIKES: "Thích trang",
  VIDEO_VIEWS: "Lượt xem video",
  MESSAGES: "Tin nhắn",
  REACH: "Tiếp cận",
};

export const GENDER_LABELS_VN = {
  male: "Nam",
  female: "Nữ",
  1: "Nam",
  2: "Nữ",
};

export const COUNTRY_LABELS_VN = {
  VN: "Việt Nam",
  US: "Hoa Kỳ",
  JP: "Nhật Bản",
  KR: "Hàn Quốc",
  TH: "Thái Lan",
  // Thêm các quốc gia khác nếu cần
};

export const OPTIMIZATION_GOAL_LABELS_VN = {
  REACH: "Tiếp cận",
  POST_ENGAGEMENT: "Tương tác bài viết",
  LINK_CLICKS: "Nhấp chuột liên kết",
  IMPRESSIONS: "Hiển thị",
  CONVERSIONS: "Chuyển đổi",
  LEAD_GENERATION: "Tạo khách hàng tiềm năng",
  APP_INSTALLS: "Cài đặt ứng dụng",
  VIDEO_VIEWS: "Lượt xem video",
  LANDING_PAGE_VIEWS: "Lượt xem trang đích",
};