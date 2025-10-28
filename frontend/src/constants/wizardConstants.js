// Constants và initial data cho CreateAdsWizard

export const INITIAL_DATA = {
  campaign: {
    id: 1,
    name: "Chiến dịch mới",
    status: "PAUSED",
    objective: "AWARENESS", // dùng key UI thay vì mã API
    budgetType: "CAMPAIGN",
    facebookPage: null,
    facebookPageId: null,
    facebookPageAvatar: null,
    createdAt: new Date().toISOString(),
    adsets: [
      {
        id: 101,
        _id: null,
        name: "Nhóm quảng cáo mới",
        status: "PAUSED",
        budgetType: "daily",
        budgetAmount: 100000,
        targeting: {
          // ĐỒNG BỘ HÓA CẤU TRÚC DỮ LIỆU TẠI ĐÂY
          geo_locations: {
            countries: ["VN"],
          },
          age_min: 18,
          age_max: 65,
          publisher_platforms: ["facebook"],
          facebook_positions: ["feed", "video_feeds", "marketplace", "search"],
        },
        optimization_goal: "REACH",
        billing_event: "IMPRESSIONS",
        promoted_object: null,
        bid_strategy: "LOWEST_COST_WITHOUT_CAP",
        ads: [
          {
            id: 1001,
            adset_id: null,
            page_id: null,
            name: "Quảng cáo mới",
            status: "PAUSED",
            media: "text",
            mediaUrl: "",
            primaryText: "Khám phá sản phẩm/dịch vụ tuyệt vời của chúng tôi!",
            headline: "Sản phẩm/Dịch vụ chất lượng cao",
            description:
              "Đội ngũ chuyên nghiệp, kinh nghiệm lâu năm trong lĩnh vực.",
            cta: "LEARN_MORE",
            destinationUrl: "https://fchat.vn",
          },
        ],
      },
    ],
  },
  adset: {
    id: 101,
    _id: null,
    name: "Nhóm quảng cáo mới",
    status: "PAUSED",
    budgetType: "daily",
    budgetAmount: 100000,
    targeting: {
      location: "Việt Nam",
      ageMin: 18,
      ageMax: 65,
      gender: "all",
    },
    optimization_goal: "REACH",
    billing_event: "IMPRESSIONS",
    promoted_object: null,
    bid_strategy: "LOWEST_COST_WITHOUT_CAP",
    ads: [],
  },
  ad: {
    id: 1001,
    adset_id: null,
    page_id: null,
    name: "Quảng cáo mới",
    status: "PAUSED",
    media: "text",
    mediaUrl: "",
    primaryText: "Khám phá sản phẩm/dịch vụ tuyệt vời của chúng tôi!",
    headline: "Sản phẩm/Dịch vụ chất lượng cao",
    description: "Đội ngũ chuyên nghiệp, kinh nghiệm lâu năm trong lĩnh vực.",
    cta: "LEARN_MORE",
    destinationUrl: "https://fchat.vn",
  },
};

export const INITIAL_ADSET_STATE = {
  _id: `temp_adset_${Date.now()}`,
  name: "Nhóm quảng cáo mới",
  billing_event: "IMPRESSIONS",
  optimization_goal: "REACH",
  daily_budget: 50000,
  start_time: new Date().toISOString(),
  end_time: null,
  targeting: {
    geo_locations: {
      countries: ["VN"],
    },
    age_min: 18,
    age_max: 65,
    // Thêm 2 dòng này để giới hạn vị trí quảng cáo chỉ trên Facebook
    publisher_platforms: ["facebook"],
    facebook_positions: ["feed", "video_feeds", "marketplace", "search"],
  },
  status: "PAUSED",
  campaign_id: null,
  ads: [],
};

export const INITIAL_CAMPAIGN_STATE = {
  id: 1,
  name: "Chiến dịch mới",
  status: "PAUSED",
  objective: "AWARENESS", // dùng key UI thay vì mã API
  budgetType: "CAMPAIGN",
  facebookPage: null,
  facebookPageId: null,
  facebookPageAvatar: null,
  createdAt: new Date().toISOString(),
  adsets: [
    {
      id: 101,
      _id: null,
      name: "Nhóm quảng cáo mới",
      status: "PAUSED",
      budgetType: "daily",
      budgetAmount: 100000,
      targeting: {
        // ĐỒNG BỘ HÓA CẤU TRÚC DỮ LIỆU TẠI ĐÂY
        geo_locations: {
          countries: ["VN"],
        },
        age_min: 18,
        age_max: 65,
        publisher_platforms: ["facebook"],
        facebook_positions: ["feed", "video_feeds", "marketplace", "search"],
      },
      optimization_goal: "REACH",
      billing_event: "IMPRESSIONS",
      promoted_object: null,
      bid_strategy: "LOWEST_COST_WITHOUT_CAP",
      ads: [
        {
          id: 1001,
          adset_id: null,
          page_id: null,
          name: "Quảng cáo mới",
          status: "PAUSED",
          media: "text",
          mediaUrl: "",
          primaryText: "Khám phá sản phẩm/dịch vụ tuyệt vời của chúng tôi!",
          headline: "Sản phẩm/Dịch vụ chất lượng cao",
          description:
            "Đội ngũ chuyên nghiệp, kinh nghiệm lâu năm trong lĩnh vực.",
          cta: "LEARN_MORE",
          destinationUrl: "https://fchat.vn",
        },
      ],
    },
  ],
};

// Map UI objectives sang API objectives (Meta outcome-based)
export const FB_OBJECTIVE_MAP = {
  AWARENESS: "OUTCOME_AWARENESS",
  TRAFFIC: "OUTCOME_TRAFFIC",
  ENGAGEMENT: "OUTCOME_ENGAGEMENT",
  LEADS: "OUTCOME_LEADS",
  SALES: "OUTCOME_SALES",
  APP_PROMOTION: "OUTCOME_APP_PROMOTION",
};

// Mặc định các giá trị optimization_goal và billing_event theo tài liệu Meta v23.0
export const FB_ADSET_DEFAULTS_BY_OBJECTIVE = {
  OUTCOME_AWARENESS: {
    optimization_goal: "REACH",
    billing_event: "IMPRESSIONS",
    promoted_object: null,
  },
  OUTCOME_TRAFFIC: {
    optimization_goal: "LINK_CLICKS",
    billing_event: "IMPRESSIONS",
    promoted_object: null,
  },
  OUTCOME_ENGAGEMENT: {
    optimization_goal: "POST_ENGAGEMENT",
    billing_event: "IMPRESSIONS",
    promoted_object: { page_id: null },
  },
  OUTCOME_LEADS: {
    optimization_goal: "LEAD_GENERATION",
    billing_event: "IMPRESSIONS",
    promoted_object: { page_id: null }, // cần page_id để tạo form lead
  },
  OUTCOME_SALES: {
    optimization_goal: "OFFSITE_CONVERSIONS",
    billing_event: "IMPRESSIONS",
    promoted_object: { pixel_id: null, custom_event_type: "PURCHASE" },
  },
  OUTCOME_APP_PROMOTION: {
    optimization_goal: "APP_INSTALLS",
    billing_event: "IMPRESSIONS",
    promoted_object: {
      application_id: null,
      object_store_url: null,
      custom_event_type: "APP_INSTALLS",
    },
  },
};

// Các bước Wizard
export const WIZARD_STEPS = {
  TARGET: 0, // chọn mục tiêu
  CAMPAIGN: 1, // thông tin chiến dịch
  ADSET: 2, // nhóm quảng cáo
  AD: 3, // quảng cáo
  CREATIVE: 4, // xem trước
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

// Helper lấy mặc định AdSet theo mục tiêu campaign
export const getAdsetDefaultsByObjective = (uiObjective) => {
  const fbObjective = FB_OBJECTIVE_MAP[uiObjective];
  const defaults = FB_ADSET_DEFAULTS_BY_OBJECTIVE[fbObjective];
  return (
    defaults || {
      optimization_goal: "REACH",
      billing_event: "IMPRESSIONS",
      promoted_object: null,
    }
  );
};

// Cấu hình chi tiết cho Adset theo từng mục tiêu chiến dịch
export const ADSET_CONFIG_BY_OBJECTIVE = {
  AWARENESS: {
    optimization_goals: [
      { value: "REACH", label: "Số người tiếp cận (Reach)" },
      { value: "IMPRESSIONS", label: "Số lần hiển thị (Impressions)" },
      { value: "AD_RECALL_LIFT", label: "Mức độ ghi nhớ quảng cáo" },
      { value: "THRUPLAY", label: "Lượt xem video ThruPlay" },
    ],
    billing_events: ["IMPRESSIONS"],
  },
  TRAFFIC: {
    optimization_goals: [
      { value: "LINK_CLICKS", label: "Lượt nhấp vào liên kết" },
      { value: "LANDING_PAGE_VIEWS", label: "Lượt xem trang đích" },
      { value: "IMPRESSIONS", label: "Số lần hiển thị" },
    ],
    billing_events: ["IMPRESSIONS", "LINK_CLICKS"],
  },
  ENGAGEMENT: {
    optimization_goals: [
      { value: "POST_ENGAGEMENT", label: "Lượt tương tác với bài viết" },
      { value: "PAGE_LIKES", label: "Lượt thích trang" },
      { value: "EVENT_RESPONSES", label: "Lượt phản hồi sự kiện" },
      { value: "THRUPLAY", label: "Lượt xem video ThruPlay" },
    ],
    billing_events: ["IMPRESSIONS"],
  },
  LEADS: {
    optimization_goals: [
      { value: "LEAD_GENERATION", label: "Khách hàng tiềm năng" },
      { value: "CONVERSIONS", label: "Lượt chuyển đổi" },
    ],
    billing_events: ["IMPRESSIONS"],
  },
  SALES: {
    optimization_goals: [
      { value: "OFFSITE_CONVERSIONS", label: "Lượt chuyển đổi" },
      { value: "LINK_CLICKS", label: "Lượt nhấp vào liên kết" },
      { value: "LANDING_PAGE_VIEWS", label: "Lượt xem trang đích" },
    ],
    billing_events: ["IMPRESSIONS"],
  },
  APP_PROMOTION: {
    optimization_goals: [
      { value: "APP_INSTALLS", label: "Lượt cài đặt ứng dụng" },
      { value: "LINK_CLICKS", label: "Lượt nhấp vào liên kết" },
    ],
    billing_events: ["IMPRESSIONS", "APP_INSTALLS"],
  },
};
