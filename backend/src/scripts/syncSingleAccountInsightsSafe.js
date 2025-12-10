import dotenv from "dotenv";
import { connectDB } from "../config/db.js";
import AdsAccount from "../models/ads/adsAccount.model.js";
import { syncInsightsForAccount } from "../services/insightsSyncService.js";

dotenv.config();

function normalizeAccountPair(accountId) {
  const hasPrefix = String(accountId).startsWith("act_");
  const withPrefix = hasPrefix ? String(accountId) : `act_${accountId}`;
  const withoutPrefix = hasPrefix ? String(accountId).substring(4) : String(accountId);
  return { withPrefix, withoutPrefix };
}

async function syncInsightsForSingleAccountSafe(externalAccountId) {
  console.log(`\n🚀 Safe insights sync for account ${externalAccountId}`);

  const { withPrefix, withoutPrefix } = normalizeAccountPair(externalAccountId);

  const account = await AdsAccount.findOne({
    external_id: { $in: [withPrefix, withoutPrefix] },
    status: "ACTIVE",
  });

  if (!account) {
    throw new Error(`AdsAccount not found for external_id=${externalAccountId}`);
  }

  // Sử dụng syncInsightsForAccount từ insightsSyncService
  // Hàm này đã được viết lại để lấy lifetime insights và lưu với date = today
  await syncInsightsForAccount(account._id);

  console.log(`\n✅ Sync completed for account ${account.external_id}`);
}

async function main() {
  try {
    const externalAccountId = process.argv[2];
    if (!externalAccountId) {
      console.error("Usage: node src/scripts/syncSingleAccountInsightsSafe.js <account_external_id>");
      process.exit(1);
    }

    await connectDB();
    console.log("✅ Connected to database");

    await syncInsightsForSingleAccountSafe(externalAccountId);

    console.log("\n✅ Safe insights sync completed.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Fatal error during safe insights sync:", err.message);
    process.exit(1);
  }
}

main();
