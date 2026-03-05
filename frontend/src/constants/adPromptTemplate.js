/**
 * Prompt Template mặc định cho Generate Ad (Manus AI)
 *
 * User có thể tùy chỉnh 5 phần:
 *   1. aiRole         — Vai trò / persona của AI
 *   2. headlineSpec   — Yêu cầu cho headline (tên field "headline" bị khóa)
 *   3. bodySpec       — Yêu cầu cho body (tên field "body" bị khóa)
 *   4. descriptionSpec— Yêu cầu cho description (tên field "description" bị khóa)
 *   5. creativeReqs   — Yêu cầu sáng tạo (tone, style, quy tắc)
 *
 * Các phần còn lại (count, description SP, image instruction, JSON format)
 * do hệ thống tự inject — user không thấy và không sửa được.
 */

// ── Phần 1: Vai trò AI ──
export const DEFAULT_AI_ROLE =
  'Bạn là chuyên gia marketing Facebook Ads.';

// ── Phần 2: Cấu trúc từng field (tách riêng, tên field khóa cứng) ──
export const DEFAULT_HEADLINE_SPEC = 'Tiêu đề hấp dẫn, tối đa 50 ký tự';
export const DEFAULT_BODY_SPEC = 'Nội dung chính thuyết phục, tối đa 200 ký tự';
export const DEFAULT_DESCRIPTION_SPEC = 'Mô tả ngắn, tối đa 40 ký tự';

// ── Phần 3: Yêu cầu sáng tạo ──
export const DEFAULT_CREATIVE_REQUIREMENTS = `- Tuân thủ chính sách quảng cáo Facebook (không gán thuộc tính cá nhân, không cam kết kết quả tuyệt đối, không ngôn ngữ phân biệt)
- Mỗi bản phải khác nhau về góc độ tiếp cận (cảm xúc, lợi ích, tính năng, social proof...)
- Ngôn ngữ tự nhiên, thuyết phục, phù hợp với người Việt`;

/**
 * Build prompt hoàn chỉnh từ các phần editable + locked.
 *
 * @param {object} params
 * @param {string} params.aiRole          — Vai trò AI (editable)
 * @param {string} params.headlineSpec    — Yêu cầu headline (editable, tên field locked)
 * @param {string} params.bodySpec        — Yêu cầu body (editable, tên field locked)
 * @param {string} params.descriptionSpec — Yêu cầu description (editable, tên field locked)
 * @param {string} params.creativeReqs    — Yêu cầu sáng tạo (editable)
 * @param {number} params.count           — Số bản (locked, từ UI)
 * @param {string} params.description     — Mô tả sản phẩm (locked, từ textarea)
 * @param {string} params.imageSource     — 'ai' | 'upload' | 'none' (locked)
 * @returns {string} Prompt hoàn chỉnh gửi cho Manus AI
 */
export function buildAdPrompt({
  aiRole,
  headlineSpec,
  bodySpec,
  descriptionSpec,
  creativeReqs,
  count,
  description,
  imageSource,
}) {
  const imageInstruction =
    imageSource === 'ai'
      ? 'Với mỗi bản quảng cáo, hãy tạo thêm một hình ảnh minh họa phù hợp và trả về URL ảnh trong trường "image_url".'
      : 'Đặt "image_url": null cho tất cả các bản.';

  return `${aiRole} Tạo ${count} bản quảng cáo Facebook cho sản phẩm/dịch vụ sau:

"${description}"

Mỗi bản quảng cáo phải bao gồm:
- headline: ${headlineSpec}
- body: ${bodySpec}
- description: ${descriptionSpec}
- image_url: URL hình ảnh minh họa (hoặc null)

${imageInstruction}

Yêu cầu bắt buộc:
${creativeReqs}

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
