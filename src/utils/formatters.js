/**
 * Utility functions for formatting data
 */

/**
 * Format currency with proper symbols and formatting
 * @param {number} amount - The amount to format
 * @param {string} currency - Currency code (XAF, CAD, USD, EUR, etc.)
 * @param {Object} options - Additional formatting options
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'XAF', options = {}) => {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return `0.00 ${currency}`;
  }

  const {
    locale = 'fr-FR',
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
    displaySymbol = true,
  } = options;

  // Currency specific configurations
  const currencyConfig = {
    XAF: {
      symbol: 'FCFA',
      locale: 'fr-FR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    },
    CAD: {
      symbol: '$',
      locale: 'en-CA',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
    USD: {
      symbol: '$',
      locale: 'en-US',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
    EUR: {
      symbol: '€',
      locale: 'fr-FR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  };

  const config = currencyConfig[currency] || {
    symbol: currency,
    locale: 'fr-FR',
    minimumFractionDigits,
    maximumFractionDigits,
  };

  try {
    const formatter = new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: currency === 'XAF' ? 'XAF' : currency,
      minimumFractionDigits: config.minimumFractionDigits,
      maximumFractionDigits: config.maximumFractionDigits,
    });

    if (currency === 'XAF') {
      // For XAF, we want to display as "1,000 FCFA" instead of "XAF 1,000"
      const parts = formatter.formatToParts(amount);
      const numericValue = parts
        .filter(part => part.type !== 'currency')
        .map(part => part.value)
        .join('');
      return `${numericValue} ${config.symbol}`;
    }

    return formatter.format(amount);
  } catch (error) {
    console.error('Error formatting currency:', error);
    // Fallback formatting
    const formattedAmount = parseFloat(amount).toLocaleString(config.locale, {
      minimumFractionDigits: config.minimumFractionDigits,
      maximumFractionDigits: config.maximumFractionDigits,
    });
    
    if (displaySymbol) {
      return currency === 'XAF' 
        ? `${formattedAmount} ${config.symbol}`
        : `${config.symbol}${formattedAmount}`;
    }
    return `${formattedAmount} ${currency}`;
  }
};

/**
 * Format phone number
 * @param {string} phone - Phone number to format
 * @returns {string} Formatted phone number
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format based on length
  if (cleaned.length === 9) {
    // Cameroonian format: 6 12 34 56 78
    return cleaned.replace(/(\d{1})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
  } else if (cleaned.length === 10) {
    // International format with country code
    return cleaned.replace(/(\d{1})(\d{3})(\d{3})(\d{4})/, '+$1 ($2) $3-$4');
  } else if (cleaned.length === 11) {
    // Format with country code for Cameroon
    return cleaned.replace(/(\d{2})(\d{1})(\d{2})(\d{2})(\d{2})(\d{2})/, '+$1 $2 $3 $4 $5 $6');
  }
  
  return phone;
};

/**
 * Format date
 * @param {string|Date} date - Date to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted date
 */
export const formatDate = (date, options = {}) => {
  if (!date) return '';
  
  const {
    locale = 'fr-FR',
    format = 'full',
    timezone = 'UTC',
  } = options;

  const dateObj = date instanceof Date ? date : new Date(date);

  if (isNaN(dateObj.getTime())) return '';

  const formatOptions = {
    full: {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
    date: {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    },
    time: {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    },
    short: {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    },
    monthYear: {
      month: 'long',
      year: 'numeric',
    },
  };

  try {
    return dateObj.toLocaleDateString(locale, {
      ...formatOptions[format],
      timeZone: timezone,
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateObj.toISOString().split('T')[0];
  }
};

/**
 * Format number with thousands separator
 * @param {number} number - Number to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted number
 */
export const formatNumber = (number, options = {}) => {
  if (isNaN(number) || number === null || number === undefined) {
    return '0';
  }

  const {
    locale = 'fr-FR',
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
  } = options;

  try {
    return parseFloat(number).toLocaleString(locale, {
      minimumFractionDigits,
      maximumFractionDigits,
    });
  } catch (error) {
    console.error('Error formatting number:', error);
    return number.toString();
  }
};

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Format file size
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Mask sensitive information (like credit card numbers)
 * @param {string} value - Value to mask
 * @param {Object} options - Masking options
 * @returns {string} Masked value
 */
export const maskSensitiveInfo = (value, options = {}) => {
  if (!value) return '';
  
  const {
    type = 'default',
    visibleChars = 4,
    maskChar = '*',
  } = options;

  const str = String(value);
  
  switch (type) {
    case 'email':
      const [username, domain] = str.split('@');
      if (!username || !domain) return str;
      const maskedUsername = username.charAt(0) + maskChar.repeat(3) + username.charAt(username.length - 1);
      return `${maskedUsername}@${domain}`;
      
    case 'phone':
      return str.replace(/\d(?=\d{4})/g, maskChar);
      
    case 'card':
      const last4 = str.slice(-4);
      return maskChar.repeat(str.length - 4) + last4;
      
    default:
      if (str.length <= visibleChars * 2) return str;
      const firstPart = str.substring(0, visibleChars);
      const lastPart = str.substring(str.length - visibleChars);
      return firstPart + maskChar.repeat(str.length - visibleChars * 2) + lastPart;
  }
};

/**
 * Format percentage
 * @param {number} value - Percentage value (0-100)
 * @param {Object} options - Formatting options
 * @returns {string} Formatted percentage
 */
export const formatPercentage = (value, options = {}) => {
  if (isNaN(value) || value === null || value === undefined) {
    return '0%';
  }

  const {
    locale = 'fr-FR',
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
  } = options;

  try {
    const formatter = new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits,
      maximumFractionDigits,
    });
    
    return formatter.format(value / 100);
  } catch (error) {
    console.error('Error formatting percentage:', error);
    return `${parseFloat(value).toFixed(maximumFractionDigits)}%`;
  }
};

export default {
  formatCurrency,
  formatPhoneNumber,
  formatDate,
  formatNumber,
  truncateText,
  formatFileSize,
  maskSensitiveInfo,
  formatPercentage,
};