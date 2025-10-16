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


