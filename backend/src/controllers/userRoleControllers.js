import UserRole from "../models/UserRole.js";
import Role from "../models/Role.js";

//Gán role cho user
export const assignRole = async (req, res) => {
    try {
        const {userId, roleName, shopId, assignedBy} = req.body;
        
        //Tìm role theo tên role
        const role = await Role.findOne({role_name: roleName});
        if (!role) 
            return res.status(404).json({message: "Không tìm thấy role của người dùng"});
        const userRole = new UserRole (
            {
                user_id: userId,
                role_id: role._id,
                shop_id: shopId || null,
                assigned_by: assignedBy
            }
        );
        
        await userRole.save();
        res.status(201).json(userRole);
    }catch (error) {
        res.status(400).json({error: error.message});
        console.error("Không tim thấy role của người dùng", error);
    }
}

// Lấy tất cả userRole
export const getUserRoles = async (req, res) => {
    try {
        const data = await UserRole.find()
        .populate("user_id", "name email")
        .populate("role_id", "role_name description");
        res.json(data);
    }catch (error){
        res.status(500).json({error: error.message});
        console.error("Không thể lấy danh sách UserRole", error);
    }
}

//Lấy userRole theo Id
export const getUserRoleById = async (req, res) => {
    try {
        const userRole = await UserRole.findById(req.params.id)
        .populate("user_id", "name email")
        .populate("role_id", "role_name");
    if (!userRole) 
        return res.status(404).json({message: "Không tìm thấy UserRole"});
    res.json(userRole);
    }catch(error){
        res.status(500).json({error: error.message});
        console.error("Không thể lấy danh sách UserRole", error);
    }
}

// Cập nhật userRole
export const updateUserRole = async (req, res) => {
  try {
    const userRole = await UserRole.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate("user_id", "name email")
      .populate("role_id", "role_name");
    if (!userRole) return res.status(404).json({ message: "UserRole not found" });
    res.json(userRole);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Xóa userRole
export const deleteUserRole = async (req, res) => {
  try {
    const userRole = await UserRole.findByIdAndDelete(req.params.id);
    if (!userRole) return res.status(404).json({ message: "UserRole not found" });
    res.json({ message: "UserRole deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};