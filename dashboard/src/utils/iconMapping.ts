/**
 * Icon mapping utility for BOM weather icon codes
 * Feature: weather-dashboard
 *
 * Maps BOM icon_codes (1-18) to weather icon representations.
 * Icons are SVG files in src/assets/ named by weather description.
 *
 * Requirements: 6.1, 6.2
 */

// Import SVG icons
import sunny from '@/assets/sunny.svg';
import clear from '@/assets/clear.svg';
import partlyCloudy from '@/assets/partly-cloudy.svg';
import cloudy from '@/assets/cloudy.svg';
import fog from '@/assets/fog.svg';
import lightRain from '@/assets/light-rain.svg';
import showers from '@/assets/showers.svg';
import frost from '@/assets/frost.svg';
import snow from '@/assets/snow.svg';
import storms from '@/assets/storms.svg';
import lightShowers from '@/assets/light-showers.svg';
import heavyShowers from '@/assets/heavy-showers.svg';

/** Valid BOM icon codes range from 1 to 18 */
export const MIN_ICON_CODE = 1;
export const MAX_ICON_CODE = 18;

/** Default icon code used when the provided code is invalid or null */
export const DEFAULT_ICON_CODE = 3; // Partly cloudy as a neutral default

/**
 * BOM icon code to SVG icon mapping
 * 
 * BOM icon codes:
 * 1: Sunny
 * 2: Clear (night)
 * 3: Partly cloudy
 * 4: Cloudy
 * 5: Hazy (using cloudy)
 * 6: Haze (using cloudy)
 * 7: Fog
 * 8: Light rain
 * 9: Wind (using cloudy)
 * 10: Fog
 * 11: Showers
 * 12: Rain (using showers)
 * 13: Dust (using cloudy)
 * 14: Frost
 * 15: Snow
 * 16: Storm
 * 17: Light showers
 * 18: Heavy showers
 */
const iconPaths: Record<number, string> = {
  1: sunny,
  2: clear,
  3: partlyCloudy,
  4: cloudy,
  5: cloudy,      // Hazy - fallback to cloudy
  6: cloudy,      // Haze - fallback to cloudy
  7: fog,
  8: lightRain,
  9: cloudy,      // Wind - fallback to cloudy
  10: fog,
  11: showers,
  12: showers,    // Rain - use showers
  13: cloudy,     // Dust - fallback to cloudy
  14: frost,
  15: snow,
  16: storms,
  17: lightShowers,
  18: heavyShowers,
};

/**
 * Alt text descriptions for each icon code
 */
const iconDescriptions: Record<number, string> = {
  1: 'Sunny',
  2: 'Clear',
  3: 'Partly cloudy',
  4: 'Cloudy',
  5: 'Hazy',
  6: 'Haze',
  7: 'Fog',
  8: 'Light rain',
  9: 'Windy',
  10: 'Fog',
  11: 'Showers',
  12: 'Rain',
  13: 'Dusty',
  14: 'Frost',
  15: 'Snow',
  16: 'Storm',
  17: 'Light showers',
  18: 'Heavy showers',
};

/**
 * Checks if an icon code is within the valid BOM range (1-18)
 *
 * @param iconCode - The icon code to validate
 * @returns true if the code is valid, false otherwise
 */
export function isValidIconCode(iconCode: number | null | undefined): boolean {
  if (iconCode === null || iconCode === undefined) {
    return false;
  }
  return (
    Number.isInteger(iconCode) &&
    iconCode >= MIN_ICON_CODE &&
    iconCode <= MAX_ICON_CODE
  );
}

/**
 * Gets the icon path for a given BOM icon code.
 * Returns the default icon path if the code is invalid or null.
 *
 * @param iconCode - The BOM icon code (1-18) or null
 * @returns The path to the icon SVG file
 */
export function getIconPath(iconCode: number | null | undefined): string {
  const code = isValidIconCode(iconCode) ? iconCode! : DEFAULT_ICON_CODE;
  return iconPaths[code] || partlyCloudy;
}

/**
 * Gets the alt text description for a given BOM icon code.
 * Useful for accessibility.
 *
 * @param iconCode - The BOM icon code (1-18) or null
 * @returns A human-readable description of the weather condition
 */
export function getIconAltText(iconCode: number | null | undefined): string {
  if (!isValidIconCode(iconCode)) {
    return 'Unknown weather';
  }
  return iconDescriptions[iconCode!] || 'Unknown weather';
}
