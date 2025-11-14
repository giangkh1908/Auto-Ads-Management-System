import { useState, useEffect } from "react";
import "./CustomerPage.css";
import axiosInstance from "../../../../../utils/axios";
import { API_ENDPOINTS } from "../../../../../config/api.config";

export default function ViewDetails({ isOpen, onClose, userId }) {
  const [shopData, setShopData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserShops = async () => {
      if (!isOpen || !userId) {
        // Reset data khi đóng modal
        setShopData([]);
        setError(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await axiosInstance.get(API_ENDPOINTS.USERS.SHOPS(userId));
        
        if (response.data.success) {
          setShopData(response.data.data || []);
        } else {
          setError("Không thể tải dữ liệu shop");
        }
      } catch (err) {
        console.error("Error fetching user shops:", err);
        setError(err.response?.data?.message || "Có lỗi xảy ra khi tải dữ liệu shop");
      } finally {
        setLoading(false);
      }
    };

    fetchUserShops();
  }, [isOpen, userId]);

  if (!isOpen) return null;

  return (
    <div className="amu-shop-details-overlay" onClick={onClose}>
      <div className="amu-shop-details-modal" onClick={(e) => e.stopPropagation()}>
        <div className="amu-shop-details-header">
          <h3 className="amu-shop-details-title">Shop Details</h3>
        </div>
        <div className="amu-shop-details-body">
          {loading ? (
            <div style={{ padding: "20px", textAlign: "center" }}>Đang tải dữ liệu...</div>
          ) : error ? (
            <div style={{ padding: "20px", textAlign: "center", color: "red" }}>{error}</div>
          ) : shopData.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center" }}>User chưa thuộc shop nào</div>
          ) : (
            <table className="amu-shop-details-table">
              <thead>
                <tr>
                  <th>Shop</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                {shopData.map((item, index) => (
                  <tr key={index}>
                    <td>{item.shop}</td>
                    <td>{item.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="amu-shop-details-footer">
          <button className="amu-shop-details-close-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

