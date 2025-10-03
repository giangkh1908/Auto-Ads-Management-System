import Role from "../models/Role.js";

// Lấy tất cả role
export const getRoles = async (req, res) => {
    try {
      const roles = await Role.find();
      res.json(roles);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

// Lấy role theo ID
export const getRoleById = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) 
      return res.status(404).json({message: "Không tìm thấy role"});
    res.json(role);
  } catch (error) {
    res.status(500).json({error: error.message});
  }
};

// Tạo role
export const createRole = async (req, res) => {
    try {
        const {role_name, description } = req.body;
        const role = new Role ({role_name, description});
        await role.save();
        res.status(201).json({message: "Tạo vai trò thành công!"});
    }catch(error){
        res.status(500).json({ message:"Lỗi hệ thống, vui lòng thử lại sau"});
        console.error("Lỗi không tạo được vai trò:", error);
    }
}

// Update role
export const updateRole = async (req, res) => {
  try {
    const role = await Role.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!role) return res.status(404).json({ message: "Role not found" });
    res.json(role);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Xóa role
export const deleteRole = async (req, res) => {
  try {
    const role = await Role.findByIdAndDelete(req.params.id);
    if (!role) return res.status(404).json({ message: "Role not found" });
    res.json({ message: "Role deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};