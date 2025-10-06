import Shop from "../models/shop.model.js";

//  Tạo Shop
export const createShop = async (req, res) => {
  try {
    const shop = new Shop(req.body);
    await shop.save();
    res.status(201).json(shop);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

//  Lấy tất cả Shop
export const getShops = async (req, res) => {
  try {
    const shops = await Shop.find()
      .populate("owner_id", "name email")
      .populate("salesman_id", "name email");
    res.json(shops);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//  Lấy Shop theo ID
export const getShopById = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id)
      .populate("owner_id", "name email")
      .populate("salesman_id", "name email");
    if (!shop) return res.status(404).json({ message: "Shop not found" });
    res.json(shop);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//  Update Shop
export const updateShop = async (req, res) => {
  try {
    const shop = await Shop.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!shop) return res.status(404).json({ message: "Shop not found" });
    res.json(shop);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

//  Delete (xóa mềm)
export const deleteShop = async (req, res) => {
  try {
    const shop = await Shop.findByIdAndUpdate(
      req.params.id,
      { deleted_at: new Date() },
      { new: true }
    );
    if (!shop) return res.status(404).json({ message: "Shop not found" });
    res.json({ message: "Shop đã xóa tạm thời", shop });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
