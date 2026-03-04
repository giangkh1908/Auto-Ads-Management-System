/**
 * Test script for insights sync - ALL ACCOUNTS
 * Run: node src/scripts/testInsightsSync.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { syncInsightsForAccount } from '../services/ads/insightsSyncService.js';
import AdsAccount from '../models/ads/adsAccount.model.js';

dotenv.config();

async function testSync() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URL);
        console.log('✅ Connected to MongoDB');

        // Lấy TẤT CẢ accounts ACTIVE để test
        const accounts = await AdsAccount.find({ status: 'ACTIVE' })
            .select('_id external_id name')
            .lean();

        if (accounts.length === 0) {
            console.error('❌ No ACTIVE accounts found');
            process.exit(1);
        }

        console.log(`\n📊 Found ${accounts.length} ACTIVE accounts to sync`);
        console.log('═'.repeat(60));

        const overallStart = Date.now();
        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < accounts.length; i++) {
            const account = accounts[i];
            console.log(`\n[${i + 1}/${accounts.length}] 📊 ${account.external_id} (${account.name || 'N/A'})`);
            console.log('─'.repeat(60));

            const startTime = Date.now();

            try {
                await syncInsightsForAccount(account._id);
                const duration = ((Date.now() - startTime) / 1000).toFixed(2);
                console.log(`✅ Completed in ${duration}s`);
                successCount++;
            } catch (err) {
                console.error(`❌ Failed: ${err.message}`);
                errorCount++;
            }
        }

        const totalDuration = ((Date.now() - overallStart) / 1000).toFixed(2);
        console.log('\n' + '═'.repeat(60));
        console.log(`📊 SUMMARY: ${successCount} success, ${errorCount} errors in ${totalDuration}s`);

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
        process.exit(0);
    }
}

testSync();
