/**
 * Application configuration
 * Handles base path for GitHub Pages deployment
 */

// Vite's BASE_URL includes trailing slash, normalize it
const baseUrl = import.meta.env.BASE_URL || '/';

/**
 * Base path for data files (cities.geojson, forecast JSON files)
 */
export const DATA_BASE_PATH = `${baseUrl}data`.replace(/\/+/g, '/');
