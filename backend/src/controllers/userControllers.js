import User from "../models/User.js";

// Lấy danh sách người dùng
export const getUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message:"Lỗi hệ thống, vui lòng thử lại sau"});
        console.error("Lỗi không lấy được dữ liệu người dùng:", error);
    }
}

// Tạo người dùng
export const createUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const user = await User.create({ name, email, password });
        res.status(201).json({message: "Tạo người dùng thành công!"});
    } catch (error) {
        res.status(500).json({ message:"Lỗi hệ thống, vui lòng thử lại sau"});
        console.error("Lỗi không tạo được người dùng:", error);
    }
}

export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, password } = req.body;
        const user = await User.findByIdAndUpdate(id, { name, email, password }, { new: true });
        res.status(200).json({message: "Cập nhật thành công!"});
    } catch (error) {
        res.status(500).json({ message:"Lỗi hệ thống, vui lòng thử lại sau"});
        console.error("Lỗi không cập nhật được người dùng:", error);
    }
}

export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        await User.findByIdAndDelete(id);
        res.status(200).json({ message:"Người dùng đã được xóa"});
    } catch (error) {
        res.status(500).json({ message:"Lỗi hệ thống, vui lòng thử lại sau"});
        console.error("Lỗi không xóa được người dùng:", error);
    }
}

