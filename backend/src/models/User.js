import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import validator from "validator";
import crypto from "crypto";
const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            unique: true,
            required: [true, "Email là bắt buộc"],
            lowercase: true,
            validate: [validator.isEmail, "Email không hợp lệ!"]
        },
        password: {
            type: String,
            required: [true, "Mật khẩu là bắt buộc"],
            minlength: [6, "Mật khẩu phải có ít nhất 6 ký tự"],
            select: false //Không trả về password khi query
        },
        name: {
            type: String,
            required: [true, "Tên là bắt buộc"],
            trim: true,
            maxlength: [50, "Tên không được quá 50 ký tự"]
        },
        phone: {
            type: String,
            trim: true,
            validate: {
                validator: function(v) {
                    return !v || validator.isMobilePhone (v, 'vi-VN');
                },
                message: "Số điện thoại không hợp lệ"
            }
        },
        status: {
            type: String,
            enum: ["active", "inactive", "banned", "pending"],
            default: "pending",
        },
        profile: {
            avatar: {type: String},
            address: {type: String}
        },

        //Xác thực Email
        emailVerified: {type: Boolean, default: false},
        emailVerificationToken: {type: String, select: false},
        emailVerificationExpires: {type: Date, select: false},

        // Password reset
        passwordResetToken: {type: String, select: false},
        passwordResetExpires: {type: Date, select: false},

        // Login attempts
        loginAttempts: {type: Number, default: 0},
        lockUntil: {type: Date},

        deleted_at: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: { createdAt: "created_at", updatedAt: "updated_at" }, // createdAt và updatedAt tự động thêm vào
    }
)

// Indexes = 1 để tăng tốc độ truy vấn
userSchema.index({ email: 1 });
userSchema.index({ emailVerificationToken: 1 });
userSchema.index({ passwordResetToken: 1 });

// Kiểm tra account có đang bị locked không?
userSchema.virtual('isLocked').get(function() {
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Tạo hash_password trước khi lưu vào DB
userSchema.pre('save', async function(next) {
    // Chỉ hash password nếu nó được modify
    if (!this.isModified('password')) return next();
    
    try {
        // Hash password với cost 12
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Instance method để so sánh password
userSchema.methods.comparePassword = async function(candidatePassword) {
    if (!this.password) return false;
    return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method để tạo email verification token
userSchema.methods.createEmailVerificationToken = function() {
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    this.emailVerificationToken = crypto
        .createHash('sha256')
        .update(verificationToken)
        .digest('hex');
    
    this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    
    return verificationToken;
};

// Instance method để tạo password reset token
userSchema.methods.createPasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    
    return resetToken;
};

// Hàm trânh brute-force attack khi login 
userSchema.methods.incLoginAttempts = function() {
    // Nếu có lockUntil và đã hết hạn
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({
            $unset: { lockUntil: 1 },
            $set: { loginAttempts: 1 }
        });
    }
    
    const updates = { $inc: { loginAttempts: 1 } };
    
    // Nếu đạt max attempts và chưa bị lock
    if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
        updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // Lock 2 hours
    }
    
    return this.updateOne(updates);
};

// Instance method để reset login attempts
userSchema.methods.resetLoginAttempts = function() {
    return this.updateOne({
        $unset: { loginAttempts: 1, lockUntil: 1 }
    });
};

const User = mongoose.model("User", userSchema);
export default User;