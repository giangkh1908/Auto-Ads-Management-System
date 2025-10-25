/**
 * Translation utilities - sử dụng constants đã có sẵn
 * Chuyển đổi các giá trị Facebook Ads sang tiếng Việt
 */

import {
  OBJECTIVE_LABELS_VN,
  GENDER_LABELS_VN,
  COUNTRY_LABELS_VN,
  OPTIMIZATION_GOAL_LABELS_VN,
} from '../constants/wizardConstants';

/**
 * Chuyển đổi objective sang tiếng Việt
 * @param {string} objective - Facebook objective value
 * @returns {string} Vietnamese label
 */
export const translateObjective = (objective) => {
  if (!objective) return 'Chưa thiết lập';
  return OBJECTIVE_LABELS_VN[objective] || objective;
};

/**
 * Chuyển đổi optimization goal sang tiếng Việt
 * @param {string} goal - Optimization goal value
 * @returns {string} Vietnamese label
 */
export const translateOptimizationGoal = (goal) => {
  if (!goal) return '';
  return OPTIMIZATION_GOAL_LABELS_VN[goal] || goal;
};

/**
 * Chuyển đổi giới tính sang tiếng Việt
 * @param {Array|number|string} genders - Gender array, number or string
 * @returns {string} Vietnamese label
 */
export const translateGenders = (genders) => {
  if (!genders) return '';
  
  if (Array.isArray(genders)) {
    return genders
      .map(g => GENDER_LABELS_VN[g] || g)
      .join(', ');
  }
  
  return GENDER_LABELS_VN[genders] || genders;
};

/**
 * Chuyển đổi quốc gia sang tiếng Việt
 * @param {Array} countries - Country codes array
 * @returns {string} Vietnamese labels
 */
export const translateCountries = (countries) => {
  if (!countries || !Array.isArray(countries)) return '';
  
  return countries
    .map(c => COUNTRY_LABELS_VN[c] || c)
    .join(', ');
};

/**
 * Format targeting object thành array các dòng text tiếng Việt
 * @param {Object} targeting - Targeting object from adset
 * @returns {Array<string>|string} Array of formatted targeting info or fallback string
 */
export const formatTargetingVN = (targeting) => {
  if (!targeting || Object.keys(targeting).length === 0) {
    return 'Chưa thiết lập';
  }

  const parts = [];

  // Giới tính
  if (targeting.genders) {
    parts.push(`Giới tính: ${translateGenders(targeting.genders)}`);
  }

  // Độ tuổi
  if (targeting.age_min && targeting.age_max) {
    parts.push(`Tuổi: ${targeting.age_min}-${targeting.age_max}`);
  }

  // Vị trí
  if (targeting.geo_locations?.countries) {
    parts.push(`Vị trí: ${translateCountries(targeting.geo_locations.countries)}`);
  }

  // Ngôn ngữ
  if (targeting.languages && targeting.languages.length > 0) {
    parts.push(`Ngôn ngữ: ${targeting.languages.join(', ')}`);
  }

  return parts.length > 0 ? parts : ['Chưa thiết lập'];
};

