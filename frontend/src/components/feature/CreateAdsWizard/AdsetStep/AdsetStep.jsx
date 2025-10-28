import {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useRef,
  useCallback,
} from "react";
import {
  MapPin,
  Users,
  Clock,
  Calendar,
  DollarSign,
  Target,
  Languages,
  MinusCircle,
  PlusCircle,
  Globe,
  Smartphone,
  MessageSquare,
  Phone,
  Circle,
  Search,
} from "lucide-react";
import { useOnClickOutside } from "../../../../utils/useOnClickOutside";
import { useToast } from "../../../../hooks/useToast";
import { validateNonEmpty } from "../../../../utils/validation";
import "./AdsetStep.css";
import { getNames } from "country-list";
import {
  getAdsetDefaultsByObjective,
  ADSET_CONFIG_BY_OBJECTIVE, // 1. Import cấu hình mới
} from "../../../../constants/wizardConstants";

// Labels cho billing_event
const BILLING_EVENT_LABELS = {
  IMPRESSIONS: "Hiển thị (lượt xem quảng cáo)",
  LINK_CLICKS: "Nhấp vào liên kết",
  APP_INSTALLS: "Cài đặt ứng dụng",
  VIDEO_VIEWS: "Lượt xem video",
  POST_ENGAGEMENT: "Tương tác bài viết",
  PAGE_LIKES: "Lượt thích trang",
  CONVERSIONS: "Chuyển đổi",
  LEAD_GENERATION: "Khách hàng tiềm năng",
  REACH: "Tiếp cận",
};

function AdsetStepInner({ adset, setAdset, objective, mode }, ref) {
  const [selectedTags, setSelectedTags] = useState(
    adset.targeting?.location ? [adset.targeting.location] : ["Viet Nam"]
  );
  const [trafficDestination, setTrafficDestination] = useState("WEBSITE");

  // Lấy các options dựa trên mục tiêu chiến dịch
  const getObjectiveOptions = useCallback(() => {
    // 3. Cập nhật hàm này để sử dụng cấu hình mới và có fallback an toàn
    const mapping =
      ADSET_CONFIG_BY_OBJECTIVE[objective] ||
      ADSET_CONFIG_BY_OBJECTIVE.AWARENESS;
    return mapping;
  }, [objective]);

  // Lấy các billing_event tương thích với mục tiêu chiến dịch
  const getCompatibleBillingEvents = useCallback(() => {
    const mapping = getObjectiveOptions();
    return mapping.billing_events || ["IMPRESSIONS"];
  }, [getObjectiveOptions]);

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

  // Auto-apply v23 defaults when campaign objective changes (limit to 3 objectives)
  useEffect(() => {
    if (!objective) return;
    const defaults = getAdsetDefaultsByObjective(objective);
    if (!defaults) return;
    setAdset((prev) => ({
      ...prev,
      optimization_goal: defaults.optimization_goal,
      billing_event: defaults.billing_event,
    }));
  }, [objective, setAdset]);
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
  useImperativeHandle(
    ref,
    () => ({
      validate: () => {
        let isValid = true;

        // Kiểm tra tên adset
        if (!adset?.name || adset.name.trim() === "") {
          toast.warning("Vui lòng nhập tên nhóm quảng cáo");
          isValid = false;
        }

        // Kiểm tra bid_amount khi chiến lược là LOWEST_COST_WITH_BID_CAP
        if (
          adset.bid_strategy === "LOWEST_COST_WITH_BID_CAP" &&
          (!adset.bid_amount || adset.bid_amount <= 0)
        ) {
          toast.warning("Vui lòng nhập giới hạn giá thầu hợp lệ");
          isValid = false;
        }

        // Đảm bảo có optimization_goal
        const okOptimization = !!adset?.optimization_goal;
        if (!okOptimization) {
          toast.error("Thiếu mục tiêu tối ưu hóa");
          // Tự động thiết lập giá trị mặc định nếu chưa có
          setAdset((prev) => ({
            ...prev,
            optimization_goal:
              getObjectiveOptions().optimization_goals[0]?.value || "REACH",
            billing_event: getCompatibleBillingEvents()[0] || "IMPRESSIONS",
          }));
        }

        // Đảm bảo có billing_event
        const okBillingEvent = !!adset?.billing_event;
        if (!okBillingEvent) {
          toast.error("Thiếu sự kiện tính phí");
        }

        return isValid && okOptimization && okBillingEvent;
      },
    }),
    [adset, toast, getObjectiveOptions, getCompatibleBillingEvents, setAdset]
  );

  // Thêm useEffect để đảm bảo các giá trị mặc định khi component mount
  useEffect(() => {
    const defaults = getAdsetDefaultsByObjective(objective);
    const compatibleBillingEvents = getCompatibleBillingEvents();

    setAdset((prev) => {
      const updates = {};
      if (prev.optimization_goal !== defaults.optimization_goal) {
        updates.optimization_goal = defaults.optimization_goal;
      }
      if (!compatibleBillingEvents.includes(prev.billing_event)) {
        updates.billing_event = compatibleBillingEvents[0];
      }
      return Object.keys(updates).length > 0 ? { ...prev, ...updates } : prev;
    });
  }, [objective, adset.optimization_goal, getCompatibleBillingEvents, getObjectiveOptions, setAdset]); // Re-run khi objective thay đổi

  // Thêm useEffect để theo dõi thay đổi của bid_strategy
  useEffect(() => {
    if (adset.bid_strategy !== "COST_CAP" && adset.bid_amount) {
      setAdset((prev) => {
        const newAdset = { ...prev };
        delete newAdset.bid_amount;
        return newAdset;
      });
    }
  }, [adset.bid_strategy, adset.bid_amount, setAdset]);

  // Thêm hàm xử lý thay đổi bid strategy
  const handleBidStrategyChange = (value) => {
    setAdset((prev) => {
      const updates = { bid_strategy: value };
      if (value === "COST_CAP") {
        updates.bid_amount = 10000; // Mặc định hoặc giá trị cuối
      } else {
        delete prev.bid_amount; // Xóa nếu không phải COST_CAP
      }
      return { ...prev, ...updates };
    });
  };

  // Handle traffic destination changes
  useEffect(() => {
    if (objective !== "TRAFFIC") {
      if (trafficDestination !== "WEBSITE") setTrafficDestination("WEBSITE");
      return;
    }

    let newPromotedObject = null;
    if (trafficDestination === "APP") {
      newPromotedObject = {
        application_id: adset.promoted_object?.application_id || "",
        object_store_url: adset.promoted_object?.object_store_url || "",
      };
    }

    setAdset((prev) => {
      if (JSON.stringify(prev.promoted_object) !== JSON.stringify(newPromotedObject)) {
        return {
          ...prev,
          promoted_object: newPromotedObject,
        };
      }
      return prev;
    });
  }, [trafficDestination, objective, setAdset, adset.promoted_object?.application_id, adset.promoted_object?.object_store_url]);

  return (
    <div className="adset-step">
      <div className="step-content">
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
        {/* Destination (only for TRAFFIC) */}
        {objective === "TRAFFIC" && (
          <div className="config-section">
            <div className="section-header-ads">
              <Target size={16} color="#2563eb" />
              <h3 className="section-title-ads">Đích đến</h3>
            </div>
            <select
              className="conversion-select"
              value={adset.conversion || "website"}
              onChange={(e) =>
                setAdset((prev) => ({ ...prev, conversion: e.target.value }))
              }
            >
              <option value="website">Trang web</option>
              <option value="destination">Đích đến của tin nhắn</option>
            </select>
          </div>
        )}

        {/* Performance Goal Section (drives optimization_goal by objective) */}
        <div className="config-section">
          <div className="section-header-ads">
            <Target size={16} color="#2563eb" />
            <h3 className="section-title-ads">Mục tiêu hiệu quả</h3>
          </div>
          <select
            className="performance-select"
            value={
              adset?.optimization_goal ||
              getObjectiveOptions().optimization_goals[0]?.value ||
              "REACH"
            }
            onChange={(e) => handleOptimizationGoalChange(e.target.value)}
          >
            {getObjectiveOptions().optimization_goals.map((goal) => (
              <option key={goal.value} value={goal.value}>
                {goal.label}
              </option>
            ))}
          </select>
        </div>

        {/* Billing (optimization is driven by Performance Goal above) */}
        <div className="config-section">
          <div className="section-header-ads">
            <Target size={16} color="#2563eb" />
            <h3 className="section-title-ads">Thanh toán</h3>
          </div>

          {/* billing_event = "Facebook thu tiền bạn theo sự kiện nào?"
              Sự kiện tính phí ?
            */}
          <div className="field-group">
            <label
              className="field-label"
              title="Facebook thu tiền bạn theo sự kiện nào?"
            >
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
              <small
                className="field-hint"
                style={{ color: "#3275db", fontSize: "12px" }}
              >
                Vui lòng chọn mục tiêu tối ưu hóa trước
              </small>
            )}
          </div>

          {/* conversion_event = "Facebook nên tối ưu quảng cáo hướng tới hành vi nào?" - chỉ hiển thị cho LEADS và CONVERSIONS */}
          {(objective === "LEADS" || objective === "CONVERSIONS") && (
            <div className="field-group">
              <label className="field-label">Sự kiện chuyển đổi</label>
              <select className="conversion-event-select">
                <option value="PURCHASE">Mua hàng</option>
                <option value="LEAD">Khách hàng tiềm năng</option>
                <option value="ADD_TO_CART">Thêm vào giỏ hàng</option>
              </select>
            </div>
          )}
        </div>

        {/* ============== NEW SECTION for Traffic Destination ============== */}
        {objective === "TRAFFIC" && (
          <div className="config-section">
            <div className="section-header-ads">
              <Target size={16} color="#2563eb" />
              <h3 className="section-title-ads">Vị trí chuyển đổi</h3>
            </div>
            <div className="field-group">
              <label className="field-label">
                Chọn nơi bạn muốn thúc đẩy lưu lượng truy cập
              </label>
              <div className="traffic-destination-options">
                {/* Option for Website */}
                <label
                  className={`traffic-option ${
                    trafficDestination === "WEBSITE" ? "selected" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="trafficDestination"
                    value="WEBSITE"
                    checked={trafficDestination === "WEBSITE"}
                    onChange={(e) => setTrafficDestination(e.target.value)}
                  />
                  <div className="traffic-option-content">
                    <Globe size={20} />
                    <span>Trang web</span>
                  </div>
                </label>
                {/* Option for App */}
                <label
                  className={`traffic-option ${
                    trafficDestination === "APP" ? "selected" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="trafficDestination"
                    value="APP"
                    checked={trafficDestination === "APP"}
                    onChange={(e) => setTrafficDestination(e.target.value)}
                  />
                  <div className="traffic-option-content">
                    <Smartphone size={20} />
                    <span>Ứng dụng</span>
                  </div>
                </label>
                {/* Option for Messaging */}
                <label
                  className={`traffic-option ${
                    trafficDestination === "MESSAGING" ? "selected" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="trafficDestination"
                    value="MESSAGING"
                    checked={trafficDestination === "MESSAGING"}
                    onChange={(e) => setTrafficDestination(e.target.value)}
                  />
                  <div className="traffic-option-content">
                    <MessageSquare size={20} />
                    <span>Ứng dụng nhắn tin</span>
                  </div>
                </label>
                {/* Option for Calls */}
                <label
                  className={`traffic-option ${
                    trafficDestination === "CALLS" ? "selected" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="trafficDestination"
                    value="CALLS"
                    checked={trafficDestination === "CALLS"}
                    onChange={(e) => setTrafficDestination(e.target.value)}
                  />
                  <div className="traffic-option-content">
                    <Phone size={20} />
                    <span>Cuộc gọi</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Conditional fields for APP destination */}
            {trafficDestination === "APP" && (
              <div className="app-details-fields">
                <div className="field-group">
                  <label className="field-label">ID ứng dụng</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Nhập ID ứng dụng của bạn"
                    value={adset.promoted_object?.application_id || ""}
                    onChange={(e) =>
                      setAdset((prev) => ({
                        ...prev,
                        promoted_object: {
                          ...prev.promoted_object,
                          application_id: e.target.value,
                        },
                      }))
                    }
                  />
                </div>
                <div className="field-group">
                  <label className="field-label">URL App Store</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="https://..."
                    value={adset.promoted_object?.object_store_url || ""}
                    onChange={(e) =>
                      setAdset((prev) => ({
                        ...prev,
                        promoted_object: {
                          ...prev.promoted_object,
                          object_store_url: e.target.value,
                        },
                      }))
                    }
                  />
                </div>
              </div>
            )}
          </div>
        )}

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
              {mode === "edit" && (
                <span className="field-locked-badge">🔒 Không thể sửa</span>
              )}
            </div>
            <div className="datetime-overlay-wrapper">
              <input
                type="datetime-local"
                className="datetime-input-ads datetime-input-ads--masked"
                value={toInputDateTime(adset.start_time || adset.startDate)}
                onChange={(e) =>
                  setAdset((prev) => ({
                    ...prev,
                    start_time: e.target.value,
                    startDate: e.target.value,
                    schedule: {
                      ...prev.schedule,
                      start: e.target.value,
                    },
                  }))
                }
                disabled={mode === "edit"} // ✅ DISABLE khi edit
                title={
                  mode === "edit"
                    ? "Bạn không thể sửa thời gian bắt đầu của AdSet đã tạo"
                    : ""
                }
              />
              <span className="datetime-overlay">
                {formatDisplay(adset.start_time || adset.startDate) ||
                  new Date().toISOString().split("T")[0] + " 00:00"}
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
                  setAdset((prev) => ({
                    ...prev,
                    end_time: e.target.value,
                    endDate: e.target.value,
                    schedule: {
                      ...prev.schedule,
                      end: e.target.value, // ✅ THÊM: Cập nhật schedule.end
                    },
                  }))
                }
              />
              <span className="datetime-overlay">
                {formatDisplay(adset.end_time || adset.endDate) ||
                  new Date().toISOString().split("T")[0] + " 00:00"}
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
              <option value="LOWEST_COST_WITHOUT_CAP">
                Giá thầu tối thiểu
              </option>
              <option value="LOWEST_COST_WITH_BID_CAP">
                Giá thầu tối thiểu có giới hạn
              </option>
            </select>
          </div>

          {/* Chỉ hiển thị trường bid_amount khi bid_strategy là LOWEST_COST_WITH_BID_CAP */}
          {adset.bid_strategy === "LOWEST_COST_WITH_BID_CAP" && (
            <div className="field-group">
              <label>Giới hạn giá thầu</label>
              <div className="bid-amount-container">
                <input
                  type="number"
                  value={adset.bid_amount || ""}
                  onChange={(e) =>
                    setAdset((prev) => ({
                      ...prev,
                      bid_amount: parseInt(e.target.value) || 0,
                    }))
                  }
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
            {adset.bid_strategy === "LOWEST_COST_WITHOUT_CAP" && (
              <div className="info-box">
                <i className="info-icon"></i>
                <span>
                  {" "}
                  Facebook sẽ tự động tối ưu hóa giá thầu để đạt chi phí thấp
                  nhất.
                </span>
              </div>
            )}
            {adset.bid_strategy === "LOWEST_COST_WITH_BID_CAP" && (
              <div className="info-box">
                <i className="info-icon"></i>
                <span>
                  Bạn cần đặt giới hạn giá thầu tối đa Facebook có thể sử dụng.
                </span>
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
