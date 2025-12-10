
 jest.mock("../../src/services/analyticsSnapshotService.js", () => ({
  __esModule: true,
  syncAnalyticsSnapshots: jest.fn(),
}));

 jest.mock("../../src/models/ads/adsAccount.model.js", () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
    findOne: jest.fn(),
  },
}));

 const { syncAnalyticsSnapshots } = require("../../src/services/analyticsSnapshotService.js");
 const AdsAccount = require("../../src/models/ads/adsAccount.model.js").default;
 const {
   syncAnalyticsSnapshotsCtrl,
 } = require("../../src/controllers/analytics/analyticsSnapshot.controller.js");

function createMockRes() {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
}

function createReq(body = {}) {
  return { body };
}

describe("syncAnalyticsSnapshotsCtrl", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01 (A): Thiếu account_id → 400", async () => {
    const req = createReq({});
    const res = createMockRes();

    await syncAnalyticsSnapshotsCtrl(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "account_id is required" })
    );
  });

  test("UTCID02 (A): account_id là ObjectId hợp lệ nhưng không tìm thấy account → 404", async () => {
    const objectId = "507f1f77bcf86cd799439011";
    const req = createReq({ account_id: objectId });
    const res = createMockRes();

    AdsAccount.findById.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(null),
    });

    await syncAnalyticsSnapshotsCtrl(req, res);

    expect(AdsAccount.findById).toHaveBeenCalledWith(objectId);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Account not found" })
    );
  });

  test("UTCID03 (A): account_id là external_id nhưng không tìm thấy account → 404", async () => {
    const externalId = "act_1234567890";
    const req = createReq({ account_id: externalId });
    const res = createMockRes();

    AdsAccount.findOne.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(null),
    });

    await syncAnalyticsSnapshotsCtrl(req, res);

    expect(AdsAccount.findOne).toHaveBeenCalledWith({ external_id: externalId });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Account not found" })
    );
  });

  test("UTCID04 (N): account hợp lệ, syncAnalyticsSnapshots trả rateLimited=false → 200", async () => {
    const externalId = "act_123";
    const accountDoc = {
      _id: "acc_db_id",
      external_id: externalId,
      name: "Test Account",
    };

    const req = createReq({ account_id: externalId });
    const res = createMockRes();

    AdsAccount.findOne.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(accountDoc),
    });

    syncAnalyticsSnapshots.mockResolvedValue({
      synced: 10,
      errors: 2,
      skipped: 1,
      rateLimited: false,
    });

    await syncAnalyticsSnapshotsCtrl(req, res);

    expect(syncAnalyticsSnapshots).toHaveBeenCalledWith(accountDoc);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Sync completed",
        synced: 10,
        errors: 2,
      })
    );
  });

  test("UTCID05 (A): syncAnalyticsSnapshots trả rateLimited=true → 429", async () => {
    const externalId = "act_456";
    const accountDoc = {
      _id: "acc_db_id",
      external_id: externalId,
      name: "Test Account",
    };

    const req = createReq({ account_id: externalId });
    const res = createMockRes();

    AdsAccount.findOne.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(accountDoc),
    });

    syncAnalyticsSnapshots.mockResolvedValue({
      synced: 5,
      errors: 1,
      rateLimited: true,
    });

    await syncAnalyticsSnapshotsCtrl(req, res);

    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message:
          "Đã vượt quá giới hạn số lượng request. Vui lòng chờ một chút và thử lại.",
        synced: 5,
        errors: 1,
        rateLimitReached: true,
        retryAfter: 60,
      })
    );
  });

  test("UTCID06 (A): syncAnalyticsSnapshots throw FB rate limit (code 17/4) → 429", async () => {
    const externalId = "act_789";
    const accountDoc = {
      _id: "acc_db_id",
      external_id: externalId,
      name: "Test Account",
    };

    const req = createReq({ account_id: externalId });
    const res = createMockRes();

    AdsAccount.findOne.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(accountDoc),
    });

    const fbError = {
      response: {
        data: {
          error: {
            code: 17,
            error_user_msg: "Rate limit reached",
          },
        },
      },
    };
    syncAnalyticsSnapshots.mockRejectedValue(fbError);

    await syncAnalyticsSnapshotsCtrl(req, res);

    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Rate limit reached",
        synced: 0,
        errors: 1,
        rateLimitReached: true,
        retryAfter: 60,
      })
    );
  });

  test("UTCID07 (A): syncAnalyticsSnapshots throw generic error → 500", async () => {
    const externalId = "act_999";
    const accountDoc = {
      _id: "acc_db_id",
      external_id: externalId,
      name: "Test Account",
    };

    const req = createReq({ account_id: externalId });
    const res = createMockRes();

    AdsAccount.findOne.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(accountDoc),
    });

    syncAnalyticsSnapshots.mockRejectedValue(new Error("Unexpected error"));

    await syncAnalyticsSnapshotsCtrl(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Error syncing analytics snapshots",
        error: "Unexpected error",
      })
    );
  });
});


