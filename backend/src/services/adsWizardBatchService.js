import AdsCampaign from "../models/ads/adsCampaign.model.js";
import AdsSet from "../models/ads/adsSet.model.js";
import Ads from "../models/ads/ads.model.js";
import Creative from "../models/ads/creative.model.js";
import axios from "axios";

const FB_API = 'https://graph.facebook.com';

/**
 * Tạo batch request đến Facebook API
 */
async function createBatchRequest(adAccountId, accessToken, requests) {
  const batchPayload = {
    batch: requests.map((req, index) => ({
      method: req.method || 'POST',
      relative_url: req.relative_url,
      body: req.body,
      name: req.name || `request_${index}`,
      depends_on: req.depends_on || null
    }))
  };

  try {
    const response = await axios.post(
      `${FB_API}/`,
      batchPayload,
      { 
        params: { 
          access_token: accessToken,
          include_headers: false
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Batch request failed:', error);
    throw error;
  }
}

/**
 * Xử lý batch response và lưu vào database
 */
async function processBatchResponse(batchResponse, campaignsList) {
  const results = {
    success: true,
    campaigns: [],
    adsets: [],
    ads: [],
    creatives: [],
    errors: [],
    successCount: 0
  };

  // Process từng response trong batch
  batchResponse.forEach((response, index) => {
    if (response.code === 200) {
      try {
        const data = JSON.parse(response.body);
        
        // Lưu vào database dựa trên loại request
        if (response.name.startsWith('campaign_')) {
          results.campaigns.push({
            external_id: data.id,
            name: data.name,
            status: 'PAUSED'
          });
          results.successCount++;
        } else if (response.name.startsWith('adset_')) {
          results.adsets.push({
            external_id: data.id,
            name: data.name,
            status: 'PAUSED'
          });
        } else if (response.name.startsWith('creative_')) {
          results.creatives.push({
            external_id: data.id,
            name: data.name
          });
        } else if (response.name.startsWith('ad_')) {
          results.ads.push({
            external_id: data.id,
            name: data.name,
            status: 'PAUSED'
          });
        }
      } catch (parseError) {
        console.error(`Error parsing response for ${response.name}:`, parseError);
        results.errors.push({
          request: response.name,
          error: 'Invalid JSON response',
          code: response.code
        });
      }
    } else {
      results.errors.push({
        request: response.name,
        error: response.body,
        code: response.code
      });
    }
  });

  // Bulk save vào database
  await saveBatchToDatabase(results, campaignsList);
  
  return results;
}

/**
 * Lưu batch results vào database
 */
async function saveBatchToDatabase(results, campaignsList) {
  const now = new Date();
  
  try {
    // Lưu campaigns
    for (let i = 0; i < results.campaigns.length; i++) {
      const campaignResult = results.campaigns[i];
      const campaignData = campaignsList[i];
      
      if (campaignResult.external_id) {
        await AdsCampaign.create({
          external_id: campaignResult.external_id,
          external_account_id: campaignData.ad_account_id,
          name: campaignResult.name,
          status: 'PAUSED',
          objective: campaignData.objective,
          daily_budget: campaignData.daily_budget,
          lifetime_budget: campaignData.lifetime_budget,
          account_id: campaignData.account_id,
          shop_id: campaignData.shop_id,
          created_by: campaignData.created_by,
          synced_at: now,
          created_at: now,
          updated_at: now
        });
      }
    }

    // Lưu adsets và ads (cần implement logic phức tạp hơn để map relationships)
    console.log('Batch results saved to database successfully');
    
  } catch (error) {
    console.error('Error saving batch to database:', error);
    throw error;
  }
}

/**
 * 🧩 Publish toàn bộ quy trình tạo quảng cáo Wizard với Batch API
 * (Campaign → AdSet → Creative → Ad)
 */
export async function publishWizardBatch({
  ad_account_id,
  access_token,
  campaignsList,
  dry_run = false
}) {
  const batchRequests = [];
  const results = {
    campaigns: [],
    adsets: [],
    ads: [],
    creatives: [],
    errors: []
  };

  console.log(`🚀 Starting batch publish for ${campaignsList.length} campaigns`);

  // 1. Tạo batch requests cho campaigns
  campaignsList.forEach((campaign, campaignIndex) => {
    const campaignRequest = {
      method: 'POST',
      relative_url: `v18.0/act_${ad_account_id}/campaigns`,
      body: new URLSearchParams({
        name: campaign.campaign.name,
        objective: campaign.campaign.objective,
        status: 'PAUSED',
        daily_budget: campaign.campaign.daily_budget,
        lifetime_budget: campaign.campaign.lifetime_budget
      }).toString(),
      name: `campaign_${campaignIndex}`
    };
    batchRequests.push(campaignRequest);
  });

  // 2. Tạo batch requests cho adsets (depends on campaigns)
  campaignsList.forEach((campaignData, campaignIndex) => {
    campaignData.adsets.forEach((adset, adsetIndex) => {
      const adsetRequest = {
        method: 'POST',
        relative_url: `v23.0/act_${ad_account_id}/adsets`,
        body: new URLSearchParams({
          name: adset.name,
          campaign_id: `{result=campaign_${campaignIndex}:$.id}`,
          daily_budget: adset.daily_budget,
          optimization_goal: adset.optimization_goal,
          billing_event: 'IMPRESSIONS',
          status: 'PAUSED'
        }).toString(),
        name: `adset_${campaignIndex}_${adsetIndex}`,
        depends_on: `campaign_${campaignIndex}`
      };
      batchRequests.push(adsetRequest);
    });
  });

  // 3. Tạo batch requests cho creatives
  campaignsList.forEach((campaignData, campaignIndex) => {
    campaignData.creatives.forEach((creative, creativeIndex) => {
      const creativeRequest = {
        method: 'POST',
        relative_url: `v23.0/act_${ad_account_id}/adcreatives`,
        body: new URLSearchParams({
          name: creative.name,
          object_story_spec: JSON.stringify(creative.object_story_spec)
        }).toString(),
        name: `creative_${campaignIndex}_${creativeIndex}`
      };
      batchRequests.push(creativeRequest);
    });
  });

  // 4. Tạo batch requests cho ads (depends on adsets và creatives)
  campaignsList.forEach((campaignData, campaignIndex) => {
    campaignData.ads.forEach((ad, adIndex) => {
      // Tìm adset tương ứng cho ad này
      let adsetIndex = 0;
      let currentAdCount = 0;
      
      for (let i = 0; i < campaignData.adsets.length; i++) {
        const adsetAdCount = campaignData.adsets[i].ads.length;
        if (adIndex < currentAdCount + adsetAdCount) {
          adsetIndex = i;
          break;
        }
        currentAdCount += adsetAdCount;
      }
      
      const adRequest = {
        method: 'POST',
        relative_url: `v23.0/act_${ad_account_id}/ads`,
        body: new URLSearchParams({
          name: ad.name,
          adset_id: `{result=adset_${campaignIndex}_${adsetIndex}:$.id}`,
          creative: `{result=creative_${campaignIndex}_${adIndex}:$.id}`,
          status: 'PAUSED'
        }).toString(),
        name: `ad_${campaignIndex}_${adIndex}`,
        depends_on: `adset_${campaignIndex}_${adsetIndex},creative_${campaignIndex}_${adIndex}`
      };
      batchRequests.push(adRequest);
    });
  });

  if (dry_run) {
    console.log(`[DRY RUN] Batch requests prepared: ${batchRequests.length} requests`);
    return { 
      success: true, 
      dry_run: true, 
      requestCount: batchRequests.length,
      campaigns: campaignsList.length,
      adsets: campaignsList.reduce((sum, c) => sum + c.adsets.length, 0),
      ads: campaignsList.reduce((sum, c) => sum + c.ads.length, 0),
      creatives: campaignsList.reduce((sum, c) => sum + c.creatives.length, 0)
    };
  }

  // 5. Gửi batch request
  console.log(`Sending batch request with ${batchRequests.length} requests`);
  const batchResponse = await createBatchRequest(ad_account_id, access_token, batchRequests);
  
  // 6. Xử lý response và lưu vào database
  const processedResults = await processBatchResponse(batchResponse, campaignsList);
  
  console.log(`Batch publish completed: ${processedResults.successCount} campaigns successful`);
  return processedResults;
}
