/**
 * useCityWeatherIcons hook for the Weather Dashboard
 * Feature: weather-dashboard
 *
 * Fetches today's weather icon code for all cities to display on the map
 */

import { useState, useEffect, useMemo } from 'react';
import type { CityFeature } from '../types';
import { parseLocationData } from '../utils/dataParser';

/**
 * Map of city key to icon code
 * Key format: "{state}-{city_name}"
 */
export type CityIconMap = Map<string, number | null>;

/**
 * Result type for the useCityWeatherIcons hook
 */
export interface UseCityWeatherIconsResult {
  /** Map of city keys to their current weather icon codes */
  iconMap: CityIconMap;
  /** Loading state */
  loading: boolean;
}

/**
 * Get today's date in ISO format (YYYY-MM-DD) using local timezone
 */
function getTodayDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Create a unique key for a city
 */
export function getCityKey(state: string, cityName: string): string {
  return `${state}-${cityName}`;
}

/**
 * Hook to fetch today's weather icon for all cities
 *
 * @param cities - Array of city features from cities.geojson
 * @param basePath - Base path for data files (defaults to '/data')
 * @returns UseCityWeatherIconsResult with icon map and loading state
 */
export function useCityWeatherIcons(
  cities: CityFeature[],
  basePath: string = '/data'
): UseCityWeatherIconsResult {
  const [iconMap, setIconMap] = useState<CityIconMap>(new Map());
  const [loading, setLoading] = useState(false);

  // Memoize city list to prevent unnecessary refetches
  const cityList = useMemo(() => {
    return cities.map((c) => ({
      state: c.properties.state,
      cityName: c.properties.city_name,
    }));
  }, [cities]);

  useEffect(() => {
    if (cityList.length === 0) {
      setIconMap(new Map());
      return;
    }

    let cancelled = false;
    const todayDate = getTodayDateString();

    async function fetchAllIcons() {
      setLoading(true);
      const newIconMap = new Map<string, number | null>();

      // Fetch all cities in parallel with a concurrency limit
      const fetchPromises = cityList.map(async ({ state, cityName }) => {
        const key = getCityKey(state, cityName);
        try {
          const url = `${basePath}/${encodeURIComponent(state)}/${encodeURIComponent(cityName)}.json`;
          const response = await fetch(url);

          if (!response.ok) {
            return { key, iconCode: null };
          }

          const rawData = await response.json();
          const parsedData = parseLocationData(rawData);

          // Get today's forecast with days_ahead = 0 (current day prediction)
          const todayForecast = parsedData.forecasts[todayDate];
          const iconCode = todayForecast?.['0']?.icon_code ?? null;

          return { key, iconCode };
        } catch {
          return { key, iconCode: null };
        }
      });

      const results = await Promise.all(fetchPromises);

      if (!cancelled) {
        results.forEach(({ key, iconCode }) => {
          newIconMap.set(key, iconCode);
        });
        setIconMap(newIconMap);
        setLoading(false);
      }
    }

    fetchAllIcons();

    return () => {
      cancelled = true;
    };
  }, [cityList, basePath]);

  return { iconMap, loading };
}
