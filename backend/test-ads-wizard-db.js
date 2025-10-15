// Test script để kiểm tra chức năng lưu quảng cáo vào database
import mongoose from 'mongoose';
import { publishWizard } from './src/services/adsWizardService.js';
import AdsCampaign from './src/models/ads/adsCampaign.model.js';
import AdsSet from './src/models/ads/adsSet.model.js';
import Ads from './src/models/ads/ads.model.js';
import Creative from './src/models/ads/creative.model.js';

// Kết nối database
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/auto-ads-management', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Kết nối database thành công');
  } catch (error) {
    console.error('❌ Lỗi kết nối database:', error);
    process.exit(1);
  }
};

// Test data
const testData = {
  ad_account_id: 'act_123456789',
  access_token: 'test_token',
  campaign: {
    name: 'Test Campaign',
    objective: 'OUTCOME_ENGAGEMENT',
    page_id: '123456789',
    page_name: 'Test Page',
    daily_budget: 100000,
    account_id: new mongoose.Types.ObjectId(),
    shop_id: new mongoose.Types.ObjectId(),
    created_by: new mongoose.Types.ObjectId(),
  },
  adset: {
    name: 'Test AdSet',
    optimization_goal: 'POST_ENGAGEMENT',
    billing_event: 'IMPRESSIONS',
    bid_strategy: 'LOWEST_COST_WITH_BID_CAP',
    bid_amount: 1000,
    targeting: {
      age_min: 18,
      age_max: 45,
      geo_locations: { countries: ['VN'] },
    },
    daily_budget: 50000,
    start_time: new Date(),
    end_time: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    created_by: new mongoose.Types.ObjectId(),
  },
  creative: {
    name: 'Test Creative',
    object_story_spec: {
      page_id: '123456789',
      link_data: {
        message: 'Test message',
        link: 'https://example.com',
        name: 'Test headline',
        description: 'Test description',
        call_to_action: {
          type: 'MESSAGE_PAGE',
          value: { link: 'https://example.com' },
        },
      },
    },
    created_by: new mongoose.Types.ObjectId(),
  },
  ad: {
    name: 'Test Ad',
    created_by: new mongoose.Types.ObjectId(),
  },
  dry_run: true, // Sử dụng dry run để test
};

// Test function
const testPublishWizard = async () => {
  try {
    console.log('🧪 Bắt đầu test publish wizard...');
    
    const result = await publishWizard(testData);
    
    console.log('✅ Test thành công!');
    console.log('📊 Kết quả:', JSON.stringify(result, null, 2));
    
    // Kiểm tra database
    console.log('\n🔍 Kiểm tra database...');
    
    const campaigns = await AdsCampaign.find({ name: 'Test Campaign' });
    const adsets = await AdsSet.find({ name: 'Test AdSet' });
    const creatives = await Creative.find({ name: 'Test Creative' });
    const ads = await Ads.find({ name: 'Test Ad' });
    
    console.log(`📈 Campaigns tìm thấy: ${campaigns.length}`);
    console.log(`📈 AdSets tìm thấy: ${adsets.length}`);
    console.log(`📈 Creatives tìm thấy: ${creatives.length}`);
    console.log(`📈 Ads tìm thấy: ${ads.length}`);
    
    if (campaigns.length > 0) {
      console.log('✅ Campaign đã được lưu vào database');
      console.log('📋 Campaign details:', {
        id: campaigns[0]._id,
        external_id: campaigns[0].external_id,
        name: campaigns[0].name,
        status: campaigns[0].status,
      });
    }
    
    if (adsets.length > 0) {
      console.log('✅ AdSet đã được lưu vào database');
      console.log('📋 AdSet details:', {
        id: adsets[0]._id,
        external_id: adsets[0].external_id,
        name: adsets[0].name,
        status: adsets[0].status,
        campaign_id: adsets[0].campaign_id,
      });
    }
    
    if (creatives.length > 0) {
      console.log('✅ Creative đã được lưu vào database');
      console.log('📋 Creative details:', {
        id: creatives[0]._id,
        external_id: creatives[0].external_id,
        name: creatives[0].name,
        creative_type: creatives[0].creative_type,
      });
    }
    
    if (ads.length > 0) {
      console.log('✅ Ad đã được lưu vào database');
      console.log('📋 Ad details:', {
        id: ads[0]._id,
        external_id: ads[0].external_id,
        name: ads[0].name,
        status: ads[0].status,
        set_id: ads[0].set_id,
        creative_id: ads[0].creative_id,
      });
    }
    
  } catch (error) {
    console.error('❌ Test thất bại:', error.message);
    console.error('📋 Chi tiết lỗi:', error);
  }
};

// Cleanup function
const cleanup = async () => {
  try {
    console.log('\n🧹 Dọn dẹp test data...');
    await AdsCampaign.deleteMany({ name: 'Test Campaign' });
    await AdsSet.deleteMany({ name: 'Test AdSet' });
    await Creative.deleteMany({ name: 'Test Creative' });
    await Ads.deleteMany({ name: 'Test Ad' });
    console.log('✅ Đã dọn dẹp test data');
  } catch (error) {
    console.error('❌ Lỗi khi dọn dẹp:', error);
  }
};

// Main function
const main = async () => {
  await connectDB();
  await testPublishWizard();
  await cleanup();
  await mongoose.disconnect();
  console.log('🏁 Test hoàn thành');
};

// Chạy test
main().catch(console.error);
