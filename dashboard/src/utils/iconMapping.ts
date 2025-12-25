/**
 * Icon mapping utility for BOM weather icon codes
 * Feature: weather-dashboard
 *
 * Maps BOM icon_codes (1-18) to weather icon representations.
 * Icons are expected to be named {icon_code}.png in the public folder.
 *
 * Requirements: 6.1, 6.2
 */

/**
 * BOM icon code descriptions for reference:
 * 1: Sunny
 * 2: Clear (night)
 * 3: Partly cloudy
 * 4: Cloudy
 * 5: Hazy (not commonly used)
 * 6: Haze
 * 7: Fog (not commonly used)
 * 8: Light rain
 * 9: Wind
 * 10: Fog
 * 11: Showers
 * 12: Rain
 * 13: Dust
 * 14: Frost
 * 15: Snow
 * 16: Storm
 * 17: Light showers
 * 18: Heavy showers
 */

/** Valid BOM icon codes range from 1 to 18 */
export const MIN_ICON_CODE = 1;
export const MAX_ICON_CODE = 18;

/** Default icon code used when the provided code is invalid or null */
export const DEFAULT_ICON_CODE = 3; // Partly cloudy as a neutral default

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
 * @returns The path to the icon image file
 */
export function getIconPath(iconCode: number | null | undefined): string {
  const code = isValidIconCode(iconCode) ? iconCode : DEFAULT_ICON_CODE;
  return `/${code}.png`;
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

  const descriptions: Record<number, string> = {
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

  return descriptions[iconCode!] || 'Unknown weather';
}
