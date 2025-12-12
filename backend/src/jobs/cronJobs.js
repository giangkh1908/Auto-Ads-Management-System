import cron from "node-cron";
import AdsAccount from "../models/ads/adsAccount.model.js";
import { syncInsightsForAccount } from "../services/ads/insightsSyncService.js";
import { syncEntitiesForAccount } from "../services/ads/entitySyncService.js";
import User from "../models/user/user.model.js";
import pLimit from "p-limit";

export function startSyncCronJobs() {
  cron.schedule("0 * * * *", async () => {
    const startTime = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    console.log(`🔄 [${startTime}] Starting ads entity + ads insights sync...`);
    const limit = pLimit(1);

    try {
      const accounts = await AdsAccount.find({
        status: "ACTIVE"
      })
        .select("_id external_id shop_admin_id")
        .populate("shop_admin_id", "+facebookAccessToken");

      let successCount = 0;
      let errorCount = 0;

      await Promise.all(
        accounts.map(account => 
          limit(async () => {
            try {
              const accessToken = account.shop_admin_id?.facebookAccessToken;
              if (!accessToken) {
                console.warn(`⚠️ No access token for account ${account.external_id}`);
                errorCount++;
                return;
              }

              await syncEntitiesForAccount(account.external_id, accessToken);
              console.log(`✅ Synced ads entities (campaign/adset/ad) for account ${account.external_id}`);
              await syncInsightsForAccount(account._id);
              successCount++;
              console.log(`✅ Synced ads insights -> AdPerformance for account ${account.external_id}`);
            } catch (err) {
              console.error(`❌ Failed to sync account ${account.external_id}:`, err.message);
              errorCount++;
            }
          })
        )
      );

      const endTime = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
      console.log(`✅ [${endTime}] Ads entity + ads insights sync completed: ${successCount} success, ${errorCount} errors`);
    } catch (err) {
      console.error("❌ Ads entity + ads insights cron failed:", err.message);
    }
  });

  console.log("✅ Sync cron jobs started:");
  console.log("  - Ads Entities + Ads Insights: Every 1 hour (minute 0)");
}


