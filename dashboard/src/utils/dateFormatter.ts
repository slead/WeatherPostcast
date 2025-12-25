/**
 * Date formatting utilities for the Weather Dashboard
 * Feature: weather-dashboard
 *
 * Handles formatting of ISO date strings to human-readable format
 * Requirements: 8.5
 */

/**
 * Days of the week for display
 */
const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

/**
 * Short days of the week for compact display
 */
const DAYS_OF_WEEK_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Months for display
 */
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/**
 * Short months for compact display
 */
const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/**
 * Validates that a string is in ISO date format (YYYY-MM-DD)
 */
export function isValidISODate(dateString: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return false;
  }

  const [year, month, day] = dateString.split('-').map(Number);

  // Basic validation
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  // Create date and verify it's valid
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

/**
 * Parses an ISO date string (YYYY-MM-DD) to a Date object
 * Returns null if the date string is invalid
 */
export function parseISODate(dateString: string): Date | null {
  if (!isValidISODate(dateString)) {
    return null;
  }

  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Format options for date display
 */
export interface FormatDateOptions {
  /** Include day of week (default: true) */
  includeDay?: boolean;
  /** Use short format for day and month (default: false) */
  short?: boolean;
  /** Include year (default: true) */
  includeYear?: boolean;
}

/**
 * Formats an ISO date string (YYYY-MM-DD) to a human-readable format
 * Requirements: 8.5 - Format dates in a human-readable format
 *
 * @param dateString - ISO date string in YYYY-MM-DD format
 * @param options - Formatting options
 * @returns Human-readable date string, or the original string if invalid
 *
 * @example
 * formatDate('2025-12-25') // "Thursday, 25 December 2025"
 * formatDate('2025-12-25', { short: true }) // "Thu, 25 Dec 2025"
 * formatDate('2025-12-25', { includeDay: false }) // "25 December 2025"
 */
export function formatDate(
  dateString: string,
  options: FormatDateOptions = {}
): string {
  const { includeDay = true, short = false, includeYear = true } = options;

  const date = parseISODate(dateString);
  if (!date) {
    // Return original string if invalid
    return dateString;
  }

  const dayOfWeek = short
    ? DAYS_OF_WEEK_SHORT[date.getDay()]
    : DAYS_OF_WEEK[date.getDay()];
  const month = short
    ? MONTHS_SHORT[date.getMonth()]
    : MONTHS[date.getMonth()];
  const dayOfMonth = date.getDate();
  const year = date.getFullYear();

  const parts: string[] = [];

  if (includeDay) {
    parts.push(`${dayOfWeek},`);
  }

  parts.push(`${dayOfMonth} ${month}`);

  if (includeYear) {
    parts.push(`${year}`);
  }

  return parts.join(' ');
}

/**
 * Formats a date relative to today (e.g., "Today", "Tomorrow", "Yesterday")
 *
 * @param dateString - ISO date string in YYYY-MM-DD format
 * @param referenceDate - Reference date for comparison (defaults to today)
 * @returns Relative date string or formatted date if not within range
 */
export function formatRelativeDate(
  dateString: string,
  referenceDate?: Date
): string {
  const date = parseISODate(dateString);
  if (!date) {
    return dateString;
  }

  const today = referenceDate ?? new Date();
  today.setHours(0, 0, 0, 0);

  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  switch (diffDays) {
    case -1:
      return 'Yesterday';
    case 0:
      return 'Today';
    case 1:
      return 'Tomorrow';
    default:
      return formatDate(dateString, { short: true });
  }
}

/**
 * Formats a days-ahead value to a human-readable string
 *
 * @param daysAhead - Number of days ahead the prediction was made
 * @returns Human-readable string describing when the prediction was made
 */
export function formatDaysAhead(daysAhead: number): string {
  if (daysAhead === 0) {
    return 'Same day';
  }
  if (daysAhead === 1) {
    return '1 day ahead';
  }
  return `${daysAhead} days ahead`;
}
