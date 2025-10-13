// services/adsAccount.service.js
import axios from "axios";
import AdsAccount from "../models/ads/adsAccount.model.js";

/** =========================
 *  FACEBOOK GRAPH HELPERS
 *  ========================= */
const FB_API = "https://graph.facebook.com/v23.0";

export async function fbFetchAdAccounts(accessToken, afterCursor = null, limit = 10) {
  const params = new URLSearchParams({
    fields: "id,name,account_status,currency,timezone_name",
    limit: String(limit),
  });
  if (afterCursor) params.set("after", afterCursor);

  const res = await axios.get(`${FB_API}/me/adaccounts?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const data = res.data?.data || [];
  const nextAfter = res.data?.paging?.cursors?.after || null;

  return { data, nextAfter };
}

/** Upsert 1 tài khoản */
export async function upsertOneAdAccount(fbAcc, { shopUserId, adminUserId }) {
  return AdsAccount.findOneAndUpdate(
    { external_id: fbAcc.id },
    {
      external_id: fbAcc.id,
      name: fbAcc.name,
      currency: fbAcc.currency,
      timezone_name: fbAcc.timezone_name,
      account_status: fbAcc.account_status, // enum số của FB (1=active,...)
      shop_user_id: shopUserId || undefined,
      shop_admin_id: adminUserId || undefined,
      last_updated_at: new Date(),
    },
    { upsert: true, new: true }
  );
}

/** Upsert danh sách tài khoản */
export async function upsertAdAccountsFromFacebook(accessToken, { shopUserId, adminUserId }) {
  let after = null;
  const results = [];
  do {
    const { data, nextAfter } = await fbFetchAdAccounts(accessToken, after);
    for (const fbAcc of data) {
      const doc = await upsertOneAdAccount(fbAcc, { shopUserId, adminUserId });
      results.push(doc);
    }
    after = nextAfter;
  } while (after);

  return results;
}

/** =========================
 *  DB QUERIES
 *  ========================= */

/** List + filter + paginate */
export async function listAdsAccounts({
  q,
  status, // INTERNAL status: ACTIVE/INACTIVE/PAUSED/DELETED
  account_status, // FB numeric status
  page = 1,
  limit = 10,
  sort = "-updated_at",
}) {
  const filter = {};
  if (q) {
    filter.$or = [
      { name: new RegExp(q, "i") },
      { external_id: new RegExp(q, "i") },
    ];
  }
  if (status) filter.status = status;
  if (typeof account_status !== "undefined") filter.account_status = Number(account_status);

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    AdsAccount.find(filter).sort(sort).skip(skip).limit(Number(limit)),
    AdsAccount.countDocuments(filter),
  ]);

  return {
    items,
    total,
    page: Number(page),
    limit: Number(limit),
    pages: Math.ceil(total / Number(limit)) || 1,
  };
}

export function getAdsAccountById(id) {
  return AdsAccount.findById(id);
}

export function getAdsAccountByExternalId(externalId) {
  return AdsAccount.findOne({ external_id: externalId });
}

export function updateAdsAccount(id, payload) {
  const allowed = ["name", "status", "currency", "timezone_name"];
  const data = {};
  for (const k of allowed) if (payload[k] !== undefined) data[k] = payload[k];
  if (Object.keys(data).length === 0) return getAdsAccountById(id);
  data.last_updated_at = new Date();
  return AdsAccount.findByIdAndUpdate(id, data, { new: true });
}

/** Soft delete = set status INACTIVE + meta flag (không xóa cứng) */
export async function softDeleteAdsAccount(id) {
  return AdsAccount.findByIdAndUpdate(
    id,
    { status: "INACTIVE", last_updated_at: new Date(), "meta.deleted": true },
    { new: true }
  );
}
