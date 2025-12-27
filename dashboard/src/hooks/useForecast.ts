/**
 * useForecast hook for the Weather Dashboard
 * Feature: weather-dashboard
 *
 * Fetches and parses forecast data for a specific city
 * Requirements: 5.2, 5.3, 5.4
 */

import { useState, useEffect, useCallback } from 'react';
import type { LocationData } from '../types';
import { parseLocationData } from '../utils/dataParser';

/**
 * Result type for the useForecast hook
 */
export interface UseForecastResult {
  /** Parsed location data or null if not loaded */
  data: LocationData | null;
  /** Loading state - true while fetching */
  loading: boolean;
  /** Error state - contains error if fetch or parse failed */
  error: Error | null;
  /** Function to manually refetch the data */
  refetch: () => void;
}

/**
 * Options for the useForecast hook
 */
export interface UseForecastOptions {
  /** Base path for data files (defaults to '/data') */
  basePath?: string;
}

/**
 * Hook to fetch forecast data for a specific city
 *
 * Requirements:
 * - 5.2: Fetch only that city's forecast data on demand
 * - 5.3: Display a loading indicator (via loading state)
 * - 5.4: Display an error message and allow retry (via error state and refetch)
 *
 * @param state - Australian state abbreviation (e.g., 'NSW', 'VIC')
 * @param cityName - City name (e.g., 'Sydney', 'Melbourne')
 * @param options - Optional configuration
 * @returns UseForecastResult with data, loading, error, and refetch
 */
export function useForecast(
  state: string,
  cityName: string,
  options: UseForecastOptions = {}
): UseForecastResult {
  const { basePath = '/data' } = options;

  const [data, setData] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [fetchTrigger, setFetchTrigger] = useState(0);

  /**
   * Refetch function to manually trigger a new fetch
   * Requirements: 5.4 - Allow retry on error
   */
  const refetch = useCallback(() => {
    setFetchTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    // Skip fetch if state or cityName is empty
    if (!state || !cityName) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    async function fetchForecast() {
      try {
        setLoading(true);
        setError(null);
        // Don't clear data here - keep previous data visible during transition

        // Construct the URL for the city's forecast data
        // Format: /data/{state}/{cityName}.json
        const url = `${basePath}/${encodeURIComponent(state)}/${encodeURIComponent(cityName)}.json`;

        const response = await fetch(url);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error(`Forecast data not found for ${cityName}, ${state}`);
          }
          throw new Error(
            `Failed to load forecast: ${response.status} ${response.statusText}`
          );
        }

        const rawData = await response.json();

        if (!cancelled) {
          // Parse and validate the data using dataParser
          const parsedData = parseLocationData(rawData);
          setData(parsedData);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err : new Error('Unknown error loading forecast')
          );
          // Only clear data on error
          setData(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchForecast();

    return () => {
      cancelled = true;
    };
  }, [state, cityName, basePath, fetchTrigger]);

  return {
    data,
    loading,
    error,
    refetch,
  };
}
