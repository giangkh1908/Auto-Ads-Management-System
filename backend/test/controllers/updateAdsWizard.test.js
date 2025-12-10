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
  updateWizard: jest.fn(),
  updateFlexibleService: jest.fn(),
}));

const User = require("../../src/models/user.model.js").default;
const AdsAccount = require("../../src/models/ads/adsAccount.model.js").default;
const { updateWizard, updateFlexibleService } = require("../../src/services/adsWizardService.js");
const { updateAdsWizard } = require("../../src/controllers/ads/adsWizard.controller.js");

function createMockRes() {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
}

function setupUserFindById(returnUser) {
  const selectMock = jest.fn().mockResolvedValue(returnUser);
  User.findById.mockReturnValue({ select: selectMock });
  return selectMock;
}

function createBaseRequest(overrides = {}) {
  return {
    body: {
      ad_account_id: "act_123",
      access_token: undefined,
      campaign: {
        name: "Test Campaign",
        objective: "OUTCOME_TRAFFIC",
      },
      adset: {
        name: "Test AdSet",
        bid_strategy: "LOWEST_COST_WITHOUT_CAP",
      },
      creative: {
        object_story_spec: { page_id: "123", message: "Test" },
      },
      ad: {
        name: "Test Ad",
      },
      dry_run: false,
      ...overrides.body,
    },
    user: {
      _id: "user123",
      shop_id: "shop123",
    },
    ...overrides,
  };
}

describe("updateAdsWizard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01: User không tồn tại → 401", async () => {
    const req = createBaseRequest({
      body: { ad_account_id: "act_123", access_token: undefined },
    });
    const res = createMockRes();

    setupUserFindById(null);

    await updateAdsWizard(req, res);

    expect(User.findById).toHaveBeenCalledWith("user123");
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Người dùng không tồn tại hoặc chưa đăng nhập.",
    });
  });

  test("UTCID02: Thiếu ad_account_id hoặc access_token → 400", async () => {
    const req1 = createBaseRequest({
      body: { ad_account_id: null, access_token: undefined },
    });
    const req2 = createBaseRequest({
      body: { ad_account_id: "act_123", access_token: undefined },
    });
    const res1 = createMockRes();
    const res2 = createMockRes();

    setupUserFindById({ _id: "user123", facebookAccessToken: null });

    await updateAdsWizard(req1, res1);
    expect(res1.status).toHaveBeenCalledWith(400);
    expect(res1.json).toHaveBeenCalledWith({
      success: false,
      message: "Thiếu ad_account_id hoặc access_token.",
    });

    await updateAdsWizard(req2, res2);
    expect(res2.status).toHaveBeenCalledWith(400);
  });

  test("UTCID03: Account không thuộc quyền sở hữu → 403", async () => {
    const req = createBaseRequest({
      body: { ad_account_id: "act_123", access_token: "token123" },
    });
    const res = createMockRes();

    setupUserFindById({ _id: "user123", facebookAccessToken: "token123" });
    AdsAccount.findOne.mockResolvedValue(null);

    await updateAdsWizard(req, res);

    expect(AdsAccount.findOne).toHaveBeenCalledWith({
      external_id: "act_123",
      $or: [
        { user: "user123" },
        { shop_admin_id: "user123" },
        { shop_user_id: "user123" },
      ],
    });
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Tài khoản quảng cáo không thuộc quyền sở hữu của bạn.",
    });
  });

  test("UTCID04: CASE 1 - Có campaign.adsets → gọi updateFlexibleService → 200", async () => {
    const req = createBaseRequest({
      body: {
        ad_account_id: "act_123",
        access_token: "token123",
        campaign: {
          name: "Test Campaign",
          adsets: [
            {
              name: "AdSet 1",
              ads: [{ name: "Ad 1" }],
            },
          ],
        },
        dry_run: false,
      },
    });
    const res = createMockRes();

    const mockAccount = {
      _id: "account123",
      external_id: "act_123",
      shop_id: "shop123",
    };
    const mockResult = {
      success: true,
      totalUpdated: 3,
      totalCreated: 1,
    };

    setupUserFindById({ _id: "user123", facebookAccessToken: "token123" });
    AdsAccount.findOne.mockResolvedValue(mockAccount);
    updateFlexibleService.mockResolvedValue(mockResult);

    await updateAdsWizard(req, res);

    expect(updateFlexibleService).toHaveBeenCalledWith({
      ad_account_id: "act_123",
      access_token: "token123",
      campaignsList: [
        expect.objectContaining({
          name: "Test Campaign",
          account_id: "account123",
          shop_id: "shop123",
          adsets: expect.any(Array),
        }),
      ],
    });
    expect(updateWizard).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Cập nhật 3 entities, tạo mới 1 entities",
      data: mockResult,
    });
  });

  test("UTCID05: CASE 2 - Không có campaign.adsets → gọi updateWizard → 200", async () => {
    const req = createBaseRequest({
      body: {
        ad_account_id: "act_123",
        access_token: "token123",
        campaign: { name: "Test Campaign" },
        adset: { name: "Test AdSet" },
        creative: { object_story_spec: { page_id: "123" } },
        ad: { name: "Test Ad" },
        dry_run: false,
      },
    });
    const res = createMockRes();

    const mockAccount = {
      _id: "account123",
      external_id: "act_123",
    };
    const mockResult = { success: true, data: "result" };

    setupUserFindById({ _id: "user123", facebookAccessToken: "token123" });
    AdsAccount.findOne.mockResolvedValue(mockAccount);
    updateWizard.mockResolvedValue(mockResult);

    await updateAdsWizard(req, res);

    expect(updateFlexibleService).not.toHaveBeenCalled();
    expect(updateWizard).toHaveBeenCalledWith({
      ad_account_id: "act_123",
      access_token: "token123",
      campaign: { name: "Test Campaign" },
      adset: { name: "Test AdSet" },
      creative: { object_story_spec: { page_id: "123" } },
      ad: { name: "Test Ad" },
      dry_run: false,
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Cập nhật wizard thành công.",
      data: mockResult,
    });
  });

  test("UTCID06: CASE 2 - bid_strategy = LOWEST_COST_WITHOUT_CAP + có bid_amount → xóa bid_amount", async () => {
    const req = createBaseRequest({
      body: {
        ad_account_id: "act_123",
        access_token: "token123",
        campaign: { name: "Test Campaign" },
        adset: {
          name: "Test AdSet",
          bid_strategy: "LOWEST_COST_WITHOUT_CAP",
          bid_amount: 100,
        },
        dry_run: false,
      },
    });
    const res = createMockRes();

    const mockAccount = { _id: "account123", external_id: "act_123" };
    const mockResult = { success: true };

    setupUserFindById({ _id: "user123", facebookAccessToken: "token123" });
    AdsAccount.findOne.mockResolvedValue(mockAccount);
    updateWizard.mockResolvedValue(mockResult);

    await updateAdsWizard(req, res);

    expect(updateWizard).toHaveBeenCalledWith(
      expect.objectContaining({
        adset: expect.not.objectContaining({
          bid_amount: expect.anything(),
        }),
      })
    );
    const callArgs = updateWizard.mock.calls[0][0];
    expect(callArgs.adset.bid_amount).toBeUndefined();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("UTCID07: dry_run = true → message 'Dry run update thành công'", async () => {
    const req = createBaseRequest({
      body: {
        ad_account_id: "act_123",
        access_token: "token123",
        campaign: { name: "Test Campaign" },
        adset: { name: "Test AdSet" },
        dry_run: true,
      },
    });
    const res = createMockRes();

    const mockAccount = { _id: "account123", external_id: "act_123" };
    const mockResult = { success: true };

    setupUserFindById({ _id: "user123", facebookAccessToken: "token123" });
    AdsAccount.findOne.mockResolvedValue(mockAccount);
    updateWizard.mockResolvedValue(mockResult);

    await updateAdsWizard(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Dry run update thành công (chưa cập nhật thật).",
      data: mockResult,
    });
  });

  test("UTCID08: dry_run = false → message 'Cập nhật wizard thành công'", async () => {
    const req = createBaseRequest({
      body: {
        ad_account_id: "act_123",
        access_token: "token123",
        campaign: { name: "Test Campaign" },
        adset: { name: "Test AdSet" },
        dry_run: false,
      },
    });
    const res = createMockRes();

    const mockAccount = { _id: "account123", external_id: "act_123" };
    const mockResult = { success: true };

    setupUserFindById({ _id: "user123", facebookAccessToken: "token123" });
    AdsAccount.findOne.mockResolvedValue(mockAccount);
    updateWizard.mockResolvedValue(mockResult);

    await updateAdsWizard(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Cập nhật wizard thành công.",
      data: mockResult,
    });
  });

  test("UTCID09: updateWizard throw error có error.response → trả đúng status + error_user_msg", async () => {
    const req = createBaseRequest({
      body: {
        ad_account_id: "act_123",
        access_token: "token123",
        campaign: { name: "Test Campaign" },
        adset: { name: "Test AdSet" },
      },
    });
    const res = createMockRes();

    const mockAccount = { _id: "account123", external_id: "act_123" };
    const mockError = {
      response: {
        status: 400,
        data: {
          error_user_msg: "FB error message",
        },
      },
    };

    setupUserFindById({ _id: "user123", facebookAccessToken: "token123" });
    AdsAccount.findOne.mockResolvedValue(mockAccount);
    updateWizard.mockRejectedValue(mockError);

    await updateAdsWizard(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Cập nhật wizard thất bại.",
      error_user_msg: "FB error message",
    });
  });

  test("UTCID10: updateWizard throw error thường → 500", async () => {
    const req = createBaseRequest({
      body: {
        ad_account_id: "act_123",
        access_token: "token123",
        campaign: { name: "Test Campaign" },
        adset: { name: "Test AdSet" },
      },
    });
    const res = createMockRes();

    const mockAccount = { _id: "account123", external_id: "act_123" };
    const mockError = new Error("Generic error");

    setupUserFindById({ _id: "user123", facebookAccessToken: "token123" });
    AdsAccount.findOne.mockResolvedValue(mockAccount);
    updateWizard.mockRejectedValue(mockError);

    await updateAdsWizard(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Cập nhật wizard thất bại.",
      error_user_msg: null,
    });
  });

  test("UTCID11: CASE 1 - updateFlexibleService throw error → trả đúng status", async () => {
    const req = createBaseRequest({
      body: {
        ad_account_id: "act_123",
        access_token: "token123",
        campaign: {
          name: "Test Campaign",
          adsets: [{ name: "AdSet 1", ads: [] }],
        },
      },
    });
    const res = createMockRes();

    const mockAccount = { _id: "account123", external_id: "act_123", shop_id: "shop123" };
    const mockError = {
      response: {
        status: 429,
        data: {
          error: {
            error_user_msg: "Rate limit exceeded",
          },
        },
      },
    };

    setupUserFindById({ _id: "user123", facebookAccessToken: "token123" });
    AdsAccount.findOne.mockResolvedValue(mockAccount);
    updateFlexibleService.mockRejectedValue(mockError);

    await updateAdsWizard(req, res);

    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Cập nhật wizard thất bại.",
      error_user_msg: "Rate limit exceeded",
    });
  });
});

