import { useMemo, useState } from "react";
import { Edit, Archive, Trash } from "lucide-react";
import "./AdsManagement.css";
import CreateAdsWizard from "../../components/feature/CreateAdsWizard/CreateAdsWizard";
import { handleSelectAll, handleSelectItem } from "../../utils/selectionUtils";

function AdsManagement() {
  const [activeTab, setActiveTab] = useState("campaigns");
  const [showWizard, setShowWizard] = useState(false);
  const [wizardMode, setWizardMode] = useState("create"); // "create" | "edit"
  const [editingItem, setEditingItem] = useState(null); // { type: "campaign" | "adset" | "ad", id: number }
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [selectedAdset, setSelectedAdset] = useState(null);

  //Setdata tĩnh với cấu trúc liên kết Campaign -> Adset -> Ad
  const makeData = useMemo(() => {
    const campaigns = [
      {
        id: 1,
        name: "Chiến dịch Lượt tương tác #1",
        status: "Hoạt động",
        budget: "100,000,000đ",
        impressions: "1,000,001",
        reach: "1,000",
        enabled: true,
        time: "22:04:05 10/10/2025",
        isChecked: false,
        objective: "ENGAGEMENT",
        budgetType: "CAMPAIGN",
        facebookPage: "Fchat.vn",
        adsetIds: [1, 2, 3]
      },
      {
        id: 2,
        name: "Chiến dịch Lưu lượng truy cập #2",
        status: "Hoạt động",
        budget: "80,000,000đ",
        impressions: "800,000",
        reach: "800",
        enabled: true,
        time: "22:04:05 10/10/2025",
        isChecked: false,
        objective: "TRAFFIC",
        budgetType: "CAMPAIGN",
        facebookPage: "Fchat.vn",
        adsetIds: [4, 5]
      },
      {
        id: 3,
        name: "Chiến dịch Doanh số #3",
        status: "Đang tắt",
        budget: "120,000,000đ",
        impressions: "1,200,000",
        reach: "1,200",
        enabled: false,
        time: "22:04:05 10/10/2025",
        isChecked: false,
        objective: "SALES",
        budgetType: "ADSET",
        facebookPage: "Fchat.vn",
        adsetIds: [6, 7, 8, 9]
      }
    ];

    const adsets = [
      {
        id: 1,
        campaignId: 1,
        name: "Nhóm quảng cáo Tương tác #1",
        status: "Hoạt động",
        budget: "30,000,000đ",
        impressions: "300,000",
        reach: "300",
        enabled: true,
        time: "12:30 22:04:05",
        isChecked: false,
        conversion: "destination",
        performanceGoal: "purchase",
        budgetType: "daily",
        budgetAmount: 30000000,
        startDate: "2025-04-14T12:22",
        endDate: "2025-05-14T12:22",
        targeting: {
          ageMin: 18,
          ageMax: 45,
          gender: "all",
          language: "vi",
          location: "Hoàn kiếm, Hà Nội, Việt Nam",
          interests: ["Business (business & finance)"]
        },
        adIds: [1, 2]
      },
      {
        id: 2,
        campaignId: 1,
        name: "Nhóm quảng cáo Tương tác #2",
        status: "Hoạt động",
        budget: "35,000,000đ",
        impressions: "350,000",
        reach: "350",
        enabled: true,
        time: "12:30 22:04:05",
        isChecked: false,
        conversion: "website",
        performanceGoal: "chat",
        budgetType: "daily",
        budgetAmount: 35000000,
        startDate: "2025-04-14T12:22",
        endDate: "2025-05-14T12:22",
        targeting: {
          ageMin: 25,
          ageMax: 55,
          gender: "female",
          language: "vi",
          location: "Quận 1, TP.HCM, Việt Nam",
          interests: ["Shopping", "Fashion"]
        },
        adIds: [3, 4, 5]
      },
      {
        id: 3,
        campaignId: 1,
        name: "Nhóm quảng cáo Tương tác #3",
        status: "Đang tắt",
        budget: "35,000,000đ",
        impressions: "350,000",
        reach: "350",
        enabled: false,
        time: "12:30 22:04:05",
        isChecked: false,
        conversion: "destination",
        performanceGoal: "potential",
        budgetType: "lifetime",
        budgetAmount: 35000000,
        startDate: "2025-04-14T12:22",
        endDate: "2025-05-14T12:22",
        targeting: {
          ageMin: 20,
          ageMax: 40,
          gender: "all",
          language: "vi",
          location: "Việt Nam",
          interests: ["Technology", "Business"]
        },
        adIds: [6]
      },
      {
        id: 4,
        campaignId: 2,
        name: "Nhóm quảng cáo Lưu lượng #1",
        status: "Hoạt động",
        budget: "40,000,000đ",
        impressions: "400,000",
        reach: "400",
        enabled: true,
        time: "12:30 22:04:05",
        isChecked: false,
        conversion: "website",
        performanceGoal: "purchase",
        budgetType: "daily",
        budgetAmount: 40000000,
        startDate: "2025-04-14T12:22",
        endDate: "2025-05-14T12:22",
        targeting: {
          ageMin: 18,
          ageMax: 50,
          gender: "all",
          language: "vi",
          location: "Việt Nam",
          interests: ["Online shopping", "E-commerce"]
        },
        adIds: [7, 8]
      },
      {
        id: 5,
        campaignId: 2,
        name: "Nhóm quảng cáo Lưu lượng #2",
        status: "Đang tắt",
        budget: "40,000,000đ",
        impressions: "400,000",
        reach: "400",
        enabled: false,
        time: "12:30 22:04:05",
        isChecked: false,
        conversion: "destination",
        performanceGoal: "chat",
        budgetType: "daily",
        budgetAmount: 40000000,
        startDate: "2025-04-14T12:22",
        endDate: "2025-05-14T12:22",
        targeting: {
          ageMin: 22,
          ageMax: 35,
          gender: "male",
          language: "vi",
          location: "Hà Nội, Việt Nam",
          interests: ["Technology", "Gaming"]
        },
        adIds: [9]
      },
      {
        id: 6,
        campaignId: 3,
        name: "Nhóm quảng cáo Doanh số #1",
        status: "Hoạt động",
        budget: "30,000,000đ",
        impressions: "300,000",
        reach: "300",
        enabled: true,
        time: "12:30 22:04:05",
        isChecked: false,
        conversion: "website",
        performanceGoal: "purchase",
        budgetType: "daily",
        budgetAmount: 30000000,
        startDate: "2025-04-14T12:22",
        endDate: "2025-05-14T12:22",
        targeting: {
          ageMin: 25,
          ageMax: 45,
          gender: "all",
          language: "vi",
          location: "TP.HCM, Việt Nam",
          interests: ["Shopping", "Fashion", "Beauty"]
        },
        adIds: [10, 11]
      },
      {
        id: 7,
        campaignId: 3,
        name: "Nhóm quảng cáo Doanh số #2",
        status: "Hoạt động",
        budget: "30,000,000đ",
        impressions: "300,000",
        reach: "300",
        enabled: true,
        time: "12:30 22:04:05",
        isChecked: false,
        conversion: "destination",
        performanceGoal: "purchase",
        budgetType: "daily",
        budgetAmount: 30000000,
        startDate: "2025-04-14T12:22",
        endDate: "2025-05-14T12:22",
        targeting: {
          ageMin: 30,
          ageMax: 55,
          gender: "female",
          language: "vi",
          location: "Việt Nam",
          interests: ["Home & Garden", "Parenting"]
        },
        adIds: [12, 13, 14]
      },
      {
        id: 8,
        campaignId: 3,
        name: "Nhóm quảng cáo Doanh số #3",
        status: "Đang tắt",
        budget: "30,000,000đ",
        impressions: "300,000",
        reach: "300",
        enabled: false,
        time: "12:30 22:04:05",
        isChecked: false,
        conversion: "website",
        performanceGoal: "purchase",
        budgetType: "lifetime",
        budgetAmount: 30000000,
        startDate: "2025-04-14T12:22",
        endDate: "2025-05-14T12:22",
        targeting: {
          ageMin: 18,
          ageMax: 35,
          gender: "all",
          language: "vi",
          location: "Hà Nội, Việt Nam",
          interests: ["Technology", "Electronics"]
        },
        adIds: [15]
      },
      {
        id: 9,
        campaignId: 3,
        name: "Nhóm quảng cáo Doanh số #4",
        status: "Đang tắt",
        budget: "30,000,000đ",
        impressions: "300,000",
        reach: "300",
        enabled: false,
        time: "12:30 22:04:05",
        isChecked: false,
        conversion: "destination",
        performanceGoal: "potential",
        budgetType: "daily",
        budgetAmount: 30000000,
        startDate: "2025-04-14T12:22",
        endDate: "2025-05-14T12:22",
        targeting: {
          ageMin: 20,
          ageMax: 40,
          gender: "male",
          language: "vi",
          location: "Việt Nam",
          interests: ["Sports", "Fitness"]
        },
        adIds: [16]
      }
    ];

    const ads = [
      {
        id: 1,
        adsetId: 1,
        campaignId: 1,
        name: "Quảng cáo Tương tác #1",
        status: "Hoạt động",
        budget: "15,000,000đ",
        impressions: "150,000",
        reach: "150",
        enabled: true,
        time: "12:30 22:04:05",
        isChecked: false,
        facebookPage: "Fchat.vn",
        media: "image",
        primaryText: "Hãy giới thiệu về nội dung quảng cáo của bạn",
        headline: "Chat trong Messenger",
        cta: "Gửi tin nhắn"
      },
      {
        id: 2,
        adsetId: 1,
        campaignId: 1,
        name: "Quảng cáo Tương tác #2",
        status: "Hoạt động",
        budget: "15,000,000đ",
        impressions: "150,000",
        reach: "150",
        enabled: true,
        time: "12:30 22:04:05",
        isChecked: false,
        facebookPage: "Fchat.vn",
        media: "video",
        primaryText: "Khám phá sản phẩm mới của chúng tôi",
        headline: "Sản phẩm chất lượng cao",
        cta: "Tìm hiểu thêm"
      },
      {
        id: 3,
        adsetId: 2,
        campaignId: 1,
        name: "Quảng cáo Tương tác #3",
        status: "Hoạt động",
        budget: "11,666,667đ",
        impressions: "116,667",
        reach: "116",
        enabled: true,
        time: "12:30 22:04:05",
        isChecked: false,
        facebookPage: "Fchat.vn",
        media: "image",
        primaryText: "Tham gia cộng đồng của chúng tôi",
        headline: "Kết nối với chúng tôi",
        cta: "Gửi tin nhắn"
      },
      {
        id: 4,
        adsetId: 2,
        campaignId: 1,
        name: "Quảng cáo Tương tác #4",
        status: "Hoạt động",
        budget: "11,666,667đ",
        impressions: "116,667",
        reach: "116",
        enabled: true,
        time: "12:30 22:04:05",
        isChecked: false,
        facebookPage: "Fchat.vn",
        media: "carousel",
        primaryText: "Xem bộ sưu tập sản phẩm mới",
        headline: "Bộ sưu tập mới",
        cta: "Xem ngay"
      },
      {
        id: 5,
        adsetId: 2,
        campaignId: 1,
        name: "Quảng cáo Tương tác #5",
        status: "Đang tắt",
        budget: "11,666,667đ",
        impressions: "116,667",
        reach: "116",
        enabled: false,
        time: "12:30 22:04:05",
        isChecked: false,
        facebookPage: "Fchat.vn",
        media: "image",
        primaryText: "Ưu đãi đặc biệt cho bạn",
        headline: "Giảm giá 50%",
        cta: "Mua ngay"
      },
      {
        id: 6,
        adsetId: 3,
        campaignId: 1,
        name: "Quảng cáo Tương tác #6",
        status: "Đang tắt",
        budget: "35,000,000đ",
        impressions: "350,000",
        reach: "350",
        enabled: false,
        time: "12:30 22:04:05",
        isChecked: false,
        facebookPage: "Fchat.vn",
        media: "video",
        primaryText: "Tìm hiểu về dịch vụ của chúng tôi",
        headline: "Dịch vụ chuyên nghiệp",
        cta: "Liên hệ ngay"
      },
      {
        id: 7,
        adsetId: 4,
        campaignId: 2,
        name: "Quảng cáo Lưu lượng #1",
        status: "Hoạt động",
        budget: "20,000,000đ",
        impressions: "200,000",
        reach: "200",
        enabled: true,
        time: "12:30 22:04:05",
        isChecked: false,
        facebookPage: "Fchat.vn",
        media: "image",
        primaryText: "Truy cập website của chúng tôi",
        headline: "Website chính thức",
        cta: "Tìm hiểu thêm"
      },
      {
        id: 8,
        adsetId: 4,
        campaignId: 2,
        name: "Quảng cáo Lưu lượng #2",
        status: "Hoạt động",
        budget: "20,000,000đ",
        impressions: "200,000",
        reach: "200",
        enabled: true,
        time: "12:30 22:04:05",
        isChecked: false,
        facebookPage: "Fchat.vn",
        media: "video",
        primaryText: "Khám phá trang web mới",
        headline: "Trải nghiệm mới",
        cta: "Truy cập ngay"
      },
      {
        id: 9,
        adsetId: 5,
        campaignId: 2,
        name: "Quảng cáo Lưu lượng #3",
        status: "Đang tắt",
        budget: "40,000,000đ",
        impressions: "400,000",
        reach: "400",
        enabled: false,
        time: "12:30 22:04:05",
        isChecked: false,
        facebookPage: "Fchat.vn",
        media: "image",
        primaryText: "Đăng ký nhận thông tin mới",
        headline: "Đăng ký ngay",
        cta: "Đăng ký"
      },
      {
        id: 10,
        adsetId: 6,
        campaignId: 3,
        name: "Quảng cáo Doanh số #1",
        status: "Hoạt động",
        budget: "15,000,000đ",
        impressions: "150,000",
        reach: "150",
        enabled: true,
        time: "12:30 22:04:05",
        isChecked: false,
        facebookPage: "Fchat.vn",
        media: "image",
        primaryText: "Mua sắm ngay hôm nay",
        headline: "Sản phẩm hot",
        cta: "Mua ngay"
      },
      {
        id: 11,
        adsetId: 6,
        campaignId: 3,
        name: "Quảng cáo Doanh số #2",
        status: "Hoạt động",
        budget: "15,000,000đ",
        impressions: "150,000",
        reach: "150",
        enabled: true,
        time: "12:30 22:04:05",
        isChecked: false,
        facebookPage: "Fchat.vn",
        media: "video",
        primaryText: "Ưu đãi cuối tuần",
        headline: "Giảm giá 30%",
        cta: "Mua ngay"
      },
      {
        id: 12,
        adsetId: 7,
        campaignId: 3,
        name: "Quảng cáo Doanh số #3",
        status: "Hoạt động",
        budget: "10,000,000đ",
        impressions: "100,000",
        reach: "100",
        enabled: true,
        time: "12:30 22:04:05",
        isChecked: false,
        facebookPage: "Fchat.vn",
        media: "carousel",
        primaryText: "Bộ sưu tập mùa mới",
        headline: "Thời trang mới",
        cta: "Mua ngay"
      },
      {
        id: 13,
        adsetId: 7,
        campaignId: 3,
        name: "Quảng cáo Doanh số #4",
        status: "Hoạt động",
        budget: "10,000,000đ",
        impressions: "100,000",
        reach: "100",
        enabled: true,
        time: "12:30 22:04:05",
        isChecked: false,
        facebookPage: "Fchat.vn",
        media: "image",
        primaryText: "Sản phẩm cho gia đình",
        headline: "Gia đình hạnh phúc",
        cta: "Mua ngay"
      },
      {
        id: 14,
        adsetId: 7,
        campaignId: 3,
        name: "Quảng cáo Doanh số #5",
        status: "Đang tắt",
        budget: "10,000,000đ",
        impressions: "100,000",
        reach: "100",
        enabled: false,
        time: "12:30 22:04:05",
        isChecked: false,
        facebookPage: "Fchat.vn",
        media: "video",
        primaryText: "Chăm sóc sức khỏe gia đình",
        headline: "Sức khỏe là vàng",
        cta: "Tìm hiểu thêm"
      },
      {
        id: 15,
        adsetId: 8,
        campaignId: 3,
        name: "Quảng cáo Doanh số #6",
        status: "Đang tắt",
        budget: "30,000,000đ",
        impressions: "300,000",
        reach: "300",
        enabled: false,
        time: "12:30 22:04:05",
        isChecked: false,
        facebookPage: "Fchat.vn",
        media: "image",
        primaryText: "Công nghệ mới nhất",
        headline: "Công nghệ tiên tiến",
        cta: "Mua ngay"
      },
      {
        id: 16,
        adsetId: 9,
        campaignId: 3,
        name: "Quảng cáo Doanh số #7",
        status: "Đang tắt",
        budget: "30,000,000đ",
        impressions: "300,000",
        reach: "300",
        enabled: false,
        time: "12:30 22:04:05",
        isChecked: false,
        facebookPage: "Fchat.vn",
        media: "video",
        primaryText: "Thể thao và sức khỏe",
        headline: "Sống khỏe mỗi ngày",
        cta: "Tìm hiểu thêm"
      }
    ];

    return { campaigns, adsets, ads };
  }, []);

  //Lấy data từ hàm makeData
  const [datasets, setDatasets] = useState(makeData);

   //Tạo và gắn false cho checkbox
   const [checkAll, setCheckAll] = useState(false);
   
   // State để theo dõi có item nào được chọn không
   const [hasSelectedItems, setHasSelectedItems] = useState(false);

  // Set dữ liệu để hiển thị tùy thuộc vào tab và filter theo campaign/adset được chọn
  const getFilteredRows = () => {
    if (activeTab === "campaigns") {
      return datasets.campaigns;
    } else if (activeTab === "adsets") {
      if (selectedCampaign) {
        return datasets.adsets.filter(adset => adset.campaignId === selectedCampaign.id);
      }
      return datasets.adsets;
    } else if (activeTab === "ads") {
      if (selectedAdset) {
        return datasets.ads.filter(ad => ad.adsetId === selectedAdset.id);
      } else if (selectedCampaign) {
        return datasets.ads.filter(ad => ad.campaignId === selectedCampaign.id);
      }
      return datasets.ads;
    }
    return [];
  };

  const rows = getFilteredRows();

  //Function on/off trạng thái
  const toggleRow = (id) => {
    setDatasets((prev) => {
      const key =
        activeTab === "campaigns"
          ? "campaigns"
          : activeTab === "adsets"
          ? "adsets"
          : "ads";
      return {
        ...prev,
        [key]: prev[key].map((r) => {
          if (r.id !== id) return r;
          const nextEnabled = !r.enabled;
          return {
            ...r,
            enabled: nextEnabled,
            status: nextEnabled ? "Hoạt động" : "Đang tắt",
          };
        }),
      };
    });
  };

   // Hàm xử lý chọn tất cả
   const handleCheckAll = (event) => {
     const isChecked = event.target.checked;
     setCheckAll(isChecked);
     setHasSelectedItems(isChecked);
     setDatasets((prev) => {
       const key =
         activeTab === "campaigns"
           ? "campaigns"
           : activeTab === "adsets"
           ? "adsets"
           : "ads";
       const updatedItems = handleSelectAll(isChecked, prev[key]);
       return { ...prev, [key]: updatedItems };
     });
   };

  //Hàm xử lý chọn đơn lẻ
  const handleCheckItem = (id) => {
    setDatasets((prev) => {
      const key =
        activeTab === "campaigns"
          ? "campaigns"
          : activeTab === "adsets"
          ? "adsets"
          : "ads";
      const { updatedItems, allChecked } = handleSelectItem(id, prev[key]);
      setCheckAll(allChecked);
      
      // Kiểm tra có item nào được chọn không
      const hasSelected = updatedItems.some(item => item.isChecked);
      setHasSelectedItems(hasSelected);
      
      return { ...prev, [key]: updatedItems };
    });
  };

  // Hàm xử lý cập nhật
  const handleUpdate = (id) => {
    const item = rows.find(row => row.id === id);
    if (item) {
      setEditingItem({ type: activeTab.slice(0, -1), id: id }); // Remove 's' from end
      setWizardMode("edit");
      setShowWizard(true);
      
      // Set selected items for context
      if (activeTab === "adsets") {
        const campaign = datasets.campaigns.find(c => c.id === item.campaignId);
        setSelectedCampaign(campaign);
      } else if (activeTab === "ads") {
        const adset = datasets.adsets.find(a => a.id === item.adsetId);
        const campaign = datasets.campaigns.find(c => c.id === item.campaignId);
        setSelectedAdset(adset);
        setSelectedCampaign(campaign);
      }
    }
  };

  // Hàm xử lý lưu trữ
  const handleArchive = (id) => {
    console.log(`Lưu trữ ${activeTab} với ID:`, id);
    // TODO: Implement archive logic
  };

  // Hàm xử lý xóa
  const handleDelete = (id) => {
    console.log(`Xóa ${activeTab} với ID:`, id);
    // TODO: Implement delete logic
  };


  // Hàm xử lý click vào campaign để xem adsets
  const handleCampaignClick = (campaign) => {
    setSelectedCampaign(campaign);
    setSelectedAdset(null);
    setActiveTab("adsets");
  };

  // Hàm xử lý click vào adset để xem ads
  const handleAdsetClick = (adset) => {
    setSelectedAdset(adset);
    setActiveTab("ads");
  };

  // Hàm reset selection
  const resetSelection = () => {
    setSelectedCampaign(null);
    setSelectedAdset(null);
    setCheckAll(false);
    setHasSelectedItems(false);
  };

  return (
    <div className="ads-management-layout">
      <div className="ads-management-content">
        <div className="ads-management-center">
          <div className="ads-card">
            <div className="ads-toolbar">
              <div className="account-select">
                <select>
                  <option>Salemall.Fchat - 5 (2733322083474120)</option>
                  <option>Salemall.Fchat - 4 (2733322083474234)</option>
                  <option>Salemall.Fchat - 3 (2733322083474587)</option>
                </select>
                {/* Show Wizard tạo chiến dịch */}
                <button
                  className="btn-create"
                  onClick={() => {
                    setWizardMode("create");
                    setEditingItem(null);
                    resetSelection();
                    setShowWizard(true);
                  }}
                >
                  + Tạo chiến dịch
                </button>
              </div>

              {/* Tạo trường dữ liệu thời gian để tìm kiếm chiến dịch và nhóm quảng cáo */}
              <div className="filters">
                <span> Từ </span>
                <input type="date" />
                <span> đến </span>
                <input type="date" />
                <button className="btn-filter">Tìm</button>
              </div>
            </div>

            {/* Breadcrumb Navigation */}
            {(selectedCampaign || selectedAdset) && (
              <div className="breadcrumb-nav">
                <button 
                  className="breadcrumb-item"
                  onClick={() => {
                    resetSelection();
                    setActiveTab("campaigns");
                  }}
                >
                  Tất cả chiến dịch
                </button>
                {selectedCampaign && (
                  <>
                    <span className="breadcrumb-separator">›</span>
                    <button 
                      className="breadcrumb-item"
                      onClick={() => {
                        setSelectedAdset(null);
                        setActiveTab("adsets");
                      }}
                    >
                      {selectedCampaign.name}
                    </button>
                  </>
                )}
                {selectedAdset && (
                  <>
                    <span className="breadcrumb-separator">›</span>
                    <button 
                      className="breadcrumb-item active"
                      onClick={() => setActiveTab("ads")}
                    >
                      {selectedAdset.name}
                    </button>
                  </>
                )}
              </div>
            )}

            <div className="ads-tabs">
               <button
                 className={`tab ${activeTab === "campaigns" ? "active" : ""}`}
                 onClick={() => {
                   setActiveTab("campaigns");
                   resetSelection();
                 }}
               >
                 <span className="tab-icon">▦</span>
                 Chiến dịch
               </button>
               <button
                 className={`tab ${activeTab === "adsets" ? "active" : ""}`}
                 onClick={() => {
                   setActiveTab("adsets");
                   setSelectedAdset(null);
                   setCheckAll(false);
                   setHasSelectedItems(false);
                 }}
               >
                 <span className="tab-icon">▣</span>
                 Nhóm quảng cáo
               </button>
               <button
                 className={`tab ${activeTab === "ads" ? "active" : ""}`}
                 onClick={() => {
                   setActiveTab("ads");
                   setCheckAll(false);
                   setHasSelectedItems(false);
                 }}
               >
                 <span className="tab-icon">▥</span>
                 Quảng cáo
               </button>
               {hasSelectedItems && (
                 <div className="icon-beside-tab">
                   <button
                     className="ads-action-btn ads-archive-btn"
                     onClick={() => handleArchive()}
                     title="Lưu trữ"
                   >
                     <Archive size={15} />
                   </button>
                   <button
                     className="ads-action-btn ads-delete-btn"
                     onClick={() => handleDelete()}
                     title="Xóa"
                   >
                     <Trash size={15} />
                   </button>
                 </div>
               )}
            </div>

            {/* Content chính */}
            <div className="ads-table-wrapper">
              <table className="ads-table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={checkAll}
                        onChange={handleCheckAll}
                      />
                    </th>
                    <th>Tắt/Bật</th>
                    <th>Chiến dịch</th>
                    <th>Trạng thái</th>
                    <th>Ngân sách</th>
                    <th>Số tiền đã tiêu</th>
                    <th>Số lần hiển thị</th>
                    <th>Lượt tiếp cận</th>
                    <th>Kết quả</th>
                    <th>Chất lượng</th>
                    <th>Cập nhật lần cuối</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={row.isChecked}
                          onChange={() => handleCheckItem(row.id)}
                        />
                      </td>
                      <td className="cell-name">
                        <button
                          type="button"
                          className={`switch ${row.enabled ? "on" : "off"}`}
                          aria-pressed={row.enabled}
                          onClick={() => toggleRow(row.id)}
                        />
                      </td>
                      <td>
                        <div className="name-cell">
                          <span 
                            className="name-text clickable"
                            onClick={() => {
                              if (activeTab === "campaigns") {
                                handleCampaignClick(row);
                              } else if (activeTab === "adsets") {
                                handleAdsetClick(row);
                              }
                            }}
                          >
                            {row.name}
                          </span>
                        </div>
                      </td>
                      <td
                        className={
                          row.status === "Hoạt động"
                            ? "status-active"
                            : "status-inactive"
                        }
                      >
                        {row.status}
                      </td>
                      <td className="text-center">{row.budget}</td>
                      <td className="text-right">{row.impressions}</td>
                      <td className="text-right">{row.reach}</td>
                      <td className="text-right">{row.reach}</td>
                      <td className="text-right">{row.reach}</td>
                      <td className="text-right">{row.reach}</td>
                      <td className="text-right">{row.time}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="ads-action-btn ads-update-btn"
                            onClick={() => handleUpdate(row.id)}
                            title="Cập nhật"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            className="ads-action-btn ads-archive-btn"
                            onClick={() => handleArchive(row.id)}
                            title="Lưu trữ"
                          >
                            <Archive size={14} />
                          </button>
                          <button
                            className="ads-action-btn ads-delete-btn"
                            onClick={() => handleDelete(row.id)}
                            title="Xóa"
                          >
                            <Trash size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      {/* Đóng Wizard tạo chiến dịch */}
      {showWizard && (
        <CreateAdsWizard 
          onClose={() => {
            setShowWizard(false);
            setEditingItem(null);
            setWizardMode("create");
          }}
          mode={wizardMode}
          editingItem={editingItem}
          selectedCampaign={selectedCampaign}
          selectedAdset={selectedAdset}
          datasets={datasets}
          setDatasets={setDatasets}
        />
      )}
    </div>
  );
}

export default AdsManagement;
