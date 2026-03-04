/**
 * Formats a phone number string into Vietnamese format: 0xxx xxx xxx or similar.
 * @param {string} value - The raw phone number string.
 * @returns {string} - The formatted phone number.
 */
export const formatPhoneNumber = (value) => {
  // Remove all non-digit characters
  const phoneNumber = value.replace(/\D/g, "");

  // Limit to 11 digits (for Vietnamese phone numbers)
  const limitedNumber = phoneNumber.slice(0, 11);

  // Format: 0xxx xxx xxx
  if (limitedNumber.length <= 4) {
    return limitedNumber;
  } else if (limitedNumber.length <= 7) {
    return `${limitedNumber.slice(0, 4)} ${limitedNumber.slice(4)}`;
  } else {
    return `${limitedNumber.slice(0, 4)} ${limitedNumber.slice(4, 7)} ${limitedNumber.slice(7)}`;
  }
};
