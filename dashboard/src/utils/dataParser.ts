/**
 * Data parsing utilities for the Weather Dashboard
 * Feature: weather-dashboard
 *
 * Handles parsing and validation of location JSON data
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */

import type {
  LocationData,
  ForecastRecord,
  PredictionEntry,
} from '../types';

/**
 * Validation result type
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates that a value is a non-empty string
 */
function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Validates that a value is a valid timezone string
 */
function isValidTimezone(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Validates that a value is a number or null
 */
function isNumberOrNull(value: unknown): value is number | null {
  return value === null || typeof value === 'number';
}

/**
 * Validates that a value is a string or null
 */
function isStringOrNull(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

/**
 * Validates a PredictionEntry object
 * Requirements: 8.3 - Handle null values for optional fields without errors
 */
function validatePredictionEntry(entry: unknown): ValidationResult {
  const errors: string[] = [];

  if (typeof entry !== 'object' || entry === null) {
    return { valid: false, errors: ['Prediction entry must be an object'] };
  }

  const pred = entry as Record<string, unknown>;

  if (!isNumberOrNull(pred.icon_code)) {
    errors.push('icon_code must be a number or null');
  }

  if (!isNumberOrNull(pred.temp_min)) {
    errors.push('temp_min must be a number or null');
  }

  if (!isNumberOrNull(pred.temp_max)) {
    errors.push('temp_max must be a number or null');
  }

  if (!isStringOrNull(pred.precipitation_prob)) {
    errors.push('precipitation_prob must be a string or null');
  }

  if (!isStringOrNull(pred.precis)) {
    errors.push('precis must be a string or null');
  }

  if (!isStringOrNull(pred.forecast)) {
    errors.push('forecast must be a string or null');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates a ForecastRecord object
 * Requirements: 8.2 - Correctly interpret integer keys as days-ahead values
 */
function validateForecastRecord(record: unknown): ValidationResult {
  const errors: string[] = [];

  if (typeof record !== 'object' || record === null) {
    return { valid: false, errors: ['Forecast record must be an object'] };
  }

  const rec = record as Record<string, unknown>;

  for (const [key, value] of Object.entries(rec)) {
    // Validate that keys are numeric strings (days-ahead values)
    const daysAhead = parseInt(key, 10);
    if (isNaN(daysAhead) || daysAhead < 0) {
      errors.push(`Invalid days-ahead key: ${key}`);
      continue;
    }

    const predResult = validatePredictionEntry(value);
    if (!predResult.valid) {
      errors.push(`Invalid prediction at days-ahead ${key}: ${predResult.errors.join(', ')}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates the forecasts object
 */
function validateForecasts(forecasts: unknown): ValidationResult {
  const errors: string[] = [];

  if (typeof forecasts !== 'object' || forecasts === null) {
    return { valid: false, errors: ['forecasts must be an object'] };
  }

  const fc = forecasts as Record<string, unknown>;

  for (const [dateKey, record] of Object.entries(fc)) {
    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
      errors.push(`Invalid date format: ${dateKey}`);
      continue;
    }

    const recordResult = validateForecastRecord(record);
    if (!recordResult.valid) {
      errors.push(`Invalid forecast record for ${dateKey}: ${recordResult.errors.join(', ')}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates the structure of LocationData
 * Requirements: 8.4 - Validate the structure matches the expected schema
 */
export function validateLocationData(data: unknown): ValidationResult {
  const errors: string[] = [];

  if (typeof data !== 'object' || data === null) {
    return { valid: false, errors: ['Data must be an object'] };
  }

  const obj = data as Record<string, unknown>;

  // Validate required string fields
  // Requirements: 8.1 - Extract product_id, city_name, state, timezone, and forecasts fields
  if (!isNonEmptyString(obj.product_id)) {
    errors.push('product_id must be a non-empty string');
  }

  if (!isNonEmptyString(obj.city_name)) {
    errors.push('city_name must be a non-empty string');
  }

  if (!isNonEmptyString(obj.state)) {
    errors.push('state must be a non-empty string');
  }

  if (!isValidTimezone(obj.timezone)) {
    errors.push('timezone must be a valid string');
  }

  // Validate forecasts object
  if (!('forecasts' in obj)) {
    errors.push('forecasts field is required');
  } else {
    const forecastsResult = validateForecasts(obj.forecasts);
    if (!forecastsResult.valid) {
      errors.push(...forecastsResult.errors);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Parses a PredictionEntry from raw data
 * Requirements: 8.3 - Handle null values for optional fields without errors
 */
function parsePredictionEntry(data: Record<string, unknown>): PredictionEntry {
  return {
    icon_code: isNumberOrNull(data.icon_code) ? data.icon_code : null,
    temp_min: isNumberOrNull(data.temp_min) ? data.temp_min : null,
    temp_max: isNumberOrNull(data.temp_max) ? data.temp_max : null,
    precipitation_prob: isStringOrNull(data.precipitation_prob) ? data.precipitation_prob : null,
    precis: isStringOrNull(data.precis) ? data.precis : null,
    forecast: isStringOrNull(data.forecast) ? data.forecast : null,
  };
}

/**
 * Parses a ForecastRecord from raw data
 * Requirements: 8.2 - Correctly interpret integer keys as days-ahead values
 */
function parseForecastRecord(data: Record<string, unknown>): ForecastRecord {
  const record: ForecastRecord = {};

  for (const [key, value] of Object.entries(data)) {
    const daysAhead = parseInt(key, 10);
    if (!isNaN(daysAhead) && daysAhead >= 0 && typeof value === 'object' && value !== null) {
      record[key] = parsePredictionEntry(value as Record<string, unknown>);
    }
  }

  return record;
}

/**
 * Parses JSON data into LocationData
 * Requirements: 8.1, 8.2, 8.3, 8.4
 *
 * @param data - Raw JSON data to parse
 * @returns LocationData object
 * @throws Error if data is invalid
 */
export function parseLocationData(data: unknown): LocationData {
  // Validate the data structure first
  const validation = validateLocationData(data);
  if (!validation.valid) {
    throw new Error(`Invalid location data: ${validation.errors.join('; ')}`);
  }

  const obj = data as Record<string, unknown>;
  const rawForecasts = obj.forecasts as Record<string, unknown>;

  // Parse forecasts
  const forecasts: Record<string, ForecastRecord> = {};
  for (const [dateKey, record] of Object.entries(rawForecasts)) {
    if (typeof record === 'object' && record !== null) {
      forecasts[dateKey] = parseForecastRecord(record as Record<string, unknown>);
    }
  }

  return {
    product_id: obj.product_id as string,
    city_name: obj.city_name as string,
    state: obj.state as string,
    timezone: obj.timezone as string,
    forecasts,
  };
}

/**
 * Safely parses JSON string to LocationData
 * Returns null if parsing fails instead of throwing
 *
 * @param jsonString - JSON string to parse
 * @returns LocationData or null if invalid
 */
export function safeParseLocationData(jsonString: string): LocationData | null {
  try {
    const data = JSON.parse(jsonString);
    return parseLocationData(data);
  } catch {
    return null;
  }
}
