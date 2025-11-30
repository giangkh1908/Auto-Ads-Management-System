# Ads Management – Quy trình dữ liệu & Insights

Tài liệu này mô tả toàn bộ luồng hoạt động giữa frontend `AdsManagement` và backend khi hiển thị chiến dịch/adset/ad, bao gồm cách lấy dữ liệu, lazy load insights, đồng bộ với Facebook và cách hiển thị chỉ số.

## 1. Luồng dữ liệu tổng quan
- **Nguồn gốc dữ liệu chính**: backend đọc từ MongoDB (`AdsCampaign`, `AdsSet`, `Ads`) để cung cấp danh sách entities cho FE qua các route `/api/campaigns`, `/api/adsets`, `/api/ads`.
- **Đồng bộ với Facebook**: khi người dùng yêu cầu sync (`/api/campaigns/sync`, `/api/campaigns/sync-all`, `/api/ads/sync`, ...), backend dùng `entitySyncService.syncEntitiesForAccount` để gọi Facebook Graph API (v23.0) lần lượt cho campaigns → adsets → ads, ghi kết quả vào DB và đánh dấu các bản ghi không còn trên FB là `DELETED`.
- **Insights**: không lưu sẵn trong DB; mỗi lần frontend cần insights, backend gọi trực tiếp Facebook Graph API qua `fbAdsService.fetchInsightsForEntities` (campaign/adset) hoặc `fbAdsService.fetchAdInsights` (ads), sau đó trả về FE ở dạng `{ id, insights }`.

## 2. Frontend – `AdsManagement.jsx`
1. **Quản lý tab & datasets**  
   - State `datasets` chứa `campaigns`, `adsets`, `ads`.  
   - Hook `useAdsDataFetching` cung cấp các hàm `fetchCampaignsForAccount`, `fetchAdsetsForCampaign`, `fetchAdsForAdset`, `fetchAllAdsetsForAccount`, `fetchAllAdsForAccount`, `fetchInsightsForVisibleItems`.
2. **Tải dữ liệu list**  
   - Khi tài khoản hoặc tab thay đổi, `useEffect` gọi hàm fetch tương ứng để lấy danh sách từ backend (DB).  
   - Dữ liệu được transform (`transformCampaign`, `transformAdset`, `transformAd`) ngay khi nhận, hiển thị tức thì.
3. **Lazy load insights**  
   - `useEffect` theo dõi `rows` của bảng hiện tại.  
   - Tạo khóa `currentRowsKey` (dựa trên `external_id`) để tránh fetch lặp.  
   - Nếu row chưa có `insights`, gọi `fetchInsightsForVisibleItems` sau 800 ms debounce.  
   - `fetchedInsightsRef` lưu cache theo tổ hợp rows, `loadingInsightsRef` ngăn concurrent fetch.
4. **Merge insights**  
   - `fetchInsightsForVisibleItems` lọc `external_id` chưa có data, gọi endpoint insights tương ứng.  
   - Sau khi backend trả về `{ id, insights }`, hàm `mergeInsights` trộn dữ liệu vào từng item trong `datasets`.
5. **Refresh / invalidate**  
   - Khi người dùng sync hoặc đổi account/tab, `fetchedInsightsRef` bị reset để cho phép fetch lại.  
   - `useAdsSync` quản lý metadata cache `lastSync`, `lastFetch` và `loadedAccounts` để tránh tải lại toàn bộ khi không cần.

## 3. Backend – Routes & Controllers chính
| Route | Controller | Mục đích | Nguồn dữ liệu |
| --- | --- | --- | --- |
| `GET /api/campaigns` | `listCampaignsCtrl` | Trả danh sách campaign (fetch_all hoặc phân trang) | MongoDB |
| `GET /api/adsets` | `adsSet.controller.listAdsetsCtrl` (tương tự) | Danh sách adset theo account/campaign | MongoDB |
| `GET /api/ads` | `ads.controller.listAdsCtrl` | Danh sách ads theo account/adset | MongoDB |
| `GET /api/campaigns/insights` | `getCampaignInsightsCtrl` | Lấy insights theo danh sách campaign IDs | Facebook Graph API |
| `GET /api/adsets/insights` | `getAdsetInsightsCtrl` | Insights cho adsets | Facebook Graph API |
| `GET /api/ads/insights` | `getAdsInsightsCtrl` | Insights cho ads | Facebook Graph API |
| `GET /api/campaigns/sync`, `/sync-all` | `syncCampaignsCtrl`, `syncAllCtrl` | Đồng bộ entities từ Facebook → DB | Facebook Graph API |
| `GET /api/ads/live`, `/api/campaigns/live` | `getAdsLiveCtrl`, `getCampaignsLiveCtrl` | Đọc trực tiếp từ Facebook (không ghi DB) | Facebook Graph API |

## 4. Chi tiết lấy insights
1. **Frontend**  
   - Tùy theo tab hiện tại:  
     - Campaign tab → `/api/campaigns/insights`  
     - Adset tab → `/api/adsets/insights`  
     - Ads tab → `/api/ads/insights`  
   - Endpoint được chọn ngay trước khi gọi `fetchInsightsForVisibleItems`.
2. **Backend**  
   - Controllers lấy `ids` từ query, xác thực user, lấy `facebookAccessToken`.  
   - Gọi `fbAdsService.fetchInsightsForEntities` (batch POST) hoặc `fetchAdInsights` (`?ids=`).  
   - Map `insights.data[0]` thành `{ id, insights }` rồi trả về JSON.  
   - Không cache DB → mỗi request là dữ liệu realtime.

## 5. Cơ chế hiển thị chỉ số
- `mergeInsights(item, newInsights)` đảm bảo dữ liệu metrics (spend, impressions, clicks, quality ranking, …) được ghép vào object hiển thị.  
- Table components chỉ cần đọc `row.insights?.<metric>` vì datasets đã được cập nhật tại chỗ.  
- Nếu insights bị thiếu (API fail), item giữ nguyên dữ liệu cũ hoặc rỗng; FE không log lỗi để tránh spam.

## 6. Refresh & Sync
### 6.1 Refresh nhẹ (frontend)
- Tương tác: đổi tab, đổi account, paginate → trigger fetch list + lazy insights mới.
- `abortControllerRef` bảo vệ khỏi race conditions khi người dùng chuyển tab nhanh; mọi request cũ bị abort.

### 6.2 Đồng bộ thật sự (backend)
- Khi gọi `/api/campaigns/sync` hoặc `/api/campaigns/sync-all`:
  1. Backend lấy access token người dùng.
  2. `syncEntitiesForAccount` →  
     - `syncCampaignsWithPagination`: GET `/act_{id}/campaigns`, ghi/upsert vào `AdsCampaign`, đánh dấu missing IDs là `DELETED`.  
     - `syncAdSetsWithPagination`: tương tự cho adsets, map sang campaign `_id`.  
     - `syncAdsWithPagination`: GET `/act_{id}/ads`, map sang adset `_id`.  
  3. Cập nhật `AdsAccount.sync_metadata`.
- Sau sync, frontend có thể gọi lại list endpoints để thấy dữ liệu mới. Insights vẫn lazy load.

## 7. Tương tác với Database
- **Đọc**: `listCampaignsCtrl`/`listAdsetsCtrl`/`listAdsCtrl` truy vấn Mongo với filter `external_account_id`, `campaign_id`, `adset_id`,… Các controller hỗ trợ `fetch_all` để FE tự paginate.  
- **Ghi**: chỉ xảy ra trong các thao tác sync, copy, archive/delete/toggle. Insights không ghi vào DB theo luồng hiển thị.
- **Cache phía FE**: `useAdsDataFetching` giữ `cache.lastFetch` per account/campaign/adset với TTL 6 giờ (`CACHE_TTL = 21 600 000 ms`). Khi cache hợp lệ, hook trả về dữ liệu đã lưu trong state mà không gọi backend.

## 8. Điểm cần lưu ý khi mở rộng
- Nếu muốn cache insights backend → cần bổ sung storage (VD `AdPerformance`, `AdHourlyInsight`) và cập nhật controllers để ưu tiên DB trước khi fallback Facebook.  
- Khi thêm metric mới, phải chỉnh `fetchInsightsForEntities` (fields) + `mergeInsights`.  
- Đồng bộ scheduler: đã có jobs (`backend/src/jobs/adHourlyInsights.job.js`, `analyticsSnapshot.job.js`) để lấy insight định kỳ cho báo cáo khác; tuy nhiên flow hiển thị realtime vẫn phụ thuộc Graph API.

---
**Kết luận**: Frontend đọc danh sách entities từ DB nhưng luôn gọi Facebook để lấy insights mới, kèm cơ chế lazy load + caching theo viewport. Backend chịu trách nhiệm sync định kỳ/ theo yêu cầu để đảm bảo DB cập nhật, đồng thời làm proxy bảo vệ token và rate limit khi truy vấn insights.

