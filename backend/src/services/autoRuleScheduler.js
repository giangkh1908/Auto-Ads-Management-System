import cron from "node-cron";
import AutomationRule from "../models/ads/autoRule.model.js";
import { processRule } from "./autoRuleService.js";
import { saveSystemLog } from "../utils/systemLog.js";

let schedulerTask = null;

/**
 * Khởi chạy cron job scheduler
 * Chạy mỗi phút để kiểm tra và xử lý rules
 */
export function startAutoRuleScheduler() {
  if (schedulerTask) {
    console.log("AutoRule scheduler is already running");
    return;
  }

  console.log("Starting AutoRule scheduler...");

  // Log scheduler started
  saveSystemLog({
    category: 'scheduler',
    level: 'info',
    action: 'SCHEDULER_STARTED',
    description: 'Automation rule scheduler đã được khởi động',
    success: true,
  }).catch(err => console.error('Error logging scheduler start:', err));

  // Chạy mỗi phút: "* * * * *"
  schedulerTask = cron.schedule("* * * * *", async () => {
    try {
      await processScheduledRules();
    } catch (error) {
      console.error("Error in AutoRule scheduler:", error);
    }
  });
  console.log("AutoRule scheduler started. Running every minute.");
}

/**
 * Dừng cron job scheduler
 */
export function stopAutoRuleScheduler() {
  if (schedulerTask) {
    schedulerTask.stop();
    schedulerTask = null;
    console.log("AutoRule scheduler stopped");
    
    // Log scheduler stopped
    saveSystemLog({
      category: 'scheduler',
      level: 'info',
      action: 'SCHEDULER_STOPPED',
      description: 'Automation rule scheduler đã được dừng',
      success: true,
    }).catch(err => console.error('Error logging scheduler stop:', err));
  }
}

/**
 * Xử lý các rules đã đến lúc chạy
 */
async function processScheduledRules() {
  try {
    const now = new Date();

    // Query tất cả rules cần chạy (bao gồm ACTIVE và TRIGGERED)
    const rules = await AutomationRule.find({
      enabled: true,
      status: { $in: ["ACTIVE", "TRIGGERED"] },
      deleted_at: null,
      next_run_at: { $lte: now },
    })
      .populate("account_id", "external_id name")
      .populate("created_by", "full_name email")
      .populate("subscriber_id", "full_name email");

    if (rules.length === 0) {
      return;
    }

    console.log(`Found ${rules.length} rule(s) to process`);

    // Xử lý từng rule
    // Sử dụng Promise.allSettled để không bị gián đoạn nếu một rule lỗi
    const results = await Promise.allSettled(
      rules.map((rule) => processRule(rule))
    );

    // Log kết quả
    let successCount = 0;
    let errorCount = 0;
    let triggeredCount = 0;

    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        successCount++;
        if (result.value.triggered) {
          triggeredCount++;
        }
      } else {
        errorCount++;
        console.error(
          `Error processing rule ${rules[index]._id}:`,
          result.reason
        );
      }
    });

    if (successCount > 0 || triggeredCount > 0) {
      console.log(
        `Processed ${rules.length} rule(s): ${successCount} success, ${errorCount} errors, ${triggeredCount} triggered`
      );
      
      // Log batch processing results
      saveSystemLog({
        category: 'scheduler',
        level: errorCount > 0 ? 'warning' : 'info',
        action: 'SCHEDULER_BATCH_PROCESSED',
        description: `Đã xử lý ${rules.length} automation rule(s): ${successCount} thành công, ${errorCount} lỗi, ${triggeredCount} được kích hoạt`,
        success: errorCount === 0,
        meta: {
          total: rules.length,
          success: successCount,
          errors: errorCount,
          triggered: triggeredCount,
        },
      }).catch(err => console.error('Error logging batch results:', err));
    }
  } catch (error) {
    console.error("Error in processScheduledRules:", error);
  }
}

/**
 * Manually trigger processing (for testing)
 */
export async function triggerManualProcess() {
  console.log("Manual trigger: Processing scheduled rules...");
  await processScheduledRules();
}

