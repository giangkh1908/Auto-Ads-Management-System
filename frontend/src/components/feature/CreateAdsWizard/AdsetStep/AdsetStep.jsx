import { useState, useRef, forwardRef, useImperativeHandle, useEffect } from "react";
import { useOnClickOutside } from "../../../../utils/useOnClickOutside";
import { useToast } from "../../../../hooks/useToast";
import { validateNonEmpty } from "../../../../utils/validation";
import {
  Circle,
  Target,
  DollarSign,
  Calendar,
  Users,
  MapPin,
  Search,
} from "lucide-react";
import "./AdsetStep.css";
import { getNames } from "country-list";

// Mapping các optimization_goal và billing_event theo mục tiêu chiến dịch
const CAMPAIGN_OBJECTIVE_MAPPING = {
  AWARENESS: {
    optimization_goals: [
      { value: 'IMPRESSIONS', label: 'Số lần hiển thị' },
      { value: 'REACH', label: 'Tiếp cận' }
    ],
    billing_events: ['IMPRESSIONS', 'REACH']
  },
  TRAFFIC: {
    optimization_goals: [
      { value: 'LINK_CLICKS', label: 'Lượt nhấp link' },
      { value: 'LANDING_PAGE_VIEWS', label: 'Lượt xem trang đích' }
    ],
    billing_events: ['IMPRESSIONS', 'LINK_CLICKS']
  },
  ENGAGEMENT: {
    optimization_goals: [
      { value: 'REACH', label: 'Tiếp cận' },
      { value: 'POST_ENGAGEMENT', label: 'Tương tác bài viết' },
      { value: 'THRUPLAY', label: 'Lượt xem video' },
      { value: 'PAGE_LIKES', label: 'Lượt thích trang' }
    ],
    billing_events: ['IMPRESSIONS', 'POST_ENGAGEMENT']
  },
  APP_PROMOTION: {
    optimization_goals: [
      { value: 'APP_INSTALLS', label: 'Lượt cài đặt ứng dụng' }
    ],
    billing_events: ['IMPRESSIONS', 'APP_INSTALLS']
  },
  LEADS: {
    optimization_goals: [
      { value: 'LEAD_GENERATION', label: 'Khách hàng tiềm năng' },
      { value: 'QUALITY_LEAD', label: 'Chuyển đổi' }
    ],
    conversion_events: [
      { value: 'LEAD', label: 'Khách hàng tiềm năng' },
      { value: 'COMPLETE_REGISTRATION', label: 'Hoàn tất đăng ký' }
    ],
    billing_events: ['IMPRESSIONS', 'LEAD_GENERATION', 'CONVERSIONS']
  },
  CONVERSIONS: {
    optimization_goals: [
      { value: 'OFFSITE_CONVERSIONS', label: 'Chuyển đổi' }
    ],
    conversion_events: [
      { value: 'PURCHASE', label: 'Mua hàng' },
      { value: 'ADD_TO_CART', label: 'Thêm vào giỏ hàng' },
      { value: 'VIEW_CONTENT', label: 'Xem nội dung' }
    ],
    billing_events: ['IMPRESSIONS', 'LINK_CLICKS', 'CONVERSIONS']
  }
}

// Labels cho billing_event
const BILLING_EVENT_LABELS = {
  IMPRESSIONS: 'Hiển thị (lượt xem quảng cáo)',
  LINK_CLICKS: 'Nhấp vào liên kết',
  APP_INSTALLS: 'Cài đặt ứng dụng',
  VIDEO_VIEWS: 'Lượt xem video',
  POST_ENGAGEMENT: 'Tương tác bài viết',
  PAGE_LIKES: 'Lượt thích trang',
  CONVERSIONS: 'Chuyển đổi',
  LEAD_GENERATION: 'Khách hàng tiềm năng',
  REACH: 'Tiếp cận'
}

function AdsetStepInner({ adset, setAdset, objective }, ref) {
  const [selectedTags, setSelectedTags] = useState(
    adset.targeting?.location
      ? [adset.targeting.location]
      : ["Viet Nam"]
  );

  // Lấy các options dựa trên mục tiêu chiến dịch
  const getObjectiveOptions = () => {
    const mapping = CAMPAIGN_OBJECTIVE_MAPPING[objective] || CAMPAIGN_OBJECTIVE_MAPPING.AWARENESS;
    return mapping;
  };

  // Lấy các billing_event tương thích với mục tiêu chiến dịch
  const getCompatibleBillingEvents = () => {
    const mapping = getObjectiveOptions();
    return mapping.billing_events || ['IMPRESSIONS'];
  };

  // Cập nhật billing_event khi optimization_goal thay đổi
  const handleOptimizationGoalChange = (newOptimizationGoal) => {
    const compatibleEvents = getCompatibleBillingEvents();
    const currentBillingEvent = adset.billing_event;
    
    // Nếu billing_event hiện tại không tương thích, chọn billing_event đầu tiên
    const newBillingEvent = compatibleEvents.includes(currentBillingEvent) 
      ? currentBillingEvent 
      : compatibleEvents[0];

    setAdset((prev) => ({
      ...prev,
      optimization_goal: newOptimizationGoal,
      billing_event: newBillingEvent,
    }));
  };
  const [selectedInterests, setSelectedInterests] = useState(
    adset.targeting?.interests || ["E-commerce"]
  );
  const toast = useToast();

  // Suggest countries for tags (using country-list)
  const countries = getNames() || [];
  const [locationInput, setLocationInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsWrapperRef = useRef(null);
  useOnClickOutside(suggestionsWrapperRef, () => setShowSuggestions(false));

  const filteredCountrySuggestions = countries
    .filter((c) => c.toLowerCase().includes(locationInput.trim().toLowerCase()))
    .slice(0, 8);

  const addTag = (tag) => {
    if (!tag) return;
    const trimmed = tag.trim();
    if (!trimmed) return;
    // If input matches a country name ignoring case, normalize to proper case from list
    const normalized =
      countries.find((c) => c.toLowerCase() === trimmed.toLowerCase()) ||
      trimmed;
    setSelectedTags((prev) =>
      Array.from(new Set([...(prev || []), normalized]))
    );
    setLocationInput("");
    setShowSuggestions(false);
  };

  const removeTag = (idx) => {
    setSelectedTags((prev) => prev.filter((_, i) => i !== idx));
  };

  // ===== Interests (detailed targeting) suggestions & tags =====
  const DEFAULT_INTERESTS = [
    "E-commerce",
    "Online shopping",
    "Digital marketing",
    "Technology",
    "Mobile apps",
    "Gaming",
    "Travel",
    "Food & beverage",
    "Fashion",
    "Beauty",
    "Fitness",
    "Finance",
    "Education",
  ];
  const [interestInput, setInterestInput] = useState("");
  const [showInterestSuggestions, setShowInterestSuggestions] = useState(false);
  const interestsWrapperRef = useRef(null);
  useOnClickOutside(interestsWrapperRef, () =>
    setShowInterestSuggestions(false)
  );

  const filteredInterestSuggestions = DEFAULT_INTERESTS.filter((it) =>
    it.toLowerCase().includes(interestInput.trim().toLowerCase())
  ).slice(0, 8);

  const addInterest = (val) => {
    if (!val) return;
    const trimmed = val.trim();
    if (!trimmed) return;
    setSelectedInterests((prev) =>
      Array.from(new Set([...(prev || []), trimmed]))
    );
    setInterestInput("");
    setShowInterestSuggestions(false);
  };

  const removeInterest = (idx) => {
    setSelectedInterests((prev) => prev.filter((_, i) => i !== idx));
  };

  // 🕒 Helper: convert date to input[type=datetime-local] value (YYYY-MM-DDTHH:mm)
  const toInputDateTime = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    const yyyy = d.getFullYear();
    const MM = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const HH = pad(d.getHours());
    const mm = pad(d.getMinutes());
    return `${yyyy}-${MM}-${dd}T${HH}:${mm}`;
  };

  // 🕒 Helper: format display dd/MM/yyyy HH:mm
  const formatDisplay = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    const dd = pad(d.getDate());
    const MM = pad(d.getMonth() + 1);
    const yyyy = d.getFullYear();
    const HH = pad(d.getHours());
    const mm = pad(d.getMinutes());
    return `${dd}/${MM}/${yyyy} ${HH}:${mm}`;
  };

  function getAllLanguages() {
    return [
      { code: "all", name: "Tất cả ngôn ngữ" },
      { code: "vi", name: "Tiếng Việt" },
      { code: "en", name: "English" },
      { code: "zh", name: "中文 (Chinese)" },
      { code: "ja", name: "日本語 (Japanese)" },
      { code: "ko", name: "한국어 (Korean)" },
      { code: "fr", name: "Français (French)" },
      { code: "de", name: "Deutsch (German)" },
      { code: "es", name: "Español (Spanish)" },
      { code: "ru", name: "Русский (Russian)" },
      { code: "th", name: "ไทย (Thai)" },
      { code: "id", name: "Bahasa Indonesia" },
      { code: "ms", name: "Bahasa Melayu" },
      { code: "hi", name: "हिन्दी (Hindi)" },
      { code: "pt", name: "Português (Portuguese)" },
      { code: "it", name: "Italiano (Italian)" },
      { code: "ar", name: "العربية (Arabic)" },
    ];
  }


  // Expose validate() to parent
  useImperativeHandle(ref, () => ({
    validate: () => {
      let isValid = true;
      
      // Kiểm tra tên adset
      if (!adset?.name || adset.name.trim() === "") {
        toast.warning("Vui lòng nhập tên nhóm quảng cáo");
        isValid = false;
      }
      
      // Kiểm tra bid_amount khi chiến lược là LOWEST_COST_WITH_BID_CAP
      if (adset.bid_strategy === 'LOWEST_COST_WITH_BID_CAP' && (!adset.bid_amount || adset.bid_amount <= 0)) {
        toast.warning("Vui lòng nhập giới hạn giá thầu hợp lệ");
        isValid = false;
      }
      
      // Đảm bảo có optimization_goal
      const okOptimization = !!adset?.optimization_goal;
      if (!okOptimization) {
        toast.error("Thiếu mục tiêu tối ưu hóa");
        // Tự động thiết lập giá trị mặc định nếu chưa có
        setAdset(prev => ({
          ...prev,
          optimization_goal: getObjectiveOptions().optimization_goals[0]?.value || "REACH",
          billing_event: getCompatibleBillingEvents()[0] || "IMPRESSIONS"
        }));
      }

      // Đảm bảo có billing_event
      const okBillingEvent = !!adset?.billing_event;
      if (!okBillingEvent) {
        toast.error("Thiếu sự kiện tính phí");
      }
      
      return isValid && okOptimization && okBillingEvent;
    }
  }), [adset, toast, getObjectiveOptions, getCompatibleBillingEvents]);

  // Thêm useEffect để đảm bảo các giá trị mặc định khi component mount
  useEffect(() => {
    // Nếu optimization_goal chưa được thiết lập
    if (!adset.optimization_goal) {
      const defaultOptimizationGoal = getObjectiveOptions().optimization_goals[0]?.value;
      const defaultBillingEvent = getCompatibleBillingEvents()[0];
      
      setAdset(prev => ({
        ...prev,
        optimization_goal: defaultOptimizationGoal,
        billing_event: defaultBillingEvent,
        bid_strategy: prev.bid_strategy || "LOWEST_COST_WITHOUT_CAP",
        bid_amount: prev.bid_amount || 100
      }));
    }
  }, [objective]); // Re-run khi objective thay đổi

  // Thêm useEffect để theo dõi thay đổi của bid_strategy
  useEffect(() => {
    // Khi bid_strategy thay đổi thành LOWEST_COST_WITHOUT_CAP, xóa bid_amount
    if (adset.bid_strategy === 'LOWEST_COST_WITHOUT_CAP' && adset.bid_amount !== undefined) {
      setAdset(prev => {
        const updated = { ...prev };
        delete updated.bid_amount;
        return updated;
      });
    }
  }, [adset.bid_strategy]);

  // Thêm hàm xử lý thay đổi bid strategy
  const handleBidStrategyChange = (value) => {
    if (value === 'LOWEST_COST_WITHOUT_CAP') {
      // Khi chọn LOWEST_COST_WITHOUT_CAP, xóa bid_amount
      setAdset(prev => {
        const updated = { ...prev, bid_strategy: value };
        delete updated.bid_amount;
        return updated;
      });
      
      // Thông báo người dùng (optional)
      toast?.info("Đã tắt giới hạn giá thầu theo chính sách của Facebook");
    } else if (value === 'LOWEST_COST_WITH_BID_CAP') {
      // Khi chọn LOWEST_COST_WITH_BID_CAP, cần có bid_amount
      setAdset(prev => ({
        ...prev,
        bid_strategy: value,
        bid_amount: prev.bid_amount || 100 // Giá trị mặc định nếu chưa có
      }));
    } else {
      // Các loại khác
      setAdset(prev => ({ ...prev, bid_strategy: value }));
    }
  };

  return (
    <div className="adset-step">
      <div className="config-scroll-container">
        {/* --- Adset Name --- */}
        <div className="config-section">
          <div className="section-header-adset">
            <Circle size={8} fill="#2563eb" color="#2563eb" />
            <h3 className="section-title-ads">Tên nhóm quảng cáo</h3>
          </div>
          <input
            type="text"
            className="adset-name-input"
            value={adset.name}
            onChange={(e) =>
              setAdset((prev) => ({ ...prev, name: e.target.value }))
            }
            onBlur={() =>
              validateNonEmpty(adset.name, "tên nhóm quảng cáo", toast)
            }
            placeholder="Chiến dịch nhóm quảng cáo Lượt tương tác mới"
          />
        </div>
        {/* Conversion Section */}
        <div className="config-section">
          <div className="section-header-ads">
            <Target size={16} color="#2563eb" />
            <h3 className="section-title-ads">Lượt chuyển đổi</h3>
          </div>
          <select
            className="conversion-select"
            value={adset.conversion || "destination"}
            onChange={(e) =>
              setAdset((prev) => ({ ...prev, conversion: e.target.value }))
            }
          >
            <option value="destination">Đích đến của tin nhắn</option>
            <option value="website">Trang web</option>
          </select>
        </div>

        {/* Performance Goal Section */}
        <div className="config-section">
          <div className="section-header-ads">
            <Target size={16} color="#2563eb" />
            <h3 className="section-title-ads">Mục tiêu hiệu quả</h3>
          </div>
          <select
            className="performance-select"
            value={adset.performanceGoal || "purchase"}
            onChange={(e) =>
              setAdset((prev) => ({ ...prev, performanceGoal: e.target.value }))
            }
          >
            <option value="purchase">
              Tối đa hóa số lượt mua qua tin nhắn
            </option>
            <option value="chat">Tối đa hóa số cuộc trò chuyện</option>
            <option value="potential">
              Tối đa hóa số khách hàng tiềm năng qua tin nhắn
            </option>
          </select>
        </div>

        {/* Optimization & Billing */}
        <div className="config-section">
          <div className="section-header-ads">
            <Target size={16} color="#2563eb" />
            <h3 className="section-title-ads">Tối ưu hóa & Thanh toán</h3>
          </div>
          <div className="field-group">
            <label className="field-label">Mục tiêu tối ưu hóa</label>
            <select
              className="optimization-select"
              value={adset?.optimization_goal || getObjectiveOptions().optimization_goals[0]?.value || "REACH"}
              onChange={(e) => handleOptimizationGoalChange(e.target.value)}
            >
              {getObjectiveOptions().optimization_goals.map((goal) => (
                <option key={goal.value} value={goal.value}>
                  {goal.label}
                </option>
              ))}
            </select>
          </div>

          {/* billing_event = "Facebook thu tiền bạn theo sự kiện nào?" */}
          <div className="field-group">
            <label className="field-label" title="Facebook thu tiền bạn theo sự kiện nào?">
              Sự kiện tính phí ?
            </label>
            <select
              className="conversion-event-select"
              value={adset.billing_event || "IMPRESSIONS"}
              onChange={(e) =>
                setAdset((prev) => ({
                  ...prev,
                  billing_event: e.target.value,
                }))
              }
              disabled={!adset.optimization_goal}
            >
              {getCompatibleBillingEvents().map((event) => (
                <option key={event} value={event}>
                  {BILLING_EVENT_LABELS[event]}
                </option>
              ))}
            </select>
            {!adset.optimization_goal && (
              <small className="field-hint" style={{ color: '#3275db', fontSize: '12px' }}>
                Vui lòng chọn mục tiêu tối ưu hóa trước
              </small>
            )}
          </div>
          
          {/* conversion_event = "Facebook nên tối ưu quảng cáo hướng tới hành vi nào?" - chỉ hiển thị cho LEADS và CONVERSIONS */}
          {(objective === 'LEADS' || objective === 'CONVERSIONS') && getObjectiveOptions().conversion_events && (
            <div className="field-group">
              <label className="field-label" title="Facebook nên tối ưu quảng cáo hướng tới hành vi nào?">
                Sự kiện chuyển đổi ?
              </label>
              <select
                className="conversion-event-select"
                value={adset.conversion_event || getObjectiveOptions().conversion_events[0]?.value}
                onChange={(e) =>
                  setAdset((prev) => ({
                    ...prev,
                    conversion_event: e.target.value,
                  }))
                }
              >
                {getObjectiveOptions().conversion_events.map((event) => (
                  <option key={event.value} value={event.value}>
                    {event.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          {/* Pixel ID chỉ hiển thị cho CONVERSIONS */}
          {objective === 'CONVERSIONS' && (
            <div className="field-group">
              <label className="field-label">Pixel ID</label>
              <input
                type="text"
                className="text-input-pixel"
                value={adset.pixel_id || ""}
                onChange={(e) =>
                  setAdset((prev) => ({ ...prev, pixel_id: e.target.value }))
                }
                onBlur={() =>
                  validateNonEmpty(adset.pixel_id, "Pixel ID", toast)
                }
                placeholder="Nhập Pixel ID"
              />
            </div>
          )}
        </div>

        {/* --- Budget Section --- */}
        <div className="config-section">
          <div className="section-header-ads">
            <DollarSign size={16} color="#2563eb" />
            <h3 className="section-title-ads">Ngân sách</h3>
          </div>
          <div className="budget-row">
            <select
              className="budget-type"
              value={adset.budgetType || "daily"}
              onChange={(e) =>
                setAdset((prev) => ({ ...prev, budgetType: e.target.value }))
              }
            >
              <option value="daily">Ngân sách hàng ngày</option>
              <option value="lifetime">Ngân sách tổng</option>
            </select>
            <div className="budget-input-group">
              <input
                type="text"
                className="budget-input-text"
                value={adset.budgetAmount?.toLocaleString("vi-VN") || 0}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^\d]/g, "");
                  setAdset((p) => ({ ...p, budgetAmount: raw }));
                }}
                onBlur={(e) => {
                  const num = parseInt(e.target.value.replace(/[^\d]/g, ""));
                  setAdset((p) => ({ ...p, budgetAmount: num }));
                }}
              />
              <div className="money-currency">VND</div>
            </div>
          </div>
        </div>

        {/* --- Date Range Section --- */}
        <div className="config-section-datetime">
          <div className="left-custom">
            <div className="section-header-ads">
              <Calendar size={16} color="#2563eb" />
              <h3 className="section-title-ads">Ngày bắt đầu</h3>
            </div>
            <div className="datetime-overlay-wrapper">
              <input
                type="datetime-local"
                className="datetime-input-ads datetime-input-ads--masked"
                value={toInputDateTime(adset.start_time || adset.startDate)}
                onChange={(e) =>
                  setAdset((prev) => ({ ...prev, start_time: e.target.value, startDate: e.target.value }))
                }
              />
              <span className="datetime-overlay">
                {formatDisplay(adset.start_time || adset.startDate) || new Date().toISOString().split("T")[0] + " 00:00"}
              </span>
            </div>
          </div>

          <div className="right-custom">
            <div className="section-header-ads">
              <Calendar size={16} color="#2563eb" />
              <h3 className="section-title-ads">Ngày kết thúc</h3>
            </div>
            <div className="datetime-overlay-wrapper">
              <input
                type="datetime-local"
                className="datetime-input-ads datetime-input-ads--masked"
                value={toInputDateTime(adset.end_time || adset.endDate)}
                onChange={(e) =>
                  setAdset((prev) => ({ ...prev, end_time: e.target.value, endDate: e.target.value }))
                }
              />
              <span className="datetime-overlay">
                {formatDisplay(adset.end_time || adset.endDate) || new Date().toISOString().split("T")[0] + " 00:00"}
              </span>
            </div>
          </div>
        </div>

        {/* --- Targeting Section --- */}
        <div className="config-section">
          <div className="section-header-ads">
            <Users size={16} color="#2563eb" />
            <h3 className="section-title-ads">Đối tượng tùy chỉnh</h3>
          </div>
          <div className="audience-fields">
            <div className="field-group">
              <label className="field-label">Tuổi</label>
              <div className="age-inputs">
                <input
                  type="number"
                  className="age-input-adset"
                  placeholder="18"
                  min={13}
                  max={65}
                  value={adset.targeting?.ageMin ?? 18}
                  onChange={(e) => {
                    const value =
                      e.target.value === "" ? "" : parseInt(e.target.value);
                    setAdset((prev) => ({
                      ...prev,
                      targeting: {
                        ...prev.targeting,
                        ageMin: value,
                      },
                    }));
                  }}
                  onBlur={(e) => {
                    // Nếu để trống thì gán mặc định là 18
                    if (e.target.value === "") {
                      setAdset((prev) => ({
                        ...prev,
                        targeting: { ...prev.targeting, ageMin: 18 },
                      }));
                    }
                  }}
                />
                <span>--</span>
                <input
                  type="number"
                  className="age-input-adset"
                  placeholder="65+"
                  min={13}
                  max={65}
                  value={adset.targeting?.ageMax ?? 65}
                  onChange={(e) => {
                    const value =
                      e.target.value === "" ? "" : parseInt(e.target.value);
                    setAdset((prev) => ({
                      ...prev,
                      targeting: {
                        ...prev.targeting,
                        ageMax: value,
                      },
                    }));
                  }}
                  onBlur={(e) => {
                    // Nếu để trống thì gán mặc định là 65
                    if (e.target.value === "") {
                      setAdset((prev) => ({
                        ...prev,
                        targeting: { ...prev.targeting, ageMax: 65 },
                      }));
                    }
                  }}
                />
              </div>
            </div>
            <div className="field-group">
              <label className="field-label">Giới tính</label>
              <select
                className="gender-select"
                value={adset.targeting?.gender || "all"}
                onChange={(e) =>
                  setAdset((prev) => ({
                    ...prev,
                    targeting: {
                      ...prev.targeting,
                      gender: e.target.value,
                    },
                  }))
                }
              >
                <option value="all">Tất cả</option>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
              </select>
            </div>

            <div className="field-group">
              <label className="field-label">Ngôn ngữ</label>
              <select
                className="language-select"
                value={adset.targeting?.language || "vi"}
                onChange={(e) =>
                  setAdset((prev) => ({
                    ...prev,
                    targeting: {
                      ...(prev.targeting || {}),
                      language: e.target.value,
                    },
                  }))
                }
              >
                {getAllLanguages().map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Location Section */}
        <div className="config-section">
          <div className="section-header-ads">
            <MapPin size={16} color="#2563eb" />
            <h3 className="section-title-ads">Vị trí</h3>
          </div>
          <div className="location-input-wrapper" ref={suggestionsWrapperRef}>
            <input
              type="text"
              className="location-input"
              placeholder="Tìm kiếm vị trí (quốc gia)"
              value={locationInput}
              onChange={(e) => {
                setLocationInput(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag(locationInput);
                }
                if (e.key === ",") {
                  e.preventDefault();
                  addTag(locationInput.replace(/,$/, ""));
                }
                if (e.key === "Escape") setShowSuggestions(false);
              }}
            />
            {showSuggestions && filteredCountrySuggestions.length > 0 && (
              <div className="location-suggestions">
                {filteredCountrySuggestions.map((item) => (
                  <div
                    key={item}
                    className="location-suggestion-item"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      addTag(item);
                    }}
                  >
                    {item}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="location-tags">
            {selectedTags.map((tag, index) => (
              <span key={index} className="tag">
                {tag}
                <button
                  type="button"
                  className="tag-remove-btn"
                  onClick={() => removeTag(index)}
                  aria-label="Remove tag"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Detailed Targeting Section */}
        <div className="config-section">
          <div className="section-header-ads">
            <Search size={16} color="#2563eb" />
            <h3 className="section-title-ads">Nhắm mục tiêu chi tiết</h3>
          </div>
          <div className="targeting-input-wrapper" ref={interestsWrapperRef}>
            <input
              type="text"
              className="targeting-input"
              placeholder="Thêm sở thích hoặc hành vi"
              value={interestInput}
              onChange={(e) => {
                setInterestInput(e.target.value);
                setShowInterestSuggestions(true);
              }}
              onFocus={() => setShowInterestSuggestions(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addInterest(interestInput);
                }
                if (e.key === ",") {
                  e.preventDefault();
                  addInterest(interestInput.replace(/,$/, ""));
                }
                if (e.key === "Escape") setShowInterestSuggestions(false);
              }}
            />
            {showInterestSuggestions &&
              filteredInterestSuggestions.length > 0 && (
                <div className="targeting-suggestions">
                  {filteredInterestSuggestions.map((item) => (
                    <div
                      key={item}
                      className="targeting-suggestion-item"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        addInterest(item);
                      }}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              )}
          </div>
          <div className="targeting-tags">
            {selectedInterests.map((interest, index) => (
              <span key={index} className="tag">
                {interest}
                <button
                  type="button"
                  className="tag-remove-btn"
                  onClick={() => removeInterest(index)}
                  aria-label="Remove interest"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* --- Bid Strategy Section --- */}
        <div className="config-section">
          <div className="section-header-ads">
            <Target size={16} color="#2563eb" />
            <h3 className="section-title-ads">Chiến lược giá thầu</h3>
          </div>
          <div className="field-group">
            <select
              className="bid-strategy-select"
              value={adset.bid_strategy || "LOWEST_COST_WITHOUT_CAP"}
              onChange={(e) => handleBidStrategyChange(e.target.value)}
            >
              <option value="LOWEST_COST_WITHOUT_CAP">Giá thầu tối thiểu</option>
              <option value="LOWEST_COST_WITH_BID_CAP">Giá thầu tối thiểu có giới hạn</option>
            </select>
          </div>

          {/* Chỉ hiển thị trường bid_amount khi bid_strategy là LOWEST_COST_WITH_BID_CAP */}
          {adset.bid_strategy === 'LOWEST_COST_WITH_BID_CAP' && (
            <div className="field-group">
              <label>Giới hạn giá thầu</label>
              <div className="bid-amount-container">
                <input
                  type="number"
                  value={adset.bid_amount || ''}
                  onChange={(e) => setAdset(prev => ({...prev, bid_amount: parseInt(e.target.value) || 0}))}
                  min="1000"
                  className="bid-strategy-input"
                  placeholder="1000"
                />
                <span className="currency-suffix">VNĐ</span>
              </div>
            </div>
          )}

          {/* Thêm thông báo giải thích cho từng loại bid strategy */}
          <div className="bid-strategy-info">
            {adset.bid_strategy === 'LOWEST_COST_WITHOUT_CAP' && (
              <div className="info-box">
                <i className="info-icon"></i>
                <span> Facebook sẽ tự động tối ưu hóa giá thầu để đạt chi phí thấp nhất.</span>
              </div>
            )}
            {adset.bid_strategy === 'LOWEST_COST_WITH_BID_CAP' && (
              <div className="info-box">
                <i className="info-icon"></i>
                <span>Bạn cần đặt giới hạn giá thầu tối đa Facebook có thể sử dụng.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const AdsetStep = forwardRef(AdsetStepInner);
export default AdsetStep;
