import dotenv from "dotenv";
import { connectDB } from "../config/db.js";
import User from "../models/user/user.model.js";
import Shop from "../models/shops/shop.model.js";
import ShopUser from "../models/shops/shopUser.model.js";
import UserRole from "../models/user/userRole.model.js";
import { RoleEnum } from "../constants/enum.js";
import bcrypt from "bcrypt";

dotenv.config();

/**
 * Script to create 50 performance test accounts.
 * Each account will have:
 * - A User record (with hashed password)
 * - A Shop record (owned by the user)
 * - A ShopUser record (linking user and shop as manager)
 * - A UserRole record (granting SHOP_OWNER role)
 */
async function createAccounts(count = 499) {
    try {
        await connectDB();
        console.log("✅ Connected to database");

        // Define a common password for all test accounts
        const password = "password123";
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log(`🔑 Using common password: ${password}`);

        for (let i = 51; i <= count; i++) {
            const email = `perf_test_${i}@example.com`;
            const fullName = `Performance Test User ${i}`;

            // Check if user already exists to avoid duplicates
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                console.log(`⚠️ User ${email} already exists, skipping...`);
                continue;
            }

            // 1. Create User
            const user = await User.create({
                full_name: fullName,
                email: email,
                password: hashedPassword,
                phone: `09876543${i.toString().padStart(2, '0')}`,
                provider: "local",
                emailVerified: true,
                status: "active",
            });

            // 2. Create Shop
            // Standard registration creates a default shop for the user
            const shop = await Shop.create({
                shop_name: `${fullName}'s Shop`,
                owner_id: user._id,
                status: "active",
                settings: {
                    currency: "VND",
                    timezone: "Asia/Ho_Chi_Minh",
                    language: "vi",
                },
                created_by: user._id,
                updated_by: user._id,
            });

            // 3. Create ShopUser
            // Links the user to the shop with 'active' status
            const shopUser = await ShopUser.create({
                user_id: user._id,
                shop_id: shop._id,
                is_manager: true,
                status: "active",
            });

            // 4. Create UserRole
            // Grants the SHOP_OWNER role to the user for this shop
            await UserRole.create({
                user_id: user._id,
                role_id: RoleEnum.SHOP_OWNER,
                shop_id: shop._id,
                shop_user_id: shopUser._id,
                is_current: true,
                source: "system",
            });

            console.log(`[${i}/${count}] ✅ Created user: ${email} | ShopID: ${shop._id}`);
        }

        console.log(`\n🎉 Successfully processed ${count} performance test accounts.`);
        process.exit(0);
    } catch (error) {
        console.error("❌ Fatal error during account creation:", error);
        process.exit(1);
    }
}

// Default to 499 accounts as requested
createAccounts(499);
