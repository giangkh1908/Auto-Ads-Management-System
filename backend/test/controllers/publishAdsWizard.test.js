// Mock models và service
jest.mock("../../src/models/user.model.js", () => ({
    __esModule: true,
    default: {
      findById: jest.fn(),
    },
  }));
  
  jest.mock("../../src/models/ads/adsAccount.model.js", () => ({
    __esModule: true,
    default: {
      findOne: jest.fn(),
    },
  }));
  
  jest.mock("../../src/services/adsWizardService.js", () => ({
    __esModule: true,
    publishWizard: jest.fn(),
  }));
  
  // Lấy mock đã khai báo ở trên
  const User = require("../../src/models/user.model.js").default;
  const AdsAccount = require("../../src/models/ads/adsAccount.model.js").default;
  const { publishWizard } = require("../../src/services/adsWizardService.js");
  const { publishAdsWizard } = require("../../src/controllers/ads/adsWizard.controller.js");
  
  // Mock res chuẩn Express
  function createMockRes() {
    const res = {};
    res.status = jest.fn(() => res);
    res.json = jest.fn(() => res);
    return res;
  }
  
  // Mock chain User.findById(...).select(...)
  // Controller đang: await User.findById(id).select("+facebookAccessToken")
  function setupUserFindById(returnUser) {
    const selectMock = jest.fn().mockResolvedValue(returnUser);
    User.findById.mockReturnValue({ select: selectMock });
    return selectMock;
  }
  
  // Tạo req base cho các test, cho phép override
  function createBaseRequest(overrides = {}) {
    return {
      body: {
        ad_account_id: "act_123",
        access_token: undefined, // mặc định ưu tiên token DB
        campaign: {
          name: "Test Campaign",
          objective: "CONVERSIONS",
          page_id: "page_1",
          page_name: "Page Name",
        },
        adset: {
          name: "Test Adset",
        },
        creative: {
          object_story_spec: { link_data: {} },
        },
        ad: {
          name: "Test Ad",
        },
        dry_run: false,
        ...overrides.body,
      },
      user: {
        _id: "user_1",
        shop_id: "shop_1",
        ...overrides.user,
      },
    };
  }
  
  describe("publishAdsWizard controller", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
  
    test("UTCID01: User không tồn tại → trả 401", async () => {
      const res = createMockRes();
      const req = createBaseRequest();
  
      setupUserFindById(null);
  
      await publishAdsWizard(req, res);
  
      expect(User.findById).toHaveBeenCalledWith(req.user._id);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Người dùng không tồn tại hoặc chưa đăng nhập.",
        })
      );
      // Không được đi tiếp
      expect(AdsAccount.findOne).not.toHaveBeenCalled();
      expect(publishWizard).not.toHaveBeenCalled();
    });
  
    test("UTCID02: Thiếu ad_account_id hoặc access_token → 400", async () => {
      const res = createMockRes();
      const req = createBaseRequest({
        body: {
          ad_account_id: undefined,
        },
      });
  
      setupUserFindById({
        _id: "user_1",
        facebookAccessToken: null,
      });
  
      await publishAdsWizard(req, res);
  
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Thiếu ad_account_id hoặc access_token.",
        })
      );
      expect(AdsAccount.findOne).not.toHaveBeenCalled();
      expect(publishWizard).not.toHaveBeenCalled();
    });
  
    test("UTCID03: Tài khoản ads không thuộc quyền user → 403", async () => {
      const res = createMockRes();
      const req = createBaseRequest();
  
      setupUserFindById({
        _id: "user_1",
        facebookAccessToken: "token_db",
      });
      AdsAccount.findOne.mockResolvedValue(null);
  
      await publishAdsWizard(req, res);
  
      expect(AdsAccount.findOne).toHaveBeenCalledWith({
        external_id: "act_123",
        $or: [
          { user: req.user._id },
          { shop_admin_id: req.user._id },
          { shop_user_id: req.user._id },
        ],
      });
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Tài khoản quảng cáo không thuộc quyền sở hữu của bạn.",
        })
      );
      expect(publishWizard).not.toHaveBeenCalled();
    });
  
    test("UTCID04: Thiếu campaign.name hoặc campaign.objective → 400", async () => {
      const res = createMockRes();
      const req = createBaseRequest({
        body: {
          campaign: {
            name: "",
            objective: "",
          },
        },
      });
  
      setupUserFindById({
        _id: "user_1",
        facebookAccessToken: "token_db",
      });
      AdsAccount.findOne.mockResolvedValue({ _id: "acc_1", shop_id: "shop_1" });
  
      await publishAdsWizard(req, res);
  
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Thiếu thông tin chiến dịch (tên hoặc mục tiêu).",
        })
      );
      expect(publishWizard).not.toHaveBeenCalled();
    });
  
    test("UTCID05: Thiếu adset.name → 400", async () => {
      const res = createMockRes();
      const req = createBaseRequest({
        body: {
          adset: {},
        },
      });
  
      setupUserFindById({
        _id: "user_1",
        facebookAccessToken: "token_db",
      });
      AdsAccount.findOne.mockResolvedValue({ _id: "acc_1", shop_id: "shop_1" });
  
      await publishAdsWizard(req, res);
  
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Thiếu tên nhóm quảng cáo (Ad Set).",
        })
      );
      expect(publishWizard).not.toHaveBeenCalled();
    });
  
    test("UTCID06: Thiếu creative.object_story_spec → 400", async () => {
      const res = createMockRes();
      const req = createBaseRequest({
        body: {
          creative: {},
        },
      });
  
      setupUserFindById({
        _id: "user_1",
        facebookAccessToken: "token_db",
      });
      AdsAccount.findOne.mockResolvedValue({ _id: "acc_1", shop_id: "shop_1" });
  
      await publishAdsWizard(req, res);
  
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Thiếu nội dung quảng cáo (Creative.object_story_spec).",
        })
      );
      expect(publishWizard).not.toHaveBeenCalled();
    });
  
    test("UTCID07: bid_strategy = LOWEST_COST_WITHOUT_CAP + có bid_amount → publishWizard được gọi không có bid_amount", async () => {
      const res = createMockRes();
      const req = createBaseRequest({
        body: {
          adset: {
            name: "Test Adset",
            bid_strategy: "LOWEST_COST_WITHOUT_CAP",
            bid_amount: 1000,
          },
        },
      });
  
      setupUserFindById({
        _id: "user_1",
        facebookAccessToken: "token_db",
      });
      AdsAccount.findOne.mockResolvedValue({ _id: "acc_1", shop_id: "shop_1" });
      publishWizard.mockResolvedValue({
        campaign: {},
        adset: {},
        ad: {},
        creative: {},
        drafts: {},
      });
  
      await publishAdsWizard(req, res);
  
      expect(publishWizard).toHaveBeenCalledTimes(1);
      const arg = publishWizard.mock.calls[0][0];
  
      expect(arg.adset.name).toBe("Test Adset");
      expect(arg.adset.bid_strategy).toBe("LOWEST_COST_WITHOUT_CAP");
      expect(arg.adset.bid_amount).toBeUndefined(); // phải bị xóa
    });
  
    test("UTCID08: Happy path dry_run = true → 201 + message dry_run", async () => {
      const res = createMockRes();
      const req = createBaseRequest({
        body: {
          dry_run: true,
        },
      });
  
      setupUserFindById({
        _id: "user_1",
        facebookAccessToken: "token_db",
      });
      AdsAccount.findOne.mockResolvedValue({ _id: "acc_1", shop_id: "shop_1" });
      publishWizard.mockResolvedValue({
        campaign: { id: "c1" },
        adset: { id: "s1" },
        ad: { id: "a1" },
        creative: { id: "cr1" },
        drafts: {},
      });
  
      await publishAdsWizard(req, res);
  
      expect(publishWizard).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Dry run thành công (chưa publish thật).",
        })
      );
    });
  
    test("UTCID09: Happy path dry_run = false → 201 + message publish", async () => {
      const res = createMockRes();
      const req = createBaseRequest({
        body: {
          dry_run: false,
        },
      });
  
      setupUserFindById({
        _id: "user_1",
        facebookAccessToken: "token_db",
      });
      AdsAccount.findOne.mockResolvedValue({ _id: "acc_1", shop_id: "shop_1" });
      publishWizard.mockResolvedValue({
        campaign: { id: "c1" },
        adset: { id: "s1" },
        ad: { id: "a1" },
        creative: { id: "cr1" },
        drafts: {},
      });
  
      await publishAdsWizard(req, res);
  
      expect(publishWizard).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Publish thành công.",
        })
      );
    });
  
    test("UTCID10: publishWizard throw error có error.response → trả đúng status + error_user_msg", async () => {
      const res = createMockRes();
      const req = createBaseRequest();
  
      setupUserFindById({
        _id: "user_1",
        facebookAccessToken: "token_db",
      });
      AdsAccount.findOne.mockResolvedValue({ _id: "acc_1", shop_id: "shop_1" });
  
      const error = {
        response: {
          status: 502,
          data: {
            error_user_msg: "FB error message",
          },
        },
      };
      publishWizard.mockRejectedValue(error);
  
      await publishAdsWizard(req, res);
  
      expect(res.status).toHaveBeenCalledWith(502);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Publish thất bại.",
          error_user_msg: "FB error message",
        })
      );
    });
  
    test("UTCID11: publishWizard throw error thường → 500", async () => {
      const res = createMockRes();
      const req = createBaseRequest();
  
      setupUserFindById({
        _id: "user_1",
        facebookAccessToken: "token_db",
      });
      AdsAccount.findOne.mockResolvedValue({ _id: "acc_1", shop_id: "shop_1" });
  
      const error = new Error("Unexpected");
      publishWizard.mockRejectedValue(error);
  
      await publishAdsWizard(req, res);
  
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Publish thất bại.",
          error_user_msg: null,
        })
      );
    });
  });
  