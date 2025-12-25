/**
 * TypeScript type definitions for the Weather Dashboard
 * Feature: weather-dashboard
 */

// =============================================================================
// GeoJSON and City Types (Requirements 1.1, 1.2)
// =============================================================================

/**
 * GeoJSON Point geometry for city locations
 * Coordinates are [longitude, latitude] per GeoJSON spec
 */
export interface CityGeometry {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
}

/**
 * Properties for each city feature
 */
export interface CityProperties {
  city_name: string;
  state: string;
  product_id: string;
}

/**
 * GeoJSON Feature representing a single city
 */
export interface CityFeature {
  type: "Feature";
  geometry: CityGeometry;
  properties: CityProperties;
}

/**
 * GeoJSON FeatureCollection containing all cities
 */
export interface CitiesGeoJSON {
  type: "FeatureCollection";
  features: CityFeature[];
}

// =============================================================================
// Forecast Data Types (Requirements 8.1, 8.2)
// =============================================================================

/**
 * A single prediction entry containing weather forecast data
 * All fields except icon_code can be null
 */
export interface PredictionEntry {
  icon_code: number | null;
  temp_min: number | null;
  temp_max: number | null;
  precipitation_prob: string | null;
  precis: string | null;
  forecast: string | null;
}

/**
 * A forecast record for a single date
 * Keys are days-ahead values as strings ("0", "1", "2", etc.)
 */
export interface ForecastRecord {
  [daysAhead: string]: PredictionEntry;
}

/**
 * Complete location data for a city including all forecasts
 */
export interface LocationData {
  product_id: string;
  city_name: string;
  state: string;
  timezone: string;
  forecasts: Record<string, ForecastRecord>; // keyed by ISO date string (YYYY-MM-DD)
}

// =============================================================================
// Parsed/Display Types (for UI components)
// =============================================================================

/**
 * Parsed prediction with numeric days-ahead value
 */
export interface ParsedPrediction {
  daysAhead: number;
  iconCode: number | null;
  tempMin: number | null;
  tempMax: number | null;
  precipitationProb: string | null;
  precis: string | null;
  forecast: string | null;
}

/**
 * Parsed forecast for display purposes
 */
export interface ParsedForecast {
  date: Date;
  dateString: string;
  predictions: ParsedPrediction[];
}

// =============================================================================
// Australian State Type
// =============================================================================

/**
 * Valid Australian state/territory abbreviations
 */
export type AustralianState = "NSW" | "VIC" | "QLD" | "SA" | "WA" | "TAS" | "NT" | "ACT";
