import { OpenAI } from 'openai';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

// Khởi tạo OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Lưu trữ context trong memory
const contexts = new Map();
const TTL = 30 * 60 * 1000; // 30 phút

/**
 * POST /api/ai/keywords/suggest
 * Gợi ý từ khóa liên quan
 */
export async function suggestKeywords(req, res) {
  try {
    const { language = 'vi', main_keywords = [] } = req.body;
    
    if (!main_keywords.length) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu từ khóa chính'
      });
    }

    const prompt = `Tạo danh sách 8-10 từ khóa liên quan đến "${main_keywords.join(', ')}" cho quảng cáo Facebook bằng ${language}. 
Từ khóa nên đa dạng, phù hợp với quảng cáo, và liên quan đến chủ đề. 
Chỉ liệt kê từ khóa, cách nhau bằng dấu phẩy, không giải thích. 
Mỗi từ khóa nên ngắn gọn (1-3 từ).`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Bạn là trợ lý marketing chuyên nghiệp. Tạo danh sách từ khóa liên quan cho quảng cáo Facebook.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 300
    });

    const relatedKeywordsText = response.choices[0].message.content.trim();
    // Tách từ khóa từ chuỗi trả về
    const relatedKeywords = relatedKeywordsText
      .split(',')
      .map(keyword => keyword.trim())
      .filter(keyword => keyword.length > 0);

    return res.status(200).json({
      success: true,
      related_keywords: relatedKeywords
    });
  } catch (error) {
    console.error('Error suggesting keywords:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi gợi ý từ khóa',
      error: error.message
    });
  }
}

/**
 * POST /api/ai/context/confirm
 * Xác nhận context trước khi dùng AI
 */
export function confirmContext(req, res) {
  try {
    const { language, tone, personalization, main_keywords } = req.body;
    
    // Validate required fields
    if (!language || !tone || !main_keywords || !Array.isArray(main_keywords)) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin context (language, tone, main_keywords)'
      });
    }

    // Generate a unique context ID
    const context_id = 'ctx_' + uuidv4().substring(0, 8);
    
    // Store context with expiration time
    contexts.set(context_id, {
      language,
      tone,
      personalization: personalization || '',
      main_keywords,
      expiresAt: Date.now() + TTL
    });

    // Clean up expired contexts occasionally
    if (Math.random() < 0.1) { // 10% chance to clean up
      for (const [id, ctx] of contexts.entries()) {
        if (ctx.expiresAt < Date.now()) {
          contexts.delete(id);
        }
      }
    }

    return res.status(200).json({
      success: true,
      context_id,
      expires_in: TTL / 1000 // seconds
    });
  } catch (error) {
    console.error('Error confirming context:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi xác nhận context',
      error: error.message
    });
  }
}

/**
 * Build prompt for text generation based on target and context
 */
function buildPromptByTarget(target, ctx, constraints = {}) {
  const { language, tone, personalization, main_keywords } = ctx;
  const kw = main_keywords.join(", ");
  const maxLen = constraints.max_len || 100;
  const policy = `
Không dùng từ ngữ phóng đại ("tốt nhất", "cam kết 100%"), 
không nhắm vào cá nhân ("bạn đang"), 
không nói về bệnh lý, cơ thể, tài chính, chính trị, 
không nhắc đến Facebook, Meta hoặc thương hiệu khác.`;

  switch (target) {
    case "headline":
      return `Viết tiêu đề quảng cáo Facebook bằng ${language}, giọng ${tone}.
Ngữ cảnh: ${personalization}. Từ khóa: ${kw}.
Tiêu đề phải ngắn, gây chú ý, nêu lợi ích sản phẩm. ${policy}
Giới hạn ${maxLen} ký tự. Trả về đúng 1 dòng.`;
    
    case "body":
      return `Viết nội dung chính cho quảng cáo Facebook bằng ${language}, giọng ${tone}.
Ngữ cảnh: ${personalization}. Từ khóa: ${kw}.
Giới hạn ${maxLen} ký tự. ${policy}
Nội dung nên có điểm thu hút, lợi ích rõ, kết thúc bằng lời kêu gọi nhẹ.`;
    
    case "description":
      return `Viết mô tả ngắn cho quảng cáo Facebook bằng ${language}, giọng ${tone}.
Ngữ cảnh: ${personalization}. Từ khóa: ${kw}.
Mô tả ngắn 1 câu, bổ trợ cho tiêu đề quảng cáo.
Giới hạn ${maxLen} ký tự. ${policy}`;
    
    case "cta":
      return `Viết lời kêu gọi hành động (CTA) cho quảng cáo Facebook bằng ${language}.
Từ khóa: ${kw}. Ngữ cảnh: ${personalization}.
CTA phải ngắn gọn, thúc đẩy hành động, phù hợp với sản phẩm.
Giới hạn tối đa 4 từ. Ví dụ: "Mua ngay", "Tìm hiểu thêm", "Đăng ký", "Truy cập", "Liên hệ".`;
    
    default:
      return `Viết nội dung quảng cáo Facebook bằng ${language}, giọng ${tone}.
Ngữ cảnh: ${personalization}. Từ khóa: ${kw}.
Giới hạn ${maxLen} ký tự. ${policy}`;
  }
}

/**
 * POST /api/ai/generate-text
 * Sinh nội dung text cho quảng cáo
 */
export async function generateText(req, res) {
  try {
    const { context_id, target, constraints = {} } = req.body;
    
    // Validate required fields
    if (!context_id || !target) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin (context_id, target)'
      });
    }

    // Check if context exists and is valid
    const ctx = contexts.get(context_id);
    if (!ctx) {
      return res.status(404).json({
        success: false,
        code: "CONTEXT_NOT_FOUND",
        message: 'Context không tồn tại'
      });
    }

    // Check if context is expired
    if (ctx.expiresAt < Date.now()) {
      contexts.delete(context_id);
      return res.status(410).json({
        success: false,
        code: "CONTEXT_EXPIRED",
        message: 'Context đã hết hạn, vui lòng tạo lại'
      });
    }

    // Build prompt based on target
    const prompt = buildPromptByTarget(target, ctx, constraints);

    // Generate text using OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Bạn là chuyên gia viết quảng cáo Facebook. Viết nội dung theo yêu cầu của người dùng.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 300
    });

    const generatedText = response.choices[0].message.content.trim();

    return res.status(200).json({
      success: true,
      chosen: generatedText
    });
  } catch (error) {
    console.error('Error generating text:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo nội dung',
      error: error.message
    });
  }
}

/**
 * POST /api/ai/images/generate
 * Sinh ảnh AI cho quảng cáo
 */
export async function generateImages(req, res) {
  try {
    const { context_id, count = 3, aspect_ratio = '1:1' } = req.body;
    
    // Validate required fields
    if (!context_id) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu context_id'
      });
    }

    // Check if context exists and is valid
    const ctx = contexts.get(context_id);
    if (!ctx) {
      return res.status(404).json({
        success: false,
        code: "CONTEXT_NOT_FOUND",
        message: 'Context không tồn tại'
      });
    }

    // Check if context is expired
    if (ctx.expiresAt < Date.now()) {
      contexts.delete(context_id);
      return res.status(410).json({
        success: false,
        code: "CONTEXT_EXPIRED",
        message: 'Context đã hết hạn, vui lòng tạo lại'
      });
    }

    // Get size based on aspect ratio
    let size = '1024x1024';
    if (aspect_ratio === '1:1') {
      size = '1024x1024';
    } else if (aspect_ratio === '4:5') {
      size = '1024x1280';
    } else if (aspect_ratio === '16:9') {
      size = '1792x1024';
    } else if (aspect_ratio === '9:16') {
      size = '1024x1792';
    }

    // Build prompt for image generation
    const { language, tone, personalization, main_keywords } = ctx;
    const prompt = `Tạo ảnh sản phẩm phù hợp cho quảng cáo Facebook. 
Ngữ cảnh: ${personalization}. 
Từ khóa: ${main_keywords.join(', ')}.
Phong cách: ${tone}.
Ảnh phải chất lượng cao, hấp dẫn, phù hợp để quảng cáo trên Facebook.
Không được chứa chữ, logo lạ, hoặc nội dung không phù hợp.`;

    // Generate images using OpenAI DALL-E
    const imagesResponse = await openai.images.generate({
      model: 'dall-e-3',
      prompt: prompt,
      size: size,
      quality: 'standard',
      n: Math.min(count, 4), // Maximum 4 images
    });

    // Extract image URLs from response
    const previews = imagesResponse.data.map(image => ({
      preview_url: image.url
    }));

    return res.status(200).json({
      success: true,
      previews,
      ttl: 900 // 15 minutes
    });
  } catch (error) {
    console.error('Error generating images:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo hình ảnh',
      error: error.message
    });
  }
}