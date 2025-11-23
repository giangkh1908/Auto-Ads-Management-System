# 🚀 Refactoring Plan: From "Chatbot" to "AI Marketing Partner"

## 1. Vấn đề hiện tại (Current Issues)
*   **Robot-like Responses**: Câu trả lời cứng nhắc, thiếu cảm xúc và sự tự nhiên.
*   **Rigid Flow**: Logic `if-else` trong `chatController.js` quá phức tạp, dễ gãy khi user hỏi lệch kịch bản.
*   **Lack of Context**: AI không "biết" tình hình hiện tại của tài khoản trừ khi được hỏi cụ thể.
*   **Reactive vs Proactive**: Chỉ trả lời khi được hỏi, không tự đưa ra gợi ý (Agency).

## 2. Ý tưởng cốt lõi: "Hybrid Agentic Architecture"
Thay vì một luồng tuyến tính (Router -> Tool -> Response), chúng ta sẽ chuyển sang mô hình **Agent**.
*   **Persona**: "Senior Marketing Consultant" - Chuyên gia, thân thiện, sắc sảo.
*   **Context-Aware**: AI luôn được "bơm" dữ liệu tổng quan (Real-time Context) ngay từ đầu.
*   **Dynamic Reasoning**: Sử dụng LLM để quyết định tool cần dùng thay vì hardcode router.

---

## 3. Kiến trúc mới (Proposed Architecture)

### A. Backend Refactoring (`/backend/src/services/ai/`)
Tách `chatController.js` khổng lồ thành các service nhỏ:

1.  **`ContextManager`**:
    *   Nhiệm vụ: Chuẩn bị "bộ não" cho AI trước khi nó trả lời.
    *   Logic: Tự động fetch các chỉ số quan trọng (Spend hôm nay, CTR trung bình) và inject vào System Prompt.
    *   *Lợi ích*: AI sẽ tự biết "Hôm nay giá ads đang cao" mà không cần gọi tool.

2.  **`IntentClassifier` (Smart Router)**:
    *   Thay vì Regex, dùng LLM (nhẹ, ví dụ `gpt-4o-mini` hoặc `gemini-flash`) để phân loại intent.
    *   Output: JSON `{ intent: "ANALYZE_TREND", entities: ["Campaign A"], time_range: "last_7_days" }`.

3.  **`AgentExecutor`**:
    *   Dựa vào intent, tự động gọi các tool (Analytics, Database, Knowledge Base).
    *   Có khả năng "Chain of Thought": *User hỏi A -> Cần dữ liệu B -> Gọi tool B -> Trả lời A*.

4.  **`ResponseGenerator`**:
    *   Module chuyên biệt để "xào nấu" dữ liệu thô thành văn phong "Chuyên gia".
    *   Format: Markdown, Emoji, và cấu trúc rõ ràng (Tóm tắt -> Chi tiết -> Hành động).

5.  **`OnDemandFetcher` (Real-time Bridge)**:
    *   **Vấn đề**: Cronjob chạy 30 phút/lần -> Dữ liệu có thể bị cũ.
    *   **Giải pháp**: Khi Intent là `CHECK_REALTIME_STATUS` hoặc user hỏi "ngay bây giờ", AI sẽ kích hoạt `OnDemandFetcher`.
    *   **Cơ chế**: Gọi trực tiếp Facebook Marketing API để lấy chỉ số mới nhất của Campaign/AdSet cụ thể, bỏ qua DB cache.
    *   **Lưu ý**: Cần rate limit cẩn thận để không bị Facebook chặn.

### B. Frontend Enhancements (`/frontend`)
*   **Rich UI Components**: Server trả về `type: "chart"` hoặc `type: "table"`. Frontend render biểu đồ thay vì text.
*   **Quick Actions**: Nút bấm ngay trong chat (ví dụ: "Tắt Campaign này", "Tăng ngân sách").

---

## 4. Chi tiết triển khai (Implementation Steps)

### Step 1: Refactor Controller & Service Structure
Tạo thư mục mới `backend/src/services/ai/` và di chuyển logic từ controller sang.

```javascript
// backend/src/services/ai/agentService.js
export const processUserMessage = async (userId, accountId, message) => {
  // 1. Build Context (Real-time stats + User Profile)
  const context = await contextManager.build(accountId);
  
  // 2. Detect Intent & Extract Entities (LLM-based)
  const plan = await intentClassifier.plan(message, context);
  
  // 3. Execute Tools (if needed)
  const toolOutputs = await toolExecutor.run(plan.tools);
  
  // 4. Generate Final Response (Persona-based)
  return await responseGenerator.craft(plan, toolOutputs, context);
};
```

### Step 2: "Real-time Context Injection" (The Game Changer)
Đây là chìa khóa để AI thông minh hơn. Trước khi AI trả lời, nó đã biết:
> "Tài khoản này đang chạy 5 campaign, hôm nay tiêu hết $50, CPC trung bình là $0.5 (cao hơn hôm qua 10%)."

```javascript
// System Prompt Template
const systemPrompt = `
Bạn là Senior Marketing Expert. 
DỮ LIỆU THỜI GIAN THỰC (Đừng nói ra trừ khi cần thiết):
- Ngân sách hôm nay: {today_spend} (Tăng/Giảm {diff}%)
- Campaign tốt nhất: {best_campaign}
- Cảnh báo: {alerts}

Phong cách:
- Ngắn gọn, đi thẳng vào vấn đề.
- Luôn đưa ra 1 lời khuyên hành động (Actionable Insight).
- Dùng emoji để nhấn mạnh (nhưng không lạm dụng).
`;
```

### Step 3: Nâng cấp Prompt (Persona)
Thay đổi prompt hiện tại (khá máy móc) sang style "Consultant".

*   **Cũ**: "Dựa vào dữ liệu sau, hãy phân tích..."
*   **Mới**: "Đóng vai một chuyên gia tối ưu quảng cáo. Dữ liệu cho thấy CPC đang tăng. Hãy giải thích tại sao (do CTR giảm hay CPM tăng?) và đề xuất giải pháp cụ thể (đổi content, target lại...)."

### Step 4: Frontend Rich Response
Update `ChatAIWidget.jsx` để render component động.

```jsx
// Frontend logic
{message.type === 'chart' && <LineChart data={message.data} />}
{message.type === 'insight_card' && <InsightCard data={message.data} />}
```

---

## 5. Ví dụ so sánh (Before vs After)

**User**: "Hôm nay ads thế nào?"

**Old Bot**:
> Tổng chi tiêu hôm nay là 500k. Số lượt hiển thị là 10,000. CPC là 500đ.

**New Agent**:
> 📉 **Hôm nay hiệu suất hơi giảm nhẹ.**
> Chi tiêu đạt **500k**, nhưng CPC tăng lên **500đ** (+20% so với hôm qua).
>
> 🔍 **Nguyên nhân:** Campaign "Sale Tết" có CPM tăng cao đột biến.
> 💡 **Đề xuất:** Bạn nên kiểm tra lại tần suất (Frequency) của nhóm quảng cáo này, có thể tệp khách hàng đang bị bão hòa.
>
> [Nút: Xem chi tiết Campaign "Sale Tết"]

---

## Kết luận
Việc refactor này không chỉ sửa lỗi mà còn nâng tầm sản phẩm. Bạn có đồng ý với hướng đi này không? Nếu đồng ý, mình sẽ bắt đầu với **Step 1: Refactor Controller** trước.
