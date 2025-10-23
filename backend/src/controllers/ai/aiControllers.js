import { OpenAI } from "openai";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { v2 as cloudinary } from 'cloudinary';

dotenv.config();

// Khởi tạo clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
const geminiTextModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
const geminiImageModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash-image",
});

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
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
    const {
      language = "vi",
      main_keywords = [],
      ai_provider = "openai", // Thêm parameter này
    } = req.body;
    
    if (!main_keywords.length) {
      return res
        .status(400)
        .json({ success: false, message: "Thiếu từ khóa chính" });
    }

    const prompt = `Với vai trò là chuyên gia marketing, hãy tạo danh sách 5-7 từ khóa nhắm mục tiêu (targeting keywords) cho quảng cáo Facebook về chủ đề "${main_keywords.join(
      ", "
    )}" bằng ${language}. Từ khóa nên đa dạng, phù hợp với quảng cáo, và liên quan đến chủ đề. Chỉ liệt kê từ khóa mà khách hàng tiềm năng có thể quan tâm, cách nhau bằng dấu phẩy, không giải thích. Mỗi từ khóa nên ngắn gọn (1-3 từ).`;

    let relatedKeywordsText = "";

    if (ai_provider === "gemini") {
      const result = await geminiTextModel.generateContent(prompt);
      relatedKeywordsText = result.response.text();
    } else {
      // Mặc định là openai
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 300,
      });
      relatedKeywordsText = response.choices[0].message.content.trim();
    }

    const relatedKeywords = relatedKeywordsText
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
      
    return res
      .status(200)
      .json({ 
        success: true, 
        related_keywords: relatedKeywords,
        ai_provider_used: ai_provider
      });
  } catch (error) {
    console.error("Error suggesting keywords:", error);
    return res
      .status(500)
      .json({
        success: false,
        message: "Lỗi khi gợi ý từ khóa",
        error: error.message,
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
        message: "Thiếu thông tin context (language, tone, main_keywords)",
      });
    }

    // Generate a unique context ID
    const context_id = "ctx_" + uuidv4().substring(0, 8);

    // Store context with expiration time
    contexts.set(context_id, {
      language,
      tone,
      personalization: personalization || "",
      main_keywords,
      expiresAt: Date.now() + TTL,
    });

    // Clean up expired contexts occasionally
    if (Math.random() < 0.1) {
      // 10% chance to clean up
      for (const [id, ctx] of contexts.entries()) {
        if (ctx.expiresAt < Date.now()) {
          contexts.delete(id);
        }
      }
    }

    return res.status(200).json({
      success: true,
      context_id,
      expires_in: TTL / 1000, // seconds
    });
  } catch (error) {
    console.error("Error confirming context:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi xác nhận context",
      error: error.message,
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
    const {
      context_id,
      target,
      constraints = {},
      model = "gpt-4o-mini",
    } = req.body;
    if (!context_id || !target) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Thiếu thông tin (context_id, target)",
        });
    }

    const ctx = contexts.get(context_id);
    if (!ctx)
      return res
        .status(404)
        .json({
          success: false,
          code: "CONTEXT_NOT_FOUND",
          message: "Context không tồn tại",
        });
    if (ctx.expiresAt < Date.now()) {
      contexts.delete(context_id);
      return res
        .status(410)
        .json({
          success: false,
          code: "CONTEXT_EXPIRED",
          message: "Context đã hết hạn, vui lòng tạo lại",
        });
    }

    const prompt = buildPromptByTarget(target, ctx, constraints);

    let generatedText = "";
    if (model.startsWith("gemini")) {
      const resp = await geminiTextModel.generateContent(prompt);
      generatedText = resp.response.text().trim();
    } else {
      const response = await openai.chat.completions.create({
        model, // ví dụ: 'gpt-4o-mini' (giữ nguyên mặc định)
        messages: [
          {
            role: "system",
            content:
              "Bạn là chuyên gia viết quảng cáo Facebook. Viết nội dung theo yêu cầu của người dùng.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.5,
        max_tokens: 300,
      });
      generatedText = response.choices[0].message.content.trim();
    }

    return res.status(200).json({ success: true, chosen: generatedText });
  } catch (error) {
    console.error("Error generating text:", error);
    return res
      .status(500)
      .json({
        success: false,
        message: "Lỗi khi tạo nội dung",
        error: error.message,
      });
  }
}

/**
 * Helper: Upload base64 to Cloudinary with size optimization
 */
async function uploadToCloudinary(base64Data, mimeType) {
  try {
    // Check base64 data size (rough estimation)
    const sizeInBytes = (base64Data.length * 3) / 4;
    const sizeInMB = sizeInBytes / (1024 * 1024);
    
    console.log(`📊 Image size: ${sizeInMB.toFixed(5)}MB`);
    
    // If image is too large (>5MB), compress it
    let quality = 'auto:good';
    if (sizeInMB > 5) {
      quality = 'auto:low';
      console.log('🔧 Large image detected, using compression');
    }
    
    const dataUri = `data:${mimeType};base64,${base64Data}`;
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: 'ai_ads_images',
      resource_type: 'image',
      format: 'jpg',
      quality: quality,
      width: 1024,
      height: 1024,
      crop: 'limit',
      flags: 'progressive'
    });
    
    console.log(`✅ Uploaded to Cloudinary: ${result.secure_url}`);
    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
}

/**
 * Helper: Process and optimize image data from Gemini
 */
function processGeminiImageData(part) {
  try {
    // Check for inline data (most common)
    const inline = part.inlineData || part.inline_data;
    if (inline?.data && inline?.mimeType) {
      return {
        data: inline.data,
        mimeType: inline.mimeType,
        source: 'inline'
      };
    }
    
    // Check for media data
    const media = part.media;
    if (media?.data && media?.mimeType) {
      return {
        data: media.data,
        mimeType: media.mimeType,
        source: 'media'
      };
    }
    
    // Check for file URI
    const fileUri = part.fileData?.fileUri || part.file_data?.file_uri;
    if (fileUri && fileUri.startsWith('http')) {
      return {
        url: fileUri,
        source: 'fileUri'
      };
    }
    
    // Check for text containing URL
    if (typeof part.text === "string") {
      const urlMatch = part.text.match(/https?:\/\/\S+/g);
      if (urlMatch && urlMatch.length) {
        return {
          url: urlMatch[0],
          source: 'text'
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error processing Gemini image data:', error);
    return null;
  }
}

/**
 * POST /api/ai/images/generate
 * Sinh ảnh AI và tự động upload lên cloud để có URL công khai
 */
export async function generateImages(req, res) {
  try {
    const { context_id, count = 4, aspect_ratio = "1:1", model = "dall-e-2" } = req.body;
    
    if (!context_id) {
      return res.status(400).json({ success: false, message: "Thiếu context_id" });
    }

    const ctx = contexts.get(context_id);
    if (!ctx) {
      return res.status(404).json({ success: false, code: "CONTEXT_NOT_FOUND", message: "Context không tồn tại" });
    }
    if (ctx.expiresAt < Date.now()) {
      contexts.delete(context_id);
      return res.status(410).json({ success: false, code: "CONTEXT_EXPIRED", message: "Context đã hết hạn" });
    }

    const { tone, personalization, main_keywords } = ctx;
    const prompt = `Create a high-quality image for Facebook advertising about: ${main_keywords.join(", ")}.
Style: ${tone}.
Context: ${personalization || "Professional product/service advertising"}.
The image should be attractive, suitable for Facebook advertising.
No text, logos, or inappropriate content.
Clear, eye-catching colors, brand-appropriate.`;

    console.log(`🎨 Generating ${count} images with ${model}...`);
    let previews = [];

    // --------- GEMINI IMAGE ----------
    if (model.startsWith("gemini")) {
      const n = Math.min(count, 4);

      for (let i = 0; i < n; i++) {
        try {
          console.log(`🔄 Generating Gemini image ${i + 1}/${n}...`);
          
          // Use a more specific prompt for better image generation
          const enhancedPrompt = `${prompt}\n\nGenerate a single high-quality image suitable for Facebook advertising. The image should be clear, professional, and visually appealing. Return the image data directly as base64.`;
          
          const resp = await geminiImageModel.generateContent([{
            text: enhancedPrompt
          }]);

          const cands = resp?.response?.candidates || [];
          let imageFound = false;

          for (const c of cands) {
            const parts = c?.content?.parts || [];
            for (const p of parts) {
              try {
                const imageData = processGeminiImageData(p);
                
                if (!imageData) continue;

                let publicUrl = null;

                // Handle different data sources
                if (imageData.url) {
                  // Direct URL (fileUri or text URL)
                  publicUrl = imageData.url;
                  console.log(`✅ Gemini image ${i + 1} (direct URL): ${publicUrl}`);
                } else if (imageData.data && imageData.mimeType) {
                  // Base64 data - upload to Cloudinary
                  console.log(`📤 Uploading Gemini image ${i + 1} to Cloudinary (${imageData.source})...`);
                  publicUrl = await uploadToCloudinary(imageData.data, imageData.mimeType);
                }

                if (publicUrl) {
                  previews.push({ 
                    preview_url: publicUrl,
                    source: imageData.source || 'unknown',
                    model: 'gemini'
                  });
                  console.log(`✅ Gemini image ${i + 1}: ${publicUrl}`);
                  imageFound = true;
                  break;
                }
              } catch (partError) {
                console.error(`❌ Error processing Gemini image part ${i + 1}:`, partError.message);
              }
            }
            if (imageFound) break;
          }
        } catch (e) {
          console.error(`❌ Error generating Gemini image ${i + 1}:`, e.message);
        }
      }

      if (!previews.length) {
        console.log('⚠️ No valid images generated by Gemini, trying fallback...');
        
        // Fallback: Try with a simpler prompt
        try {
          const fallbackPrompt = `Create a simple, clean image for Facebook advertising about: ${main_keywords.join(", ")}. Professional style, no text.`;
          const fallbackResp = await geminiImageModel.generateContent([{
            text: fallbackPrompt
          }]);
          
          const fallbackCands = fallbackResp?.response?.candidates || [];
          for (const c of fallbackCands) {
            const parts = c?.content?.parts || [];
            for (const p of parts) {
              const imageData = processGeminiImageData(p);
              if (imageData && (imageData.url || (imageData.data && imageData.mimeType))) {
                let publicUrl = imageData.url;
                if (!publicUrl && imageData.data) {
                  publicUrl = await uploadToCloudinary(imageData.data, imageData.mimeType);
                }
                if (publicUrl) {
                  previews.push({ 
                    preview_url: publicUrl,
                    source: imageData.source || 'fallback',
                    model: 'gemini'
                  });
                  break;
                }
              }
            }
            if (previews.length > 0) break;
          }
        } catch (fallbackError) {
          console.error('Fallback generation failed:', fallbackError);
        }
        
        if (!previews.length) {
          return res.status(500).json({
            success: false,
            message: "Gemini không tạo được hình ảnh hợp lệ. Vui lòng thử lại hoặc sử dụng OpenAI.",
            code: "GEMINI_NO_IMAGE"
          });
        }
      }
    }
    // --------- OPENAI DALL-E ----------
    else {
      console.log('🎨 Generating OpenAI DALL-E images...');
      
      const imagesResponse = await openai.images.generate({
        model: "dall-e-2",
        prompt,
        size: "1024x1024", // DALL-E-2 chỉ hỗ trợ size vuông
        n: Math.min(count, 4),
      });
      
      previews = imagesResponse.data.map((image, index) => {
        console.log(`✅ OpenAI image ${index + 1}: ${image.url}`);
        return { 
          preview_url: image.url,
          source: 'openai',
          model: 'dall-e-2'
        };
      });
    }

    console.log(`🎉 Successfully generated ${previews.length} images`);

    return res.status(200).json({ 
      success: true, 
      previews, 
      ttl: 900,
      model_used: model,
      total_generated: previews.length,
      note: model.startsWith("gemini") ? "Gemini images processed and uploaded to Cloudinary with size optimization" : "OpenAI DALL-E images with direct URLs"
    });
    
  } catch (error) {
    console.error("Error generating images:", error);
    
    // Xử lý lỗi cụ thể
    if (error.code === 'content_policy_violation' || error.message?.includes('safety')) {
      return res.status(400).json({
        success: false,
        message: "Nội dung không phù hợp với chính sách AI. Vui lòng thử từ khóa khác.",
        code: "CONTENT_POLICY_VIOLATION"
      });
    }
    
    if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
      return res.status(429).json({
        success: false,
        message: "Đã đạt giới hạn API. Vui lòng thử lại sau.",
        code: "RATE_LIMIT_EXCEEDED"
      });
    }

    return res.status(500).json({
      success: false,
      message: "Lỗi khi tạo hình ảnh",
      error: error.message,
    });
  }
}

