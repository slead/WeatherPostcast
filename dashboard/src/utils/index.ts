/**
 * Utility exports for the Weather Dashboard
 * Feature: weather-dashboard
 */

export {
  parseLocationData,
  safeParseLocationData,
  validateLocationData,
  type ValidationResult,
} from './dataParser';

export {
  formatDate,
  formatRelativeDate,
  formatDaysAhead,
  parseISODate,
  isValidISODate,
  type FormatDateOptions,
} from './dateFormatter';

export {
  isValidIconCode,
  getIconPath,
  getIconAltText,
  MIN_ICON_CODE,
  MAX_ICON_CODE,
  DEFAULT_ICON_CODE,
} from './iconMapping';
