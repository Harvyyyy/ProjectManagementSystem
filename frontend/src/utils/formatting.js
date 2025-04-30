/**
 * Formats a number as currency.
 * @param {number | string | null | undefined} amount The amount to format.
 * @param {string} currencyCode The ISO currency code (e.g., 'USD', 'EUR', 'PHP'). Defaults to 'PHP'.
 * @param {string} locale The locale string (e.g., 'en-US', 'en-PH'). Defaults to 'en-US'.
 * @returns {string} Formatted currency string, or an empty string/placeholder if amount is invalid.
 */
export const formatCurrency = (amount, currencyCode = 'PHP', locale = 'en-US') => { // Defaulting to PHP based on previous code
  const numericAmount = parseFloat(amount);
  if (amount === null || amount === undefined || isNaN(numericAmount)) {
      return ''; // Or return a placeholder like 'N/A' or '-'
  }

  try {
      return new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: currencyCode,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
      }).format(numericAmount);
  } catch (error) {
      console.error("Currency formatting error:", error);
      // Fallback for invalid currency code
      return `${numericAmount.toFixed(2)} ${currencyCode}`;
  }
};

/**
* Formats a date string or Date object.
* Example placeholder - adjust options as needed.
* @param {string | Date | null | undefined} dateInput The date to format.
* @param {object} options Intl.DateTimeFormat options.
* @returns {string} Formatted date string or 'N/A'.
*/
export const formatDate = (dateInput, options = { year: 'numeric', month: 'short', day: 'numeric' }) => {
  if (!dateInput) return 'N/A';
  try {
      const date = new Date(dateInput);
      // Check if date is valid after parsing
      if (isNaN(date.getTime())) {
           return 'Invalid Date';
      }
      return new Intl.DateTimeFormat('en-US', options).format(date);
  } catch (error) {
      console.error("Date formatting error:", error);
      return 'N/A';
  }
};


/**
* Formats a duration given in total minutes into a readable string (e.g., "1h 30m").
* @param {number | string | null | undefined} totalMinutes The duration in minutes.
* @returns {string} Formatted duration string, or '0m' if input is invalid or zero.
*/
export const formatDuration = (totalMinutes) => {
const minutesValue = totalMinutes === null || totalMinutes === undefined ? 0 : parseInt(totalMinutes, 10);

if (isNaN(minutesValue) || minutesValue <= 0) {
  return '0m';
}

const minutes = minutesValue % 60;
const hours = Math.floor(minutesValue / 60);

let result = '';
if (hours > 0) {
  result += `${hours}h`;
}
if (minutes > 0) {
  result += `${hours > 0 ? ' ' : ''}${minutes}m`; // Add space if hours exist
}

return result || '0m'; // Fallback just in case
};

// Add any other utility functions you might have here...