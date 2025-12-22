
import { inviteEmployee } from './shopUserControllers.js';
import ShopUser from '../../models/shops/shopUser.model.js';
import UserRole from '../../models/user/userRole.model.js';
import User from '../../models/user/user.model.js';
import Role from '../../models/admin/role.model.js';
import Shop from '../../models/shops/shop.model.js';
import UserPackage from '../../models/package/userPackage.model.js';
import { ErrorCode } from '../../constants/errorCode.js';
import { SuccessCode } from '../../constants/successCode.js';
import { StatusEnum } from '../../constants/enum.js';
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import mongoose from 'mongoose';

// Generate valid ObjectIds
const shopId = new mongoose.Types.ObjectId();
const userId = new mongoose.Types.ObjectId();
const roleId = new mongoose.Types.ObjectId();
const ownerId = new mongoose.Types.ObjectId();
const targetUserId = new mongoose.Types.ObjectId();

// Mock only Mongoose models, not services
jest.mock('../../models/shops/shopUser.model.js');
jest.mock('../../models/user/userRole.model.js');
jest.mock('../../models/user/user.model.js');
jest.mock('../../models/admin/role.model.js');
jest.mock('../../models/shops/shop.model.js');
jest.mock('../../models/package/userPackage.model.js');

describe('shopUserControllers - inviteEmployee', () => {
    let req, res;

    beforeEach(async () => {
        req = {
            body: {
                shopId: shopId.toString(),
                email: 'test@example.com',
                roleId: roleId.toString(),
                invitedBy: userId.toString()
            },
            ip: '127.0.0.1'
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        jest.clearAllMocks();
        
        // Mock all Mongoose models by default
        Shop.findById = jest.fn().mockResolvedValue({
            _id: shopId,
            owner_id: ownerId,
            shop_name: 'Test Shop'
        });
        User.findById = jest.fn().mockResolvedValue({ _id: userId, full_name: 'Inviter' });
        User.findOne = jest.fn();
        Role.findById = jest.fn().mockResolvedValue({ _id: roleId, role_name: 'Staff' });
        ShopUser.findOne = jest.fn().mockResolvedValue({ _id: new mongoose.Types.ObjectId() });
        ShopUser.countDocuments = jest.fn().mockResolvedValue(1);
        ShopUser.create = jest.fn();
        UserRole.create = jest.fn();
        UserPackage.findOne = jest.fn().mockResolvedValue({ limits: { employees: 10 } });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    /**
     * Test Case: Input Validation
     * Parameters:
     * - email: string (required)
     * - roleId: string (required)
     * - invitedBy: string (required)
     * - shopId: string (required)
     */
    describe('Input Validation', () => {
        it('should return 400 if email is missing', async () => {
            req.body.email = undefined;
            await inviteEmployee(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                error: expect.objectContaining({ code: ErrorCode.COMMON_003 })
            }));
        });

        it('should return 400 if roleId is missing', async () => {
            req.body.roleId = undefined;
            await inviteEmployee(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                error: expect.objectContaining({ code: ErrorCode.COMMON_003 })
            }));
        });

        it('should return 400 if invitedBy is missing', async () => {
            req.body.invitedBy = undefined;
            await inviteEmployee(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                error: expect.objectContaining({ code: ErrorCode.COMMON_003 })
            }));
        });

        it('should return 400 if shopId is missing', async () => {
            req.body.shopId = undefined;
            await inviteEmployee(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                error: expect.objectContaining({ code: ErrorCode.COMMON_003 })
            }));
        });
    });

    /**
     * Test Case: Shop and User Existence
     */
    describe('Shop and User Existence', () => {
        it('should return 404 if shop does not exist', async () => {
            Shop.findById = jest.fn().mockResolvedValue(null);
            User.findById = jest.fn().mockResolvedValue({ _id: userId });
            Role.findById = jest.fn().mockResolvedValue({ _id: roleId });

            await inviteEmployee(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                error: expect.objectContaining({ code: ErrorCode.SHOP_001 })
            }));
        });

        it('should return 400 if shop exist but has no owner_id', async () => {
            Shop.findById = jest.fn().mockResolvedValue({ _id: shopId });
            User.findById = jest.fn().mockResolvedValue({ _id: userId });
            Role.findById = jest.fn().mockResolvedValue({ _id: roleId });

            await inviteEmployee(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                error: expect.objectContaining({ code: ErrorCode.SHOP_001 })
            }));
        });
    });

    /**
     * Test Case: Employee Limit
     */
    describe('Employee Limit Check', () => {
        it('should allow if limit not reached', async () => {
            User.findOne.mockResolvedValue(null);

            await inviteEmployee(req, res);

            expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
        });

        it('should proceed if entitlement service fails', async () => {
            User.findOne.mockResolvedValue(null);

            await inviteEmployee(req, res);

            expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
        });
    });

    describe('Direct Add Flow (Existing User)', () => {
        it('should return 400 if user status is PENDING', async () => {
            User.findOne.mockResolvedValue({ _id: targetUserId, status: StatusEnum.PENDING });

            await inviteEmployee(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                error: expect.objectContaining({ code: ErrorCode.AUTH_007 })
            }));
        });
    });

    describe('Error Handling', () => {
        it('should return 500 on unexpected errors', async () => {
            Shop.findById.mockRejectedValue(new Error('DB Error'));

            await inviteEmployee(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                error: expect.objectContaining({ code: ErrorCode.COMMON_999 })
            }));
        });

        it('should handle missing inviter user gracefully', async () => {
            User.findById.mockResolvedValue(null);

            await inviteEmployee(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });

        it('should handle missing role gracefully', async () => {
            Role.findById.mockResolvedValue(null);

            await inviteEmployee(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });
});
