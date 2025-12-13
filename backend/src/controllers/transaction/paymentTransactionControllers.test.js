import {
    createPaymentTransaction,
    getPaymentTransactions,
    getPaymentTransactionFilters,
    getPaymentTransactionById,
    updatePaymentTransaction,
    setPaymentMethod,
    confirmBankTransfer,
    deletePaymentTransaction,
} from './paymentTransactionControllers.js';
import PaymentTransaction from '../../models/transaction/paymentTransaction.model.js';
import UserPackage from '../../models/package/userPackage.model.js';
import User from '../../models/user/user.model.js';
import Package from '../../models/package/package.model.js';
import mongoose from 'mongoose';
import { sendPackageApprovalEmail } from '../../services/emailService.js';
import { createInvoice } from '../invoice/invoiceControllers.js';

// Mock all dependencies
jest.mock('../../models/transaction/paymentTransaction.model.js');
jest.mock('../../models/package/userPackage.model.js');
jest.mock('../../models/user/user.model.js');
jest.mock('../../models/package/package.model.js');
jest.mock('../../services/emailService.js');
jest.mock('../invoice/invoiceControllers.js');
jest.mock('../../services/shopPackageSyncService.js', () => ({
    syncShopPackagesWithOwner: jest.fn().mockResolvedValue({}),
}));

describe('Payment Transaction Controllers', () => {
    let req, res;

    beforeEach(() => {
        // Reset all mocks before each test
        jest.clearAllMocks();

        // Setup default request and response objects
        req = {
            body: {},
            params: {},
            query: {},
            user: {
                _id: new mongoose.Types.ObjectId(),
            },
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
    });

    // ========================================
    // 1. createPaymentTransaction
    // ========================================
    describe('createPaymentTransaction', () => {
        // Test Case 1.1: Normal - Successful creation
        it('TC1.1 - Normal: Should create payment transaction successfully', async () => {
            // Arrange
            const transactionData = {
                package_id: new mongoose.Types.ObjectId(),
                amount: 1000000,
                currency: 'VND',
                method: 'manual banking',
            };
            req.body = transactionData;

            const mockTransaction = {
                _id: new mongoose.Types.ObjectId(),
                ...transactionData,
                user_id: req.user._id,
                created_by: req.user._id,
            };

            PaymentTransaction.create = jest.fn().mockResolvedValue(mockTransaction);

            // Act
            await createPaymentTransaction(req, res);

            // Assert
            expect(PaymentTransaction.create).toHaveBeenCalledWith({
                ...transactionData,
                user_id: req.user._id,
                created_by: req.user._id,
            });
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Tạo giao dịch thành công',
                data: mockTransaction,
            });
        });

        // Test Case 1.2: Abnormal - Database error
        it('TC1.2 - Abnormal: Should handle database error', async () => {
            // Arrange
            req.body = { amount: 1000000 };
            const error = new Error('Database connection failed');
            PaymentTransaction.create = jest.fn().mockRejectedValue(error);

            // Act
            await createPaymentTransaction(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Lỗi tạo giao dịch',
                error: error.message,
            });
        });

        // Test Case 1.3: Boundary - Missing user context
        it('TC1.3 - Boundary: Should handle missing user context', async () => {
            // Arrange
            req.user = undefined;
            req.body = { amount: 1000000 };

            const mockTransaction = {
                _id: new mongoose.Types.ObjectId(),
                ...req.body,
                user_id: undefined,
                created_by: undefined,
            };

            PaymentTransaction.create = jest.fn().mockResolvedValue(mockTransaction);

            // Act
            await createPaymentTransaction(req, res);

            // Assert
            expect(PaymentTransaction.create).toHaveBeenCalledWith({
                ...req.body,
                user_id: undefined,
                created_by: undefined,
            });
            expect(res.status).toHaveBeenCalledWith(201);
        });
    });

    // ========================================
    // 2. getPaymentTransactions
    // ========================================
    describe('getPaymentTransactions', () => {
        // Test Case 2.1: Normal - Get transactions with default pagination
        it('TC2.1 - Normal: Should get transactions with default pagination', async () => {
            // Arrange
            const mockTransactions = [
                { _id: new mongoose.Types.ObjectId(), amount: 1000000 },
                { _id: new mongoose.Types.ObjectId(), amount: 2000000 },
            ];

            PaymentTransaction.aggregate = jest.fn()
                .mockResolvedValueOnce([{ total: 2 }]) // count query
                .mockResolvedValueOnce(mockTransactions); // data query

            // Act
            await getPaymentTransactions(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                total: 2,
                page: 1,
                pages: 1,
                data: mockTransactions,
            });
        });

        // Test Case 2.2: Normal - Filter by status
        it('TC2.2 - Normal: Should filter transactions by status', async () => {
            // Arrange
            req.query = { status: 'success', page: '1', limit: '10' };

            PaymentTransaction.aggregate = jest.fn()
                .mockResolvedValueOnce([{ total: 1 }])
                .mockResolvedValueOnce([{ _id: '123', status: 'success' }]);

            // Act
            await getPaymentTransactions(req, res);

            // Assert
            expect(PaymentTransaction.aggregate).toHaveBeenCalled();
            const firstCall = PaymentTransaction.aggregate.mock.calls[0][0];
            const matchStage = firstCall.find(stage => stage.$match && stage.$match.status);
            expect(matchStage.$match.status).toBe('success');
        });

        // Test Case 2.3: Normal - Filter by payment method
        it('TC2.3 - Normal: Should filter transactions by payment method', async () => {
            // Arrange
            req.query = { method: 'manual banking' };

            PaymentTransaction.aggregate = jest.fn()
                .mockResolvedValueOnce([{ total: 1 }])
                .mockResolvedValueOnce([{ _id: '123', method: 'manual banking' }]);

            // Act
            await getPaymentTransactions(req, res);

            // Assert
            expect(PaymentTransaction.aggregate).toHaveBeenCalled();
            const firstCall = PaymentTransaction.aggregate.mock.calls[0][0];
            const matchStage = firstCall.find(stage => stage.$match && stage.$match.method);
            expect(matchStage.$match.method).toEqual({ $regex: '^manual banking$', $options: 'i' });
        });

        // Test Case 2.4: Normal - Filter by assigned status (assigned)
        it('TC2.4 - Normal: Should filter by assigned status', async () => {
            // Arrange
            req.query = { assigned_status: 'assigned' };

            PaymentTransaction.aggregate = jest.fn()
                .mockResolvedValueOnce([{ total: 1 }])
                .mockResolvedValueOnce([{ _id: '123' }]);

            // Act
            await getPaymentTransactions(req, res);

            // Assert
            const firstCall = PaymentTransaction.aggregate.mock.calls[0][0];
            const matchStage = firstCall.find(stage => stage.$match && stage.$match.assigned_to);
            expect(matchStage.$match.assigned_to).toEqual({ $ne: null });
        });

        // Test Case 2.5: Normal - Filter by assigned status (unassigned)
        it('TC2.5 - Normal: Should filter by unassigned status', async () => {
            // Arrange
            req.query = { assigned_status: 'unassigned' };

            PaymentTransaction.aggregate = jest.fn()
                .mockResolvedValueOnce([{ total: 1 }])
                .mockResolvedValueOnce([{ _id: '123' }]);

            // Act
            await getPaymentTransactions(req, res);

            // Assert
            const firstCall = PaymentTransaction.aggregate.mock.calls[0][0];
            const matchStage = firstCall.find(stage => stage.$match && stage.$match.assigned_to !== undefined);
            expect(matchStage.$match.assigned_to).toBe(null);
        });

        // Test Case 2.6: Normal - Filter by valid package_id (ObjectId)
        it('TC2.6 - Normal: Should filter by valid package ObjectId', async () => {
            // Arrange
            const packageId = new mongoose.Types.ObjectId();
            req.query = { package_id: packageId.toString() };

            PaymentTransaction.aggregate = jest.fn()
                .mockResolvedValueOnce([{ total: 1 }])
                .mockResolvedValueOnce([{ _id: '123' }]);

            // Act
            await getPaymentTransactions(req, res);

            // Assert
            const firstCall = PaymentTransaction.aggregate.mock.calls[0][0];
            const matchStage = firstCall.find(stage => stage.$match && stage.$match['package_id._id']);
            expect(matchStage.$match['package_id._id']).toBeInstanceOf(mongoose.Types.ObjectId);
        });

        // Test Case 2.7: Normal - Filter by package name
        it('TC2.7 - Normal: Should filter by package name', async () => {
            // Arrange
            const mockPackage = { _id: new mongoose.Types.ObjectId(), name: 'Premium' };
            req.query = { package_id: 'Premium' };

            Package.findOne = jest.fn().mockResolvedValue(mockPackage);
            PaymentTransaction.aggregate = jest.fn()
                .mockResolvedValueOnce([{ total: 1 }])
                .mockResolvedValueOnce([{ _id: '123' }]);

            // Act
            await getPaymentTransactions(req, res);

            // Assert
            expect(Package.findOne).toHaveBeenCalledWith({
                name: { $regex: '^Premium$', $options: 'i' }
            });
        });

        // Test Case 2.8: Abnormal - Package name not found
        it('TC2.8 - Abnormal: Should return empty when package name not found', async () => {
            // Arrange
            req.query = { package_id: 'NonExistentPackage' };
            Package.findOne = jest.fn().mockResolvedValue(null);

            // Act
            await getPaymentTransactions(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                total: 0,
                page: 1,
                pages: 0,
                data: [],
            });
        });

        // Test Case 2.9: Normal - Filter by date range (dd/mm/yyyy format)
        it('TC2.9 - Normal: Should filter by date range', async () => {
            // Arrange
            req.query = {
                startDate: '01/01/2024',
                endDate: '31/12/2024',
            };

            PaymentTransaction.aggregate = jest.fn()
                .mockResolvedValueOnce([{ total: 1 }])
                .mockResolvedValueOnce([{ _id: '123' }]);

            // Act
            await getPaymentTransactions(req, res);

            // Assert
            const firstCall = PaymentTransaction.aggregate.mock.calls[0][0];
            const matchStage = firstCall.find(stage => stage.$match && stage.$match.payment_at);
            expect(matchStage.$match.payment_at).toHaveProperty('$gte');
            expect(matchStage.$match.payment_at).toHaveProperty('$lte');
        });

        // Test Case 2.10: Boundary - Invalid date format
        it('TC2.10 - Boundary: Should handle invalid date format', async () => {
            // Arrange
            req.query = { startDate: 'invalid-date' };

            PaymentTransaction.aggregate = jest.fn()
                .mockResolvedValueOnce([{ total: 1 }])
                .mockResolvedValueOnce([{ _id: '123' }]);

            // Act
            await getPaymentTransactions(req, res);

            // Assert - Should not crash, date filter should be ignored
            expect(res.status).toHaveBeenCalledWith(200);
        });

        // Test Case 2.11: Normal - Search by user name
        it('TC2.11 - Normal: Should search by user name', async () => {
            // Arrange
            req.query = { search: 'John Doe' };

            PaymentTransaction.aggregate = jest.fn()
                .mockResolvedValueOnce([{ total: 1 }])
                .mockResolvedValueOnce([{ _id: '123' }]);

            // Act
            await getPaymentTransactions(req, res);

            // Assert
            const firstCall = PaymentTransaction.aggregate.mock.calls[0][0];
            const matchStage = firstCall.find(stage => stage.$match && stage.$match.$or);
            expect(matchStage.$match.$or).toBeDefined();
        });

        // Test Case 2.12: Normal - Search by transaction ID
        it('TC2.12 - Normal: Should search by valid transaction ID', async () => {
            // Arrange
            const validId = new mongoose.Types.ObjectId();
            req.query = { search: validId.toString() };

            PaymentTransaction.aggregate = jest.fn()
                .mockResolvedValueOnce([{ total: 1 }])
                .mockResolvedValueOnce([{ _id: validId }]);

            // Act
            await getPaymentTransactions(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(200);
        });

        // Test Case 2.13: Normal - Pagination with custom page and limit
        it('TC2.13 - Normal: Should handle custom pagination', async () => {
            // Arrange
            req.query = { page: '2', limit: '5' };

            PaymentTransaction.aggregate = jest.fn()
                .mockResolvedValueOnce([{ total: 20 }])
                .mockResolvedValueOnce([{ _id: '123' }]);

            // Act
            await getPaymentTransactions(req, res);

            // Assert
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    page: 2,
                    pages: 4,
                    total: 20,
                })
            );
        });

        // Test Case 2.14: Boundary - Empty result set
        it('TC2.14 - Boundary: Should handle empty result set', async () => {
            // Arrange
            PaymentTransaction.aggregate = jest.fn()
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce([]);

            // Act
            await getPaymentTransactions(req, res);

            // Assert
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                total: 0,
                page: 1,
                pages: 0,
                data: [],
            });
        });

        // Test Case 2.15: Abnormal - Database error
        it('TC2.15 - Abnormal: Should handle database error', async () => {
            // Arrange
            const error = new Error('Database error');
            PaymentTransaction.aggregate = jest.fn().mockRejectedValue(error);

            // Act
            await getPaymentTransactions(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Lỗi lấy danh sách giao dịch',
                error: error.message,
            });
        });
    });

    // ========================================
    // 3. getPaymentTransactionFilters
    // ========================================
    describe('getPaymentTransactionFilters', () => {
        // Test Case 3.1: Normal - Get all filter values successfully
        it('TC3.1 - Normal: Should get all filter values', async () => {
            // Arrange
            const mockPackageIds = [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()];
            const mockTransactions = [
                { package_id: { _id: mockPackageIds[0], name: 'Basic' } },
                { package_id: { _id: mockPackageIds[1], name: 'Premium' } },
            ];

            PaymentTransaction.distinct = jest.fn()
                .mockResolvedValueOnce(mockPackageIds) // packages
                .mockResolvedValueOnce(['manual banking', 'stripe']) // methods
                .mockResolvedValueOnce(['pending', 'success', 'canceled']); // statuses

            PaymentTransaction.findOne = jest.fn()
                .mockResolvedValueOnce({ populate: jest.fn().mockReturnThis(), ...mockTransactions[0] })
                .mockResolvedValueOnce({ populate: jest.fn().mockReturnThis(), ...mockTransactions[1] });

            // Mock populate chain
            const mockPopulate = jest.fn().mockImplementation(function () {
                return this;
            });

            PaymentTransaction.findOne = jest.fn()
                .mockResolvedValueOnce({ package_id: { _id: mockPackageIds[0], name: 'Basic' }, populate: mockPopulate })
                .mockResolvedValueOnce({ package_id: { _id: mockPackageIds[1], name: 'Premium' }, populate: mockPopulate });

            // Act
            await getPaymentTransactionFilters(req, res);

            // Assert
            expect(PaymentTransaction.distinct).toHaveBeenCalledTimes(3);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: expect.objectContaining({
                    packages: expect.any(Array),
                    methods: expect.arrayContaining(['manual banking', 'stripe']),
                    statuses: expect.arrayContaining(['canceled', 'pending', 'success']),
                }),
            });
        });

        // Test Case 3.2: Boundary - Empty filter values
        it('TC3.2 - Boundary: Should handle empty filter values', async () => {
            // Arrange
            PaymentTransaction.distinct = jest.fn()
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce([]);

            // Act
            await getPaymentTransactionFilters(req, res);

            // Assert
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    packages: [],
                    methods: [],
                    statuses: [],
                },
            });
        });

        // Test Case 3.3: Boundary - Null values in filters
        it('TC3.3 - Boundary: Should filter out null values', async () => {
            // Arrange
            PaymentTransaction.distinct = jest.fn()
                .mockResolvedValueOnce([null])
                .mockResolvedValueOnce(['manual banking', null])
                .mockResolvedValueOnce(['success', null]);

            // Act
            await getPaymentTransactionFilters(req, res);

            // Assert
            const response = res.json.mock.calls[0][0];
            expect(response.data.methods).toEqual(['manual banking']);
            expect(response.data.statuses).toEqual(['success']);
        });

        // Test Case 3.4: Abnormal - Database error
        it('TC3.4 - Abnormal: Should handle database error', async () => {
            // Arrange
            const error = new Error('Database error');
            PaymentTransaction.distinct = jest.fn().mockRejectedValue(error);

            // Act
            await getPaymentTransactionFilters(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Lỗi lấy filter values',
                error: error.message,
            });
        });
    });

    // ========================================
    // 4. getPaymentTransactionById
    // ========================================
    describe('getPaymentTransactionById', () => {
        // Test Case 4.1: Normal - Get transaction by valid ID
        it('TC4.1 - Normal: Should get transaction by ID successfully', async () => {
            // Arrange
            const transactionId = new mongoose.Types.ObjectId();
            req.params.id = transactionId.toString();

            const mockTransaction = {
                _id: transactionId,
                amount: 1000000,
                status: 'success',
            };

            const mockPopulate = jest.fn().mockReturnThis();
            PaymentTransaction.findById = jest.fn().mockReturnValue({
                populate: mockPopulate.mockReturnValue({
                    populate: mockPopulate.mockReturnValue({
                        populate: mockPopulate.mockResolvedValue(mockTransaction),
                    }),
                }),
            });

            // Act
            await getPaymentTransactionById(req, res);

            // Assert
            expect(PaymentTransaction.findById).toHaveBeenCalledWith(transactionId.toString());
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockTransaction,
            });
        });

        // Test Case 4.2: Abnormal - Transaction not found
        it('TC4.2 - Abnormal: Should return 404 when transaction not found', async () => {
            // Arrange
            req.params.id = new mongoose.Types.ObjectId().toString();

            const mockPopulate = jest.fn().mockReturnThis();
            PaymentTransaction.findById = jest.fn().mockReturnValue({
                populate: mockPopulate.mockReturnValue({
                    populate: mockPopulate.mockReturnValue({
                        populate: mockPopulate.mockResolvedValue(null),
                    }),
                }),
            });

            // Act
            await getPaymentTransactionById(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Không tìm thấy giao dịch',
            });
        });

        // Test Case 4.3: Abnormal - Database error
        it('TC4.3 - Abnormal: Should handle database error', async () => {
            // Arrange
            req.params.id = new mongoose.Types.ObjectId().toString();
            const error = new Error('Database error');

            PaymentTransaction.findById = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        populate: jest.fn().mockRejectedValue(error),
                    }),
                }),
            });

            // Act
            await getPaymentTransactionById(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Lỗi lấy chi tiết giao dịch',
                error: error.message,
            });
        });

        // Test Case 4.4: Boundary - Invalid ObjectId format
        it('TC4.4 - Boundary: Should handle invalid ObjectId', async () => {
            // Arrange
            req.params.id = 'invalid-id';
            const error = new Error('Cast to ObjectId failed');

            PaymentTransaction.findById = jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        populate: jest.fn().mockRejectedValue(error),
                    }),
                }),
            });

            // Act
            await getPaymentTransactionById(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    // ========================================
    // 5. updatePaymentTransaction
    // ========================================
    describe('updatePaymentTransaction', () => {
        // Test Case 5.1: Normal - Update transaction basic fields
        it('TC5.1 - Normal: Should update transaction successfully', async () => {
            // Arrange
            const transactionId = new mongoose.Types.ObjectId();
            req.params.id = transactionId.toString();
            req.body = { status: 'pending' };

            const mockCurrentTransaction = {
                _id: transactionId,
                user_id: new mongoose.Types.ObjectId(),
                package_id: new mongoose.Types.ObjectId(),
                status: 'created',
            };

            const mockUpdatedTransaction = {
                ...mockCurrentTransaction,
                status: 'pending',
            };

            PaymentTransaction.findById = jest.fn().mockResolvedValue(mockCurrentTransaction);
            PaymentTransaction.findByIdAndUpdate = jest.fn().mockResolvedValue(mockUpdatedTransaction);

            // Act
            await updatePaymentTransaction(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Cập nhật giao dịch thành công',
                data: mockUpdatedTransaction,
            });
        });

        // Test Case 5.2: Normal - Merge metadata
        it('TC5.2 - Normal: Should merge metadata correctly', async () => {
            // Arrange
            const transactionId = new mongoose.Types.ObjectId();
            req.params.id = transactionId.toString();
            req.body = {
                metadata: { newField: 'value' },
            };

            const mockCurrentTransaction = {
                _id: transactionId,
                user_id: new mongoose.Types.ObjectId(),
                package_id: new mongoose.Types.ObjectId(),
                metadata: { existingField: 'oldValue' },
            };

            PaymentTransaction.findById = jest.fn().mockResolvedValue(mockCurrentTransaction);
            PaymentTransaction.findByIdAndUpdate = jest.fn().mockResolvedValue({});

            // Act
            await updatePaymentTransaction(req, res);

            // Assert
            expect(PaymentTransaction.findByIdAndUpdate).toHaveBeenCalledWith(
                transactionId.toString(),
                expect.objectContaining({
                    metadata: {
                        existingField: 'oldValue',
                        newField: 'value',
                    },
                }),
                { new: true, runValidators: true }
            );
        });

        // Test Case 5.3: Normal - Approve transaction (status = success)
        it('TC5.3 - Normal: Should approve transaction and activate user package', async () => {
            // Arrange
            const transactionId = new mongoose.Types.ObjectId();
            const userId = new mongoose.Types.ObjectId();
            const packageId = new mongoose.Types.ObjectId();

            req.params.id = transactionId.toString();
            req.body = { status: 'success' };

            const mockCurrentTransaction = {
                _id: transactionId,
                user_id: userId,
                package_id: packageId,
                metadata: { duration: '12months' },
            };

            const mockUserPackage = {
                _id: new mongoose.Types.ObjectId(),
                user_id: userId,
                package_id: packageId,
                status: 'pending',
            };

            const mockUser = {
                _id: userId,
                email: 'test@example.com',
                full_name: 'Test User',
            };

            const mockPackage = {
                _id: packageId,
                name: 'Premium',
                price: 1000000,
                planType: 'monthly',
                pages: 10,
                employees: 5,
                shops: 3,
                features: ['feature1', 'feature2'],
            };

            PaymentTransaction.findById = jest.fn().mockResolvedValue(mockCurrentTransaction);
            PaymentTransaction.findByIdAndUpdate = jest.fn().mockResolvedValue({ ...mockCurrentTransaction, status: 'success' });

            UserPackage.findOne = jest.fn().mockReturnValue({
                sort: jest.fn().mockResolvedValue(mockUserPackage),
            });
            UserPackage.findByIdAndUpdate = jest.fn().mockResolvedValue({ ...mockUserPackage, status: 'active' });
            UserPackage.find = jest.fn().mockResolvedValue([]);
            UserPackage.updateMany = jest.fn().mockResolvedValue({});

            User.findById = jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUser),
            });

            Package.findById = jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue(mockPackage),
            });

            sendPackageApprovalEmail.mockResolvedValue({});
            createInvoice.mockResolvedValue({ invoice_number: 'INV-001' });

            // Act
            await updatePaymentTransaction(req, res);

            // Assert
            expect(UserPackage.findByIdAndUpdate).toHaveBeenCalledWith(
                mockUserPackage._id,
                expect.objectContaining({
                    status: 'active',
                }),
                { new: true }
            );
            expect(sendPackageApprovalEmail).toHaveBeenCalled();
            expect(createInvoice).toHaveBeenCalledWith(transactionId.toString());
            expect(res.status).toHaveBeenCalledWith(200);
        });

        // Test Case 5.4: Normal - Reject transaction (status = rejected)
        it('TC5.4 - Normal: Should reject transaction and cancel user package', async () => {
            // Arrange
            const transactionId = new mongoose.Types.ObjectId();
            const userId = new mongoose.Types.ObjectId();
            const packageId = new mongoose.Types.ObjectId();

            req.params.id = transactionId.toString();
            req.body = { status: 'rejected' };

            const mockCurrentTransaction = {
                _id: transactionId,
                user_id: userId,
                package_id: packageId,
            };

            const mockUserPackage = {
                _id: new mongoose.Types.ObjectId(),
                user_id: userId,
                package_id: packageId,
                status: 'pending',
            };

            PaymentTransaction.findById = jest.fn().mockResolvedValue(mockCurrentTransaction);
            PaymentTransaction.findByIdAndUpdate = jest.fn().mockResolvedValue({ ...mockCurrentTransaction, status: 'rejected' });

            UserPackage.findOne = jest.fn().mockReturnValue({
                sort: jest.fn().mockResolvedValue(mockUserPackage),
            });
            UserPackage.findByIdAndUpdate = jest.fn().mockResolvedValue({ ...mockUserPackage, status: 'cancelled' });

            // Act
            await updatePaymentTransaction(req, res);

            // Assert
            expect(UserPackage.findByIdAndUpdate).toHaveBeenCalledWith(
                mockUserPackage._id,
                expect.objectContaining({
                    status: 'cancelled',
                }),
                { new: true }
            );
            expect(res.status).toHaveBeenCalledWith(200);
        });

        // Test Case 5.5: Normal - Cancel transaction (status = canceled)
        it('TC5.5 - Normal: Should cancel transaction and user package', async () => {
            // Arrange
            const transactionId = new mongoose.Types.ObjectId();
            const userId = new mongoose.Types.ObjectId();
            const packageId = new mongoose.Types.ObjectId();

            req.params.id = transactionId.toString();
            req.body = { status: 'canceled' };

            const mockCurrentTransaction = {
                _id: transactionId,
                user_id: userId,
                package_id: packageId,
            };

            const mockUserPackage = {
                _id: new mongoose.Types.ObjectId(),
                status: 'pending',
            };

            PaymentTransaction.findById = jest.fn().mockResolvedValue(mockCurrentTransaction);
            PaymentTransaction.findByIdAndUpdate = jest.fn().mockResolvedValue({ ...mockCurrentTransaction, status: 'canceled' });

            UserPackage.findOne = jest.fn().mockReturnValue({
                sort: jest.fn().mockResolvedValue(mockUserPackage),
            });
            UserPackage.findByIdAndUpdate = jest.fn().mockResolvedValue({ ...mockUserPackage, status: 'cancelled' });

            // Act
            await updatePaymentTransaction(req, res);

            // Assert
            expect(UserPackage.findByIdAndUpdate).toHaveBeenCalledWith(
                mockUserPackage._id,
                expect.objectContaining({
                    status: 'cancelled',
                }),
                { new: true }
            );
        });

        // Test Case 5.6: Boundary - UserPackage not found
        it('TC5.6 - Boundary: Should handle missing UserPackage gracefully', async () => {
            // Arrange
            const transactionId = new mongoose.Types.ObjectId();
            req.params.id = transactionId.toString();
            req.body = { status: 'success' };

            const mockCurrentTransaction = {
                _id: transactionId,
                user_id: new mongoose.Types.ObjectId(),
                package_id: new mongoose.Types.ObjectId(),
            };

            PaymentTransaction.findById = jest.fn().mockResolvedValue(mockCurrentTransaction);
            PaymentTransaction.findByIdAndUpdate = jest.fn().mockResolvedValue({ ...mockCurrentTransaction, status: 'success' });

            UserPackage.findOne = jest.fn().mockReturnValue({
                sort: jest.fn().mockResolvedValue(null),
            });

            // Act
            await updatePaymentTransaction(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Cập nhật giao dịch thành công',
                data: expect.any(Object),
            });
        });

        // Test Case 5.7: Boundary - Email sending fails
        it('TC5.7 - Boundary: Should continue when email fails', async () => {
            // Arrange
            const transactionId = new mongoose.Types.ObjectId();
            const userId = new mongoose.Types.ObjectId();
            const packageId = new mongoose.Types.ObjectId();

            req.params.id = transactionId.toString();
            req.body = { status: 'success' };

            const mockCurrentTransaction = {
                _id: transactionId,
                user_id: userId,
                package_id: packageId,
                metadata: { duration: '12months' },
            };

            const mockUserPackage = {
                _id: new mongoose.Types.ObjectId(),
                user_id: userId,
                package_id: packageId,
                status: 'pending',
            };

            PaymentTransaction.findById = jest.fn().mockResolvedValue(mockCurrentTransaction);
            PaymentTransaction.findByIdAndUpdate = jest.fn().mockResolvedValue({ ...mockCurrentTransaction, status: 'success' });

            UserPackage.findOne = jest.fn().mockReturnValue({
                sort: jest.fn().mockResolvedValue(mockUserPackage),
            });
            UserPackage.findByIdAndUpdate = jest.fn().mockResolvedValue({ ...mockUserPackage, status: 'active' });
            UserPackage.find = jest.fn().mockResolvedValue([]);

            User.findById = jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue({ email: 'test@example.com', full_name: 'Test' }),
            });

            Package.findById = jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue({ name: 'Premium', price: 1000000 }),
            });

            sendPackageApprovalEmail.mockRejectedValue(new Error('Email service down'));
            createInvoice.mockResolvedValue({ invoice_number: 'INV-001' });

            // Act
            await updatePaymentTransaction(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(200);
        });

        // Test Case 5.8: Boundary - Invoice creation fails
        it('TC5.8 - Boundary: Should continue when invoice creation fails', async () => {
            // Arrange
            const transactionId = new mongoose.Types.ObjectId();
            const userId = new mongoose.Types.ObjectId();
            const packageId = new mongoose.Types.ObjectId();

            req.params.id = transactionId.toString();
            req.body = { status: 'success' };

            const mockCurrentTransaction = {
                _id: transactionId,
                user_id: userId,
                package_id: packageId,
                metadata: { duration: '12months' },
            };

            const mockUserPackage = {
                _id: new mongoose.Types.ObjectId(),
                user_id: userId,
                package_id: packageId,
                status: 'pending',
            };

            PaymentTransaction.findById = jest.fn().mockResolvedValue(mockCurrentTransaction);
            PaymentTransaction.findByIdAndUpdate = jest.fn().mockResolvedValue({ ...mockCurrentTransaction, status: 'success' });

            UserPackage.findOne = jest.fn().mockReturnValue({
                sort: jest.fn().mockResolvedValue(mockUserPackage),
            });
            UserPackage.findByIdAndUpdate = jest.fn().mockResolvedValue({ ...mockUserPackage, status: 'active' });
            UserPackage.find = jest.fn().mockResolvedValue([]);

            User.findById = jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue({ email: 'test@example.com', full_name: 'Test' }),
            });

            Package.findById = jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue({ name: 'Premium', price: 1000000 }),
            });

            sendPackageApprovalEmail.mockResolvedValue({});
            createInvoice.mockRejectedValue(new Error('Invoice service error'));

            // Act
            await updatePaymentTransaction(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(200);
        });

        // Test Case 5.9: Abnormal - Transaction not found
        it('TC5.9 - Abnormal: Should return 404 when transaction not found', async () => {
            // Arrange
            req.params.id = new mongoose.Types.ObjectId().toString();
            req.body = { status: 'success' };

            PaymentTransaction.findById = jest.fn().mockResolvedValue(null);

            // Act
            await updatePaymentTransaction(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Không tìm thấy giao dịch',
            });
        });

        // Test Case 5.10: Abnormal - Update operation fails
        it('TC5.10 - Abnormal: Should return 404 when update fails', async () => {
            // Arrange
            const transactionId = new mongoose.Types.ObjectId();
            req.params.id = transactionId.toString();
            req.body = { status: 'pending' };

            PaymentTransaction.findById = jest.fn().mockResolvedValue({ _id: transactionId });
            PaymentTransaction.findByIdAndUpdate = jest.fn().mockResolvedValue(null);

            // Act
            await updatePaymentTransaction(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Không tìm thấy giao dịch',
            });
        });

        // Test Case 5.11: Abnormal - Database error
        it('TC5.11 - Abnormal: Should handle database error', async () => {
            // Arrange
            req.params.id = new mongoose.Types.ObjectId().toString();
            req.body = { status: 'success' };
            const error = new Error('Database error');

            PaymentTransaction.findById = jest.fn().mockRejectedValue(error);

            // Act
            await updatePaymentTransaction(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Lỗi cập nhật giao dịch',
                error: error.message,
            });
        });

        // Test Case 5.12: Normal - Disable old active packages when approving
        it('TC5.12 - Normal: Should disable old active packages', async () => {
            // Arrange
            const transactionId = new mongoose.Types.ObjectId();
            const userId = new mongoose.Types.ObjectId();
            const packageId = new mongoose.Types.ObjectId();

            req.params.id = transactionId.toString();
            req.body = { status: 'success' };

            const mockCurrentTransaction = {
                _id: transactionId,
                user_id: userId,
                package_id: packageId,
                metadata: { duration: '12months' },
            };

            const mockUserPackage = {
                _id: new mongoose.Types.ObjectId(),
                user_id: userId,
                package_id: packageId,
                status: 'pending',
            };

            const mockOldPackages = [
                { _id: new mongoose.Types.ObjectId(), status: 'active' },
                { _id: new mongoose.Types.ObjectId(), status: 'expiring soon' },
            ];

            PaymentTransaction.findById = jest.fn().mockResolvedValue(mockCurrentTransaction);
            PaymentTransaction.findByIdAndUpdate = jest.fn().mockResolvedValue({ ...mockCurrentTransaction, status: 'success' });

            UserPackage.findOne = jest.fn().mockReturnValue({
                sort: jest.fn().mockResolvedValue(mockUserPackage),
            });
            UserPackage.findByIdAndUpdate = jest.fn().mockResolvedValue({ ...mockUserPackage, status: 'active' });
            UserPackage.find = jest.fn().mockResolvedValue(mockOldPackages);
            UserPackage.updateMany = jest.fn().mockResolvedValue({ modifiedCount: 2 });

            User.findById = jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue({ email: 'test@example.com', full_name: 'Test' }),
            });

            Package.findById = jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue({ name: 'Premium', price: 1000000 }),
            });

            sendPackageApprovalEmail.mockResolvedValue({});
            createInvoice.mockResolvedValue({ invoice_number: 'INV-001' });

            // Act
            await updatePaymentTransaction(req, res);

            // Assert
            expect(UserPackage.updateMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    user_id: userId,
                    _id: { $ne: mockUserPackage._id },
                }),
                expect.objectContaining({
                    $set: expect.objectContaining({
                        status: 'canceled',
                    }),
                })
            );
        });
    });

    // ========================================
    // 6. setPaymentMethod
    // ========================================
    describe('setPaymentMethod', () => {
        // Test Case 6.1: Normal - Set manual banking method
        it('TC6.1 - Normal: Should set manual banking method with expiry', async () => {
            // Arrange
            const transactionId = new mongoose.Types.ObjectId();
            req.params.id = transactionId.toString();
            req.body = { method: 'manual banking' };

            const mockUpdated = {
                _id: transactionId,
                method: 'manual banking',
                expired_date: expect.any(Date),
            };

            PaymentTransaction.findByIdAndUpdate = jest.fn().mockResolvedValue(mockUpdated);

            // Act
            await setPaymentMethod(req, res);

            // Assert
            expect(PaymentTransaction.findByIdAndUpdate).toHaveBeenCalledWith(
                expect.any(mongoose.Types.ObjectId),
                expect.objectContaining({
                    method: 'manual banking',
                    expired_date: expect.any(Date),
                }),
                { new: true }
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Cập nhật phương thức thanh toán thành công',
                data: mockUpdated,
            });
        });

        // Test Case 6.2: Normal - Set other payment method (no expiry)
        it('TC6.2 - Normal: Should set stripe method without expiry', async () => {
            // Arrange
            const transactionId = new mongoose.Types.ObjectId();
            req.params.id = transactionId.toString();
            req.body = { method: 'stripe' };

            const mockUpdated = {
                _id: transactionId,
                method: 'stripe',
            };

            PaymentTransaction.findByIdAndUpdate = jest.fn().mockResolvedValue(mockUpdated);

            // Act
            await setPaymentMethod(req, res);

            // Assert
            expect(PaymentTransaction.findByIdAndUpdate).toHaveBeenCalledWith(
                expect.any(mongoose.Types.ObjectId),
                expect.objectContaining({
                    method: 'stripe',
                }),
                { new: true }
            );
            expect(res.status).toHaveBeenCalledWith(200);
        });

        // Test Case 6.3: Abnormal - Transaction not found
        it('TC6.3 - Abnormal: Should return 404 when transaction not found', async () => {
            // Arrange
            req.params.id = new mongoose.Types.ObjectId().toString();
            req.body = { method: 'stripe' };

            PaymentTransaction.findByIdAndUpdate = jest.fn().mockResolvedValue(null);

            // Act
            await setPaymentMethod(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Không tìm thấy giao dịch',
            });
        });

        // Test Case 6.4: Abnormal - Database error
        it('TC6.4 - Abnormal: Should handle database error', async () => {
            // Arrange
            req.params.id = new mongoose.Types.ObjectId().toString();
            req.body = { method: 'stripe' };
            const error = new Error('Database error');

            PaymentTransaction.findByIdAndUpdate = jest.fn().mockRejectedValue(error);

            // Act
            await setPaymentMethod(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Lỗi cập nhật method thanh toán',
                error: error.message,
            });
        });

        // Test Case 6.5: Boundary - Expired date calculation
        it('TC6.5 - Boundary: Should set expired_date 10 minutes from now', async () => {
            // Arrange
            const transactionId = new mongoose.Types.ObjectId();
            req.params.id = transactionId.toString();
            req.body = { method: 'manual banking' };

            const beforeTime = new Date();
            beforeTime.setMinutes(beforeTime.getMinutes() + 9); // 9 minutes

            PaymentTransaction.findByIdAndUpdate = jest.fn().mockResolvedValue({});

            // Act
            await setPaymentMethod(req, res);

            // Assert
            const updateCall = PaymentTransaction.findByIdAndUpdate.mock.calls[0][1];
            const expiredDate = updateCall.expired_date;

            const afterTime = new Date();
            afterTime.setMinutes(afterTime.getMinutes() + 11); // 11 minutes

            expect(expiredDate).toBeInstanceOf(Date);
            expect(expiredDate.getTime()).toBeGreaterThan(beforeTime.getTime());
            expect(expiredDate.getTime()).toBeLessThan(afterTime.getTime());
        });
    });

    // ========================================
    // 7. confirmBankTransfer
    // ========================================
    describe('confirmBankTransfer', () => {
        // Test Case 7.1: Normal - Confirm bank transfer successfully
        it('TC7.1 - Normal: Should confirm bank transfer', async () => {
            // Arrange
            const transactionId = new mongoose.Types.ObjectId();
            req.params.id = transactionId.toString();

            const mockUpdated = {
                _id: transactionId,
                status: 'pending',
                payment_at: expect.any(Date),
            };

            PaymentTransaction.findByIdAndUpdate = jest.fn().mockResolvedValue(mockUpdated);

            // Act
            await confirmBankTransfer(req, res);

            // Assert
            expect(PaymentTransaction.findByIdAndUpdate).toHaveBeenCalledWith(
                transactionId.toString(),
                expect.objectContaining({
                    status: 'pending',
                    payment_at: expect.any(Date),
                    updated_by: req.user._id,
                }),
                { new: true }
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Xác nhận chuyển khoản thành công',
                data: mockUpdated,
            });
        });

        // Test Case 7.2: Abnormal - Transaction not found
        it('TC7.2 - Abnormal: Should return 404 when transaction not found', async () => {
            // Arrange
            req.params.id = new mongoose.Types.ObjectId().toString();

            PaymentTransaction.findByIdAndUpdate = jest.fn().mockResolvedValue(null);

            // Act
            await confirmBankTransfer(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Không tìm thấy giao dịch',
            });
        });

        // Test Case 7.3: Abnormal - Database error
        it('TC7.3 - Abnormal: Should handle database error', async () => {
            // Arrange
            req.params.id = new mongoose.Types.ObjectId().toString();
            const error = new Error('Database error');

            PaymentTransaction.findByIdAndUpdate = jest.fn().mockRejectedValue(error);

            // Act
            await confirmBankTransfer(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Lỗi xác nhận chuyển khoản',
                error: error.message,
            });
        });

        // Test Case 7.4: Boundary - Payment timestamp accuracy
        it('TC7.4 - Boundary: Should set payment_at to current time', async () => {
            // Arrange
            const transactionId = new mongoose.Types.ObjectId();
            req.params.id = transactionId.toString();

            const beforeTime = new Date();
            PaymentTransaction.findByIdAndUpdate = jest.fn().mockResolvedValue({});

            // Act
            await confirmBankTransfer(req, res);

            // Assert
            const updateCall = PaymentTransaction.findByIdAndUpdate.mock.calls[0][1];
            const paymentAt = updateCall.payment_at;
            const afterTime = new Date();

            expect(paymentAt).toBeInstanceOf(Date);
            expect(paymentAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
            expect(paymentAt.getTime()).toBeLessThanOrEqual(afterTime.getTime());
        });
    });

    // ========================================
    // 8. deletePaymentTransaction
    // ========================================
    describe('deletePaymentTransaction', () => {
        // Test Case 8.1: Normal - Soft delete transaction successfully
        it('TC8.1 - Normal: Should soft delete transaction', async () => {
            // Arrange
            const transactionId = new mongoose.Types.ObjectId();
            req.params.id = transactionId.toString();

            const mockDeleted = {
                _id: transactionId,
                deleted_at: expect.any(Date),
            };

            PaymentTransaction.findByIdAndUpdate = jest.fn().mockResolvedValue(mockDeleted);

            // Act
            await deletePaymentTransaction(req, res);

            // Assert
            expect(PaymentTransaction.findByIdAndUpdate).toHaveBeenCalledWith(
                transactionId.toString(),
                expect.objectContaining({
                    deleted_at: expect.any(Date),
                    updated_by: req.user._id,
                }),
                { new: true }
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Xóa giao dịch thành công',
            });
        });

        // Test Case 8.2: Boundary - Delete without user context
        it('TC8.2 - Boundary: Should handle missing user context', async () => {
            // Arrange
            const transactionId = new mongoose.Types.ObjectId();
            req.params.id = transactionId.toString();
            req.user = undefined;

            const mockDeleted = {
                _id: transactionId,
                deleted_at: expect.any(Date),
            };

            PaymentTransaction.findByIdAndUpdate = jest.fn().mockResolvedValue(mockDeleted);

            // Act
            await deletePaymentTransaction(req, res);

            // Assert
            expect(PaymentTransaction.findByIdAndUpdate).toHaveBeenCalledWith(
                transactionId.toString(),
                expect.objectContaining({
                    deleted_at: expect.any(Date),
                    updated_by: null,
                }),
                { new: true }
            );
            expect(res.status).toHaveBeenCalledWith(200);
        });

        // Test Case 8.3: Abnormal - Transaction not found
        it('TC8.3 - Abnormal: Should return 404 when transaction not found', async () => {
            // Arrange
            req.params.id = new mongoose.Types.ObjectId().toString();

            PaymentTransaction.findByIdAndUpdate = jest.fn().mockResolvedValue(null);

            // Act
            await deletePaymentTransaction(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Không tìm thấy giao dịch',
            });
        });

        // Test Case 8.4: Abnormal - Database error
        it('TC8.4 - Abnormal: Should handle database error', async () => {
            // Arrange
            req.params.id = new mongoose.Types.ObjectId().toString();
            const error = new Error('Database error');

            PaymentTransaction.findByIdAndUpdate = jest.fn().mockRejectedValue(error);

            // Act
            await deletePaymentTransaction(req, res);

            // Assert
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Lỗi xóa giao dịch',
                error: error.message,
            });
        });

        // Test Case 8.5: Boundary - Deletion timestamp accuracy
        it('TC8.5 - Boundary: Should set deleted_at to current time', async () => {
            // Arrange
            const transactionId = new mongoose.Types.ObjectId();
            req.params.id = transactionId.toString();

            const beforeTime = new Date();
            PaymentTransaction.findByIdAndUpdate = jest.fn().mockResolvedValue({});

            // Act
            await deletePaymentTransaction(req, res);

            // Assert
            const updateCall = PaymentTransaction.findByIdAndUpdate.mock.calls[0][1];
            const deletedAt = updateCall.deleted_at;
            const afterTime = new Date();

            expect(deletedAt).toBeInstanceOf(Date);
            expect(deletedAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
            expect(deletedAt.getTime()).toBeLessThanOrEqual(afterTime.getTime());
        });
    });
});
