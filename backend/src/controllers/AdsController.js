import axios from 'axios';
import Shop from '../models/shop.model.js';
import Log from '../models/log.model.js';

// Controller to map CreateAdsWizard payload into Facebook Ads payloads
// and optionally post them to Facebook if ad_account_id and pageAccessToken are provided.

const OBJECTIVE_MAP = {
  AWARENESS: 'OUTCOME_AWARENESS',
  TRAFFIC: 'LINK_CLICKS',
  ENGAGEMENT: 'POST_ENGAGEMENT',
  LEADS: 'LEAD_GENERATION',
  APP_PROMOTION: 'APP_INSTALLS',
  SALES: 'CONVERSIONS',
};

const CTA_MAP = {
  'Gửi tin nhắn': 'MESSAGE',
  'Gửi': 'MESSAGE',
  'Tìm hiểu thêm': 'LEARN_MORE',
  'Mua ngay': 'SHOP_NOW',
};

function mapObjective(ui) {
  return OBJECTIVE_MAP[ui] || ui || 'OUTCOME_AWARENESS';
}

function mapCTA(label) {
  return CTA_MAP[label] || 'LEARN_MORE';
}

function formatStartTime(dateStr) {
  try {
    const d = dateStr ? new Date(dateStr) : new Date(Date.now() + 24 * 60 * 60 * 1000);
    // remove milliseconds and append +0000
    return d.toISOString().split('.')[0] + '+0000';
  } catch (e) {
    return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('.')[0] + '+0000';
  }
}

export const createFromWizard = async (req, res) => {
  try {
    const { campaign = {}, adset = {}, ad = {}, page_id, pageAccessToken, shopId, ad_account_id } = req.body;

    // collect missing fields so we can inform the caller
    const missing = [];

    // Resolve pageAccessToken if not provided directly
    let resolvedPageToken = pageAccessToken || null;
    if (!resolvedPageToken) {
      if (shopId && page_id) {
        const shop = await Shop.findById(shopId).select('+facebook_pages');
        if (shop) {
          const entry = (shop.facebook_pages || []).find(p => p.page_id === page_id);
          if (entry) resolvedPageToken = entry.page_token;
        }
      }
    }

    if (!page_id) missing.push('page_id');
    if (!resolvedPageToken) missing.push('pageAccessToken (or connect page to shop)');
    if (!ad_account_id) missing.push('ad_account_id (required to actually create Ads on FB)');

    // Build Campaign payload
    const campaignPayload = {
      name: campaign.name || 'Chiến dịch từ CreateAdsWizard',
      objective: mapObjective(campaign.objective),
      status: campaign.status || 'PAUSED',
      special_ad_categories: campaign.special_ad_categories || [],
    };

    if (!campaign.name) missing.push('campaign.name');

    // Build AdSet payload
    const adsetPayload = {
      name: adset.name || 'AdSet từ CreateAdsWizard',
      campaign_id: adset.campaign_id || '<CAMPAIGN_ID_PLACEHOLDER>',
      optimization_goal: adset.optimization_goal || 'REACH',
      billing_event: adset.billing_event || 'IMPRESSIONS',
      bid_strategy: adset.bid_strategy || 'LOWEST_COST_WITHOUT_CAP',
      daily_budget: typeof adset.budget === 'number' ? adset.budget : (adset.daily_budget || 10000), // VND unit
      targeting: {
        geo_locations: { countries: adset.targeting?.countries || (adset.targeting?.location ? [adset.targeting.location] : ['VN']) },
        genders: adset.targeting?.genders || [1, 2],
        age_min: adset.targeting?.ageMin || adset.targeting?.age_min || 18,
        age_max: adset.targeting?.ageMax || adset.targeting?.age_max || 65,
        targeting_automation: adset.targeting?.targeting_automation || { advantage_audience: 0 },
      },
      status: adset.status || 'PAUSED',
      start_time: adset.schedule?.start ? formatStartTime(adset.schedule.start) : formatStartTime(),
    };

    if (!adset.name) missing.push('adset.name');

    // Build Creative payload
    const creativePayload = {
      name: ad.name || 'Creative từ CreateAdsWizard',
      object_story_spec: {
        page_id: page_id || ad.page || '<PAGE_ID_PLACEHOLDER>',
        link_data: {
          message: ad.primaryText || 'Tin nhắn mặc định từ CreateAdsWizard',
          link: ad.link || 'https://facebook.com',
          name: ad.headline || 'Tiêu đề quảng cáo',
          description: ad.description || 'Mô tả quảng cáo',
          call_to_action: { type: mapCTA(ad.cta) },
        },
      },
    };

    if (!ad.headline) missing.push('ad.headline');

    // Build Ad payload
    const adPayload = {
      name: ad.name || 'Ad từ CreateAdsWizard',
      adset_id: ad.adset_id || '<ADSET_ID_PLACEHOLDER>',
      creative: { creative_id: ad.creative_id || '<CREATIVE_ID_PLACEHOLDER>' },
      status: ad.status || 'PAUSED',
    };

    // If required params missing, we still return the constructed payloads and missing list
    const response = {
      success: true,
      note: 'Payloads constructed. Provide missing fields to post to Facebook.',
      missing_fields: missing,
      payloads: {
        campaign: campaignPayload,
        adset: adsetPayload,
        creative: creativePayload,
        ad: adPayload,
      },
    };

    // Optionally attempt to post to Facebook if we have ad_account_id and page token
    if (ad_account_id && resolvedPageToken) {
      // Build endpoints (Marketing API expects POST to /act_<AD_ACCOUNT_ID>/campaigns etc.)
      const adAccountPath = `https://graph.facebook.com/v17.0/act_${ad_account_id}`;

      // 1) Create Campaign
      const campResp = await axios.post(
        `${adAccountPath}/campaigns`,
        {
          name: campaignPayload.name,
          objective: campaignPayload.objective,
          status: campaignPayload.status,
          special_ad_categories: campaignPayload.special_ad_categories,
        },
        {
          params: { access_token: resolvedPageToken },
          headers: { 'Content-Type': 'application/json' },
        }
      );

      // Dữ liệu phản hồi
      console.log(campResp.data);

      const campData = campResp.data;
      response.post = response.post || {};
      response.post.campaign = campData;

      // Log campaign creation (non-blocking)
      try {
        const ip = req.headers['x-forwarded-for'] || req.ip || req.connection?.remoteAddress || null;
        await Log.create({
          user_id: req.user?._id || null,
          shop_id: shopId || null,
          action: 'Tạo chiến dịch từ wizard',
          target_type: 'facebook_campaign',
          target_id: campData?.id || null,
          request: { body: req.body },
          response: campData,
          success: true,
          error_message: null,
          source: 'manual',
          ip_address: ip,
          meta: { locale: 'vi' },
        });
      } catch (logErr) {
        console.error('Lỗi khi lưu log chiến dịch (create campaign):', logErr);
      }

      // Use returned id if available
      const createdCampaignId = campData.id;
      if (createdCampaignId) adsetPayload.campaign_id = createdCampaignId;

      // 2) Create AdSet
      const adsetResp = await axios.post(
        `${adAccountPath}/adsets`,
        {
          name: adsetPayload.name,
          campaign_id: adsetPayload.campaign_id,
          optimization_goal: adsetPayload.optimization_goal,
          billing_event: adsetPayload.billing_event,
          bid_strategy: adsetPayload.bid_strategy,
          daily_budget: adsetPayload.daily_budget,
          targeting: JSON.stringify(adsetPayload.targeting),
          status: adsetPayload.status,
          start_time: adsetPayload.start_time,
        },
        { params: { access_token: resolvedPageToken }, headers: { 'Content-Type': 'application/json' } }
      );

      const adsetData = adsetResp.data;
      response.post.adset = adsetData;

      // Log adset creation (non-blocking)
      try {
        const ip = req.headers['x-forwarded-for'] || req.ip || req.connection?.remoteAddress || null;
        await Log.create({
          user_id: req.user?._id || null,
          shop_id: shopId || null,
          action: 'Tạo adset từ wizard',
          target_type: 'facebook_adset',
          target_id: adsetData?.id || null,
          request: { body: req.body },
          response: adsetData,
          success: true,
          error_message: null,
          source: 'manual',
          ip_address: ip,
          meta: { locale: 'vi' },
        });
      } catch (logErr) {
        console.error('Lỗi khi lưu log adset (create adset):', logErr);
      }

      const createdAdsetId = adsetData.id;
      if (createdAdsetId) adPayload.adset_id = createdAdsetId;

      // 3) Create Creative using page token (Creative endpoint is under /act_<AD_ACCOUNT_ID>/adcreatives)
      const creativeResp = await axios.post(
        `${adAccountPath}/adcreatives`,
        {
          name: creativePayload.name,
          object_story_spec: creativePayload.object_story_spec,
        },
        { params: { access_token: resolvedPageToken }, headers: { 'Content-Type': 'application/json' } }
      );
      const creativeData = creativeResp.data;
      response.post.creative = creativeData;

      const createdCreativeId = creativeData.id;
      if (createdCreativeId) adPayload.creative = { creative_id: createdCreativeId };

      // 4) Create Ad
      const adResp = await axios.post(
        `${adAccountPath}/ads`,
        {
          name: adPayload.name,
          adset_id: adPayload.adset_id,
          creative: adPayload.creative,
          status: adPayload.status,
        },
        { params: { access_token: resolvedPageToken }, headers: { 'Content-Type': 'application/json' } }
      );
      const adData = adResp.data;
      response.post.ad = adData;
    }

    // Save a Vietnamese log entry (non-blocking: catch logging errors)
    try {
      const ip = req.headers['x-forwarded-for'] || req.ip || req.connection?.remoteAddress || null;
      const targetId = response.post?.ad?.id || response.post?.creative?.id || response.post?.adset?.id || response.post?.campaign?.id || ad_account_id || null;
      const logEntry = {
        user_id: req.user?._id || null,
        shop_id: shopId || null,
        action: 'Tạo quảng cáo từ wizard',
        target_type: 'facebook_ads_wizard',
        target_id: targetId,
        request: { body: req.body },
        response,
        success: true,
        error_message: null,
        source: 'manual',
        ip_address: ip,
        meta: { locale: 'vi' },
      };
      await Log.create(logEntry);
    } catch (logErr) {
      console.error('Lỗi khi lưu log (createFromWizard):', logErr);
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error('createFromWizard error:', error);
    // Save error log in Vietnamese
    try {
      const ip = req.headers['x-forwarded-for'] || req.ip || req.connection?.remoteAddress || null;
      await Log.create({
        user_id: req.user?._id || null,
        shop_id: req.body?.shopId || null,
        action: 'Lỗi khi tạo quảng cáo từ wizard',
        target_type: 'facebook_ads_wizard',
        target_id: req.body?.ad_account_id || null,
        request: { body: req.body },
        response: error.response?.data || null,
        success: false,
        error_message: error.message,
        source: 'system',
        ip_address: ip,
        meta: { locale: 'vi' },
      });
    } catch (logErr) {
      console.error('Lỗi khi lưu log lỗi (createFromWizard):', logErr);
    }

    return res.status(500).json({ success: false, message: 'Lỗi khi tạo ads từ wizard', detail: error.message });
  }
};

export default { createFromWizard };
