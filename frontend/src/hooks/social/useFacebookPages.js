import { useState, useEffect } from "react";
import profileService from "../../services/auth/profileService";
import { useToast } from "../common/useToast";

/**
 * Custom hook để quản lý Facebook pages
 * Lấy danh sách pages từ Shop hiện tại của user
 */
export function useFacebookPages() {
  const [facebookPages, setFacebookPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    const loadPages = async () => {
      try {
        setLoading(true);
        // Lấy thông tin user hiện tại và các page đã kết nối
        const me = await profileService.getCurrentProfile();
        const user = me?.data?.user || me?.user;

        // Lấy danh sách pages từ User model
        const pagesSource = Array.isArray(user?.facebook_pages)
          ? user.facebook_pages
          : [];
        
        // Lọc và map pages
        const connectedPages = pagesSource
          .filter((p) => p.connected_status === "connected" && p.page_status !== "pause")
          .map((p) => ({
            id: p.page_id,
            name: p.page_info?.name || "Facebook Page",
            avatar:
              p.page_info?.picture_url ||
              `https://graph.facebook.com/${p.page_id}/picture?type=square`,
          }));
        
        setFacebookPages(connectedPages);
      } catch (e) {
        // silent fail; selection sẽ rỗng
        console.error("Failed to load connected facebook pages from Shop:", e);
        toast.error("Không tải được danh sách Page", {
          description: "Vui lòng kiểm tra kết nối mạng và thử lại",
        });
        setFacebookPages([]);
      } finally {
        setLoading(false);
      }
    };
    loadPages();
  }, [toast]);

  return { facebookPages, loading };
}
