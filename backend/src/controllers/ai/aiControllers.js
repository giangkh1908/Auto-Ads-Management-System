import dotenv from "dotenv";
import AIConfig from "../../models/ai/aiConfig.model.js";

dotenv.config();


/**
 * POST /api/ai/configs
 * Tạo AI config mới
 */
export async function createAIConfig(req, res) {
  try {
    const userId = req.user._id;
    const {
      name,
      character,
      skills = [],
      limitations = [],
      model = "gpt-4o-mini",
      opening_question = "",
      auto_suggestions = false,
      metadata = {},
      is_default = false,
    } = req.body;

    if (!name || !character) {
      return res.status(400).json({
        success: false,
        message: "Tên và Character là bắt buộc",
      });
    }

    if (is_default) {
      await AIConfig.updateMany(
        { user_id: userId, is_default: true },
        { $set: { is_default: false } }
      );
    }

    const config = await AIConfig.create({
      user_id: userId,
      name,
      character,
      skills: skills.filter(s => s.trim()),
      limitations: limitations.filter(l => l.trim()),
      model,
      opening_question,
      auto_suggestions,
      metadata: {
        language: metadata.language || "vi",
        tone: metadata.tone || "chuyen_nghiep",
        personalization: metadata.personalization || "",
      },
      is_default,
      is_system_template: false,
    });

    return res.status(201).json({
      success: true,
      config,
    });
  } catch (error) {
    console.error("Error creating AI config:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi tạo config",
      error: error.message,
    });
  }
}

/**
 * GET /api/ai/configs
 * Lấy danh sách AI configs
 */
export async function getAIConfigs(req, res) {
  try {
    const userId = req.user._id;
    const { include = "own,templates" } = req.query;
    const includes = include.split(",");

    const query = [];

    if (includes.includes("own")) {
      query.push({ user_id: userId, is_system_template: false });
    }

    if (includes.includes("templates")) {
      query.push({ is_system_template: true });
    }

    if (query.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid include parameter",
      });
    }

    const configs = await AIConfig.find({
      $or: query,
    })
      .sort({ is_default: -1, last_used_at: -1, created_at: -1 })
      .select("-__v");

    return res.status(200).json({
      success: true,
      configs,
    });
  } catch (error) {
    console.error("Error getting AI configs:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách configs",
      error: error.message,
    });
  }
}

/**
 * GET /api/ai/configs/:id
 * Lấy chi tiết AI config
 */
export async function getAIConfig(req, res) {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const config = await AIConfig.findOne({
      _id: id,
      $or: [
        { user_id: userId },
        { is_system_template: true },
      ],
    });

    if (!config) {
      return res.status(404).json({
        success: false,
        message: "Config không tồn tại hoặc không có quyền truy cập",
      });
    }

    return res.status(200).json({
      success: true,
      config,
    });
  } catch (error) {
    console.error("Error getting AI config:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi lấy config",
      error: error.message,
    });
  }
}

/**
 * PUT /api/ai/configs/:id
 * Cập nhật AI config
 */
export async function updateAIConfig(req, res) {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const updateData = req.body;

    const config = await AIConfig.findOne({
      _id: id,
      user_id: userId,
      is_system_template: false,
    });

    if (!config) {
      return res.status(404).json({
        success: false,
        message: "Config không tồn tại hoặc không có quyền cập nhật",
      });
    }

    if (updateData.is_default && !config.is_default) {
      await AIConfig.updateMany(
        { user_id: userId, _id: { $ne: id }, is_default: true },
        { $set: { is_default: false } }
      );
    }

    if (updateData.skills) {
      updateData.skills = updateData.skills.filter(s => s.trim());
    }
    if (updateData.limitations) {
      updateData.limitations = updateData.limitations.filter(l => l.trim());
    }

    Object.assign(config, updateData);
    await config.save();

    return res.status(200).json({
      success: true,
      config,
    });
  } catch (error) {
    console.error("Error updating AI config:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật config",
      error: error.message,
    });
  }
}

/**
 * DELETE /api/ai/configs/:id
 * Xóa AI config
 */
export async function deleteAIConfig(req, res) {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const config = await AIConfig.findOne({
      _id: id,
      user_id: userId,
      is_system_template: false,
    });

    if (!config) {
      return res.status(404).json({
        success: false,
        message: "Config không tồn tại hoặc không có quyền xóa",
      });
    }

    await AIConfig.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Đã xóa config thành công",
    });
  } catch (error) {
    console.error("Error deleting AI config:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi xóa config",
      error: error.message,
    });
  }
}

/**
 * POST /api/ai/configs/:id/set-default
 * Set config làm default
 */
export async function setDefaultAIConfig(req, res) {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const config = await AIConfig.findOne({
      _id: id,
      user_id: userId,
      is_system_template: false,
    });

    if (!config) {
      return res.status(404).json({
        success: false,
        message: "Config không tồn tại hoặc không có quyền truy cập",
      });
    }

    await AIConfig.updateMany(
      { user_id: userId, _id: { $ne: id }, is_default: true },
      { $set: { is_default: false } }
    );

    config.is_default = true;
    await config.save();

    return res.status(200).json({
      success: true,
      config,
    });
  } catch (error) {
    console.error("Error setting default AI config:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi set default config",
      error: error.message,
    });
  }
}

/**
 * GET /api/ai/configs/:id/preview-prompt
 * Preview prompt sẽ được dùng khi generate với config này
 */
export async function previewAIConfigPrompt(req, res) {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { target = "headline", max_len = 60 } = req.query;

    const config = await AIConfig.findOne({
      _id: id,
      $or: [
        { user_id: userId },
        { is_system_template: true },
      ],
    });

    if (!config) {
      return res.status(404).json({
        success: false,
        message: "Config không tồn tại hoặc không có quyền truy cập",
      });
    }

    const language = config.metadata?.language || "vi";
    const tone = config.metadata?.tone || "chuyen_nghiep";
    const personalization = config.metadata?.personalization || "";
    const keywords = "";

    let previewPrompt = "";
    let hasCustomPrompt = false;
    let isUsingCustomTemplate = false;

    // Check if using custom template
    if (config.use_custom_templates) {
      let customTemplate = '';
      switch (target) {
        case "headline":
          customTemplate = config.prompt_template_headline;
          break;
        case "body":
          customTemplate = config.prompt_template_body;
          break;
        case "description":
          customTemplate = config.prompt_template_description;
          break;
      }

      if (customTemplate && customTemplate.trim()) {
        isUsingCustomTemplate = true;
        hasCustomPrompt = true;
        previewPrompt = replacePromptPlaceholders(customTemplate, {
          character: config.character || '',
          skills: config.skills || [],
          limitations: config.limitations || [],
          language: language,
          tone: tone,
          personalization: personalization,
          keywords: keywords,
          maxLen: target === 'headline' ? Math.min(parseInt(max_len), 60) : target === 'description' ? Math.min(parseInt(max_len), 90) : parseInt(max_len),
        });
      }
    }

    // Fallback to build from Character/Skills/Limitations
    if (!previewPrompt && config.character) {
      hasCustomPrompt = true;
      previewPrompt = buildCustomPrompt(
        target,
        config,
        language,
        tone,
        personalization,
        keywords,
        parseInt(max_len)
      ) || "";
    }

    // Fallback to default prompt
    if (!previewPrompt) {
      const ctx = {
        language,
        tone,
        personalization,
        main_keywords: [],
        aiConfig: null,
      };
      previewPrompt = buildPromptByTarget(target, ctx, { max_len: parseInt(max_len) });
    }

    return res.status(200).json({
      success: true,
      preview_prompt: previewPrompt,
      character: config.character || null,
      skills: config.skills || [],
      limitations: config.limitations || [],
      has_custom_prompt: hasCustomPrompt,
      is_using_custom_template: isUsingCustomTemplate,
      prompt_template: isUsingCustomTemplate ? (target === 'headline' ? config.prompt_template_headline : target === 'body' ? config.prompt_template_body : config.prompt_template_description) : null,
      model: config.model,
      metadata: config.metadata,
    });
  } catch (error) {
    console.error("Error previewing AI config prompt:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi preview prompt",
      error: error.message,
    });
  }
}

// ==================== MANUS AI GENERATE AD ====================

const MANUS_API_BASE = 'https://api.manus.ai';
const MANUS_API_KEY = process.env.MANUS_API_KEY;

/**
 * Tạo task trên Manus AI và polling cho đến khi xong
 * @param {string} prompt - Prompt gửi cho Manus
 * @param {string} agentProfile - "manus-1.6" hoặc "manus-1.6-max"
 * @param {number} timeoutMs - Tối đa ms chờ (default 120s)
 */
async function runManusTask(prompt, agentProfile = 'manus-1.6', timeoutMs = 120000) {
  // Bước 1: Tạo task
  const createRes = await fetch(`${MANUS_API_BASE}/v1/tasks`, {
    method: 'POST',
    headers: {
      'API_KEY': MANUS_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt, agentProfile }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Manus create task failed (${createRes.status}): ${errText}`);
  }

  const { task_id } = await createRes.json();
  if (!task_id) throw new Error('Manus did not return task_id');

  console.log(`[Manus] Task created: ${task_id}`);

  // Bước 2: Polling cho đến completed / failed
  const POLL_INTERVAL = 3000; // 3s mỗi lần
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, POLL_INTERVAL));

    const pollRes = await fetch(`${MANUS_API_BASE}/v1/tasks/${task_id}`, {
      headers: { 'API_KEY': MANUS_API_KEY },
    });

    if (!pollRes.ok) {
      console.warn(`[Manus] Poll error ${pollRes.status}, retrying...`);
      continue;
    }

    const taskData = await pollRes.json();
    const status = taskData.status;

    console.log(`[Manus] Task ${task_id} status: ${status}`);

    if (status === 'completed') {
      return taskData;
    }

    if (status === 'failed') {
      throw new Error(`Manus task failed: ${taskData.error || 'Unknown error'}`);
    }

    // pending | running → tiếp tục poll
  }

  throw new Error(`Manus task timeout sau ${timeoutMs / 1000}s`);
}

/**
 * Extract text output từ Manus task response
 *
 * Schema (từ docs): output = Array<{
 *   id, status, role, type,
 *   content: Array<{ type: "output_text", text, fileUrl, fileName, mimeType }>
 * }>
 *
 * Lưu ý: docs mô tả role="user" cho TẤT CẢ output items — không phân biệt agent/user.
 * Manus là agentic AI, output cuối cùng chứa kết quả hoàn chỉnh.
 * → Lấy message CUỐI CÙNG, thu thập tất cả content[].text
 */
function extractManusOutputText(taskData) {
  const outputs = taskData.output;
  if (!Array.isArray(outputs) || outputs.length === 0) {
    console.warn('[Manus] output rỗng hoặc không phải array. taskData keys:', Object.keys(taskData));
    return '';
  }

  // Debug log từng message
  console.log(`[Manus] output có ${outputs.length} message(s)`);
  outputs.forEach((msg, i) => {
    const contentLen = Array.isArray(msg.content) ? msg.content.length : typeof msg.content;
    console.log(`  [${i}] role=${msg.role} type=${msg.type} content=${contentLen}`);
  });

  // Lấy message cuối cùng — chứa kết quả Manus đã hoàn thiện
  const lastMsg = outputs[outputs.length - 1];

  if (!lastMsg) return '';

  // content là array (đúng schema)
  if (Array.isArray(lastMsg.content)) {
    const texts = lastMsg.content
      .filter(c => c && c.text)
      .map(c => c.text);
    if (texts.length > 0) {
      console.log(`[Manus] Extracted ${texts.length} text(s) from last message, total chars: ${texts.join('').length}`);
      return texts.join('\n');
    }
  }

  // content là string
  if (typeof lastMsg.content === 'string' && lastMsg.content) {
    console.log('[Manus] content là string, length:', lastMsg.content.length);
    return lastMsg.content;
  }

  // Fallback: thu thập text từ TẤT CẢ messages (không chỉ cuối)
  console.warn('[Manus] lastMsg không có text, thử collect từ tất cả output...');
  const allTexts = [];
  for (const msg of outputs) {
    if (Array.isArray(msg.content)) {
      for (const c of msg.content) {
        if (c && c.text) allTexts.push(c.text);
      }
    } else if (typeof msg.content === 'string') {
      allTexts.push(msg.content);
    }
  }
  return allTexts.join('\n');
}


/**
 * Parse JSON array từ text (Manus có thể wrap trong markdown code block)
 */
function parseJsonFromText(text) {
  // Thử parse trực tiếp
  try {
    const parsed = JSON.parse(text.trim());
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === 'object') return [parsed];
  } catch (_) { /* noop */ }

  // Thử extract từ ```json ... ``` block
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (codeBlockMatch) {
    try {
      const parsed = JSON.parse(codeBlockMatch[1].trim());
      if (Array.isArray(parsed)) return parsed;
      if (parsed && typeof parsed === 'object') return [parsed];
    } catch (_) { /* noop */ }
  }

  // Thử tìm array [...] đầu tiên trong text
  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    try {
      const parsed = JSON.parse(arrayMatch[0]);
      if (Array.isArray(parsed)) return parsed;
    } catch (_) { /* noop */ }
  }

  return null;
}


/**
 * POST /api/ai/generate-ad
 * Gọi Manus AI để tạo 2-3 bản quảng cáo hoàn chỉnh từ mô tả sản phẩm
 *
 * Body: {
 *   description: string,       // Mô tả sản phẩm (bắt buộc)
 *   image_source: "ai"|"upload"|"none",
 *   uploaded_image_url?: string, // URL ảnh đã upload (khi image_source=upload)
 *   count?: 2|3,               // Số bản (default 3)
 * }
 *
 * Response: {
 *   success: true,
 *   variants: [{ id, headline, body, description, image_url }]
 * }
 */
export async function generateAd(req, res) {
  try {
    const {
      description,
      image_source = 'none',
      uploaded_image_url = null,
      count = 3,
      prompt: customPrompt = null,
    } = req.body;

    if (!description || description.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng mô tả sản phẩm ít nhất 10 ký tự',
      });
    }

    if (!MANUS_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'MANUS_API_KEY chưa được cấu hình',
      });
    }

    const adCount = Math.min(Math.max(Number(count) || 3, 1), 5);

    // Ưu tiên prompt từ frontend (user đã tùy chỉnh), fallback về default
    const prompt = customPrompt || buildDefaultAdPrompt(adCount, description.trim(), image_source);

    console.log(`[generateAd] Gửi task đến Manus AI, count=${adCount}, image_source=${image_source}`);

    // Gọi Manus AI
    const taskData = await runManusTask(prompt, 'manus-1.6', 120000);

    // Log cấu trúc đầy đủ để debug (chỉ 1000 chars đầu)
    console.log('[generateAd] taskData keys:', Object.keys(taskData));
    console.log('[generateAd] output raw (1000c):', JSON.stringify(taskData.output || taskData.result || '').slice(0, 1000));

    let outputText = extractManusOutputText(taskData);

    // Fallback: nếu extract thất bại, thử chuyển toàn bộ output thành string rồi parse
    if (!outputText && taskData.output) {
      outputText = JSON.stringify(taskData.output);
      console.log('[generateAd] fallback: dùng raw output JSON string');
    }

    console.log(`[generateAd] outputText length: ${outputText.length}`);

    // Parse JSON
    let adVariants = parseJsonFromText(outputText);

    if (!adVariants || adVariants.length === 0) {
      console.error('[generateAd] Không parse được variants. outputText sample:', outputText.slice(0, 400));
      return res.status(500).json({
        success: false,
        message: 'AI không trả về đúng định dạng. Vui lòng thử lại.',
        debug_output: outputText.slice(0, 300), // gửi kèm để dễ debug
      });
    }

    // Giới hạn số bản theo yêu cầu
    adVariants = adVariants.slice(0, adCount);

    // Xử lý ảnh:
    // - upload: dùng uploaded_image_url cho tất cả bản
    // - ai: dùng trực tiếp image_url Manus đã trả về (manuscdn.com)
    // - none: null
    const enrichedVariants = adVariants.map((v, idx) => {
      let imageUrl = null;

      if (image_source === 'upload' && uploaded_image_url) {
        imageUrl = uploaded_image_url;
      } else if (image_source === 'ai' && v.image_url) {
        imageUrl = v.image_url; // dùng URL Manus trực tiếp
      }

      return {
        id: `variant-${Date.now()}-${idx}`,
        headline: v.headline || '',
        body: v.body || '',
        description: v.description || '',
        image_url: imageUrl,
      };
    });

    console.log(`[generateAd] Trả về ${enrichedVariants.length} variants`);

    return res.json({
      success: true,
      variants: enrichedVariants,
    });

  } catch (error) {
    console.error('[generateAd] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi tạo quảng cáo bằng AI',
    });
  }
}

/**
 * Build prompt mặc định cho generate-ad (fallback khi frontend không gửi custom prompt)
 */
function buildDefaultAdPrompt(adCount, description, imageSource) {
  const imageInstruction =
    imageSource === 'ai'
      ? 'Với mỗi bản quảng cáo, hãy tạo thêm một hình ảnh minh họa phù hợp và trả về URL ảnh trong trường "image_url".'
      : 'Đặt "image_url": null cho tất cả các bản.';

  return `Bạn là chuyên gia marketing Facebook Ads. Tạo ${adCount} bản quảng cáo Facebook cho sản phẩm/dịch vụ sau:

"${description}"

Mỗi bản quảng cáo phải bao gồm:
- headline: Tiêu đề hấp dẫn, tối đa 50 ký tự
- body: Nội dung chính thuyết phục, tối đa 200 ký tự
- description: Mô tả ngắn, tối đa 40 ký tự
- image_url: URL hình ảnh minh họa (hoặc null)

${imageInstruction}

Yêu cầu bắt buộc:
- Tuân thủ chính sách quảng cáo Facebook (không gán thuộc tính cá nhân, không cam kết kết quả tuyệt đối, không ngôn ngữ phân biệt)
- Mỗi bản phải khác nhau về góc độ tiếp cận (cảm xúc, lợi ích, tính năng, social proof...)
- Ngôn ngữ tự nhiên, thuyết phục, phù hợp với người Việt

Trả về CHÍNH XÁC định dạng JSON array (không có text nào khác ngoài JSON):
[
  {
    "headline": "...",
    "body": "...",
    "description": "...",
    "image_url": null
  }
]`;
}
