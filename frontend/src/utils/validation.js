// Basic reusable validators for forms

export const validateRequired = (value) => {
  return typeof value === 'string' ? value.trim().length > 0 : !!value
}

export const validateEmail = (value) => {
  if (!validateRequired(value)) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value).trim())
}

export const validatePhone = (value) => {
  if (!value) return true // optional by default
  return /^(\+)?\d{9,11}$/.test(String(value).trim())
}

export const validateMinLength = (value, min) => {
  if (!validateRequired(value)) return false
  return String(value).trim().length >= min
}

export const validatePassword = (value, { minLength = 6 } = {}) => {
  return validateMinLength(value, minLength)
}

export const validateFullName = (value) => {
  return validateMinLength(value, 2)
}

export const buildErrors = (fields) => {
  // fields: Array of { key, valid, message }
  const errors = {}
  for (const f of fields) {
    if (!f.valid) errors[f.key] = f.message
  }
  return errors
}

// ===== App-specific helpers with toast =====
// Lưu ý: truyền vào đối tượng toast từ hook useToast() khi sử dụng

export const validateNonEmpty = (value, label, toast) => {
  const ok = validateRequired(value)
  if (!ok && toast) {
    toast.warning(`Thiếu thông tin ${label}`, {
      description: `Vui lòng nhập ${label}`
    })
  }
  return ok
}

export const validateObjectiveSelected = (objective, toast) => {
  const allowed = [
    'AWARENESS',
    'TRAFFIC',
    'ENGAGEMENT',
    'LEADS',
    'APP_PROMOTION',
    'SALES',
  ]
  const ok = allowed.includes(objective)
  if (!ok && toast) {
    toast.warning('Chưa chọn mục tiêu chiến dịch', {
      description: 'Vui lòng chọn một mục tiêu trước khi tiếp tục'
    })
  }
  return ok
}

export const validateCampaignStep = (campaign, toast) => {
  if (!campaign) {
    if (toast) toast.warning('Thiếu dữ liệu chiến dịch')
    return false
  }
  const nameOk = validateNonEmpty(campaign.name, 'tên chiến dịch', toast)
  const pageOk = !!campaign.facebookPageId
  if (!pageOk && toast) {
    toast.warning('Chưa chọn Trang Facebook', {
      description: 'Vui lòng chọn Trang Facebook cho chiến dịch'
    })
  }
  return nameOk && pageOk
}


