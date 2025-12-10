// backend/test/controllers/confirmContext.test.js

// Mock Google Generative AI để tránh gọi SDK thật và đảm bảo có getGenerativeModel
jest.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn(() => ({
      generateContent: jest.fn(),
    })),
  })),
}));

// Mock các dependency ESM khác để Jest không phải load code thật trong node_modules
jest.mock("uuid", () => ({
  v4: () => "test-uuid-12345678",
}));

jest.mock("openai", () => ({
  OpenAI: jest.fn().mockImplementation(() => ({})),
}));

jest.mock("cloudinary", () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload: jest.fn(),
    },
  },
}));

jest.mock("../../src/models/ai/aiConfig.model.js", () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    updateMany: jest.fn(),
    create: jest.fn(),
  },
}));

const AIConfig = require("../../src/models/ai/aiConfig.model.js").default;
const { confirmContext } = require("../../src/controllers/ai/aiControllers.js");

function createMockRes() {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
}

function createReqWithBody(body = {}, user = { _id: "user_1" }) {
  return {
    body,
    user,
  };
}

describe("confirmContext controller", () => {
  beforeAll(() => {
    // Không cho Math.random thật chạy lung tung trong test
    jest.spyOn(Math, "random").mockReturnValue(0.5); // > 0.1 → không trigger cleanup
  });

  afterAll(() => {
    Math.random.mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("UTCID01: Có config_id nhưng config không tồn tại → 404", async () => {
    const req = createReqWithBody({
      config_id: "cfg_1",
      main_keywords: ["giày thể thao"],
    });
    const res = createMockRes();

    AIConfig.findOne.mockResolvedValue(null);

    await confirmContext(req, res);

    expect(AIConfig.findOne).toHaveBeenCalledWith({
      _id: "cfg_1",
      $or: [{ user_id: req.user._id }, { is_system_template: true }],
    });

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Config không tồn tại hoặc không có quyền truy cập",
      })
    );
  });

  test("UTCID02: Có config_id hợp lệ → tạo context từ config + main_keywords, trả 200", async () => {
    const req = createReqWithBody({
      config_id: "cfg_1",
      main_keywords: ["giày thể thao", "chạy bộ"],
    });
    const res = createMockRes();

    const fakeConfig = {
      _id: "cfg_1",
      metadata: {
        language: "vi",
        tone: "thu_gian",
        personalization: "Quảng cáo giày chạy bộ cao cấp",
      },
      model: "gpt-4o-mini",
    };

    AIConfig.findOne.mockResolvedValue(fakeConfig);
    AIConfig.findByIdAndUpdate.mockResolvedValue(null);

    const nowSpy = jest.spyOn(Date, "now").mockReturnValue(1_000_000);

    await confirmContext(req, res);

    nowSpy.mockRestore();

    expect(AIConfig.findOne).toHaveBeenCalledWith({
      _id: "cfg_1",
      $or: [{ user_id: req.user._id }, { is_system_template: true }],
    });

    expect(AIConfig.findByIdAndUpdate).toHaveBeenCalledWith("cfg_1", {
      $inc: { usage_count: 1 },
      $set: { last_used_at: expect.any(Date) },
    });

    expect(res.status).toHaveBeenCalledWith(200);

    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.context_id).toMatch(/^ctx_/);
    expect(body.expires_in).toBe(1800); // TTL / 1000
    expect(body.model).toBe("gpt-4o-mini");
  });

  test("UTCID03: Không có config_id và thiếu language/tone/main_keywords → 400", async () => {
    const req = createReqWithBody({
      // thiếu language, tone, main_keywords
    });
    const res = createMockRes();

    await confirmContext(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message:
          "Thiếu thông tin context (language, tone, main_keywords) hoặc config_id",
      })
    );
  });

  test("UTCID04: Không có config_id, có language/tone/main_keywords → tạo context tạm, trả 200 (model từ body)", async () => {
    const req = createReqWithBody({
      language: "vi",
      tone: "chuyen_nghiep",
      personalization: "Quảng cáo phần mềm CRM",
      main_keywords: ["CRM", "quản lý khách hàng"],
      model: "gpt-4o-mini",
    });
    const res = createMockRes();

    const nowSpy = jest.spyOn(Date, "now").mockReturnValue(2_000_000);

    await confirmContext(req, res);

    nowSpy.mockRestore();

    expect(res.status).toHaveBeenCalledWith(200);

    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.context_id).toMatch(/^ctx_/);
    expect(body.expires_in).toBe(1800);
    expect(body.model).toBe("gpt-4o-mini");
  });

  test("UTCID05: Không có config_id, có language/tone/main_keywords nhưng không truyền model → model = null", async () => {
    const req = createReqWithBody({
      language: "vi",
      tone: "thu_gian",
      personalization: "Quảng cáo khóa học online",
      main_keywords: ["khóa học online"],
      // không truyền model
    });
    const res = createMockRes();

    await confirmContext(req, res);

    expect(res.status).toHaveBeenCalledWith(200);

    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.context_id).toMatch(/^ctx_/);
    expect(body.model).toBeNull();
  });

  test("UTCID06: Lỗi bất ngờ trong xử lý (findOne throw) → 500", async () => {
    const req = createReqWithBody({
      config_id: "cfg_1",
      main_keywords: ["keyword"],
    });
    const res = createMockRes();

    AIConfig.findOne.mockRejectedValue(new Error("DB error"));

    await confirmContext(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Lỗi khi xác nhận context",
        error: "DB error",
      })
    );
  });
});
