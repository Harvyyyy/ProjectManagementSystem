// src/utils/formatting.js

/**
 * Formats a number as currency.
 * @param {number|string|null|undefined} value The numeric value to format.
 * @param {string} [currency='USD'] The ISO currency code (e.g., 'USD', 'EUR').
 * @param {string} [locale='en-US'] The locale string (e.g., 'en-US', 'de-DE').
 * @returns {string} Formatted currency string or 'N/A' if value is invalid.
 */
export const formatCurrency = (value, currency = 'USD', locale = 'en-US') => {
    // ... (rest of the function code from previous answer)
    const number = parseFloat(value);
    if (value === null || value === undefined || isNaN(number)) {
       return 'N/A';
    }
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(number);
    } catch (error) {
      console.error("Currency formatting error:", error);
      return `${currency} ${number.toFixed(2)}`;
    }
  };
  
  /**
   * Formats a date string or Date object into a locale-specific date string.
   * @param {string|Date|null|undefined} dateInput The date string or object.
   * @param {string} [locale='en-CA'] The locale string (e.g., 'en-CA' for YYYY-MM-DD).
   * @returns {string} Formatted date string or 'N/A'.
   */
  export const formatDate = (dateInput, locale = 'en-CA') => {
    // ... (rest of the function code from previous answer)
     if (!dateInput) {
      return 'N/A';
    }
    try {
      const date = new Date(dateInput);
       if (isNaN(date.getTime())) {
           return 'Invalid Date';
       }
      return new Intl.DateTimeFormat(locale).format(date);
    } catch (error) {
      console.error("Date formatting error:", error);
      return 'Invalid Date';
    }
  };