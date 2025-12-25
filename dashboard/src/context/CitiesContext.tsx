/**
 * Cities Context and Provider for the Weather Dashboard
 * Feature: weather-dashboard
 *
 * Provides global access to cities data loaded from cities.geojson
 * Requirements: 5.1, 1.1
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { CityFeature, CitiesGeoJSON } from '../types';

/**
 * Result type for the useCities hook
 */
export interface UseCitiesResult {
  /** Array of all city features */
  cities: CityFeature[];
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: Error | null;
  /** Helper function to find a city by state and name */
  getCityByName: (state: string, cityName: string) => CityFeature | undefined;
}

/**
 * Context value type
 */
interface CitiesContextValue extends UseCitiesResult {}

/**
 * Cities context with default values
 */
const CitiesContext = createContext<CitiesContextValue | null>(null);

/**
 * Props for CitiesProvider
 */
interface CitiesProviderProps {
  children: ReactNode;
  /** Optional base path for data files (defaults to '/data') */
  basePath?: string;
}

/**
 * CitiesProvider component
 * Loads cities.geojson on mount and provides data to children
 *
 * Requirements: 5.1 - Load cities.geojson on app initialization
 */
export function CitiesProvider({
  children,
  basePath = '/data',
}: CitiesProviderProps) {
  const [cities, setCities] = useState<CityFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCities() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${basePath}/cities.geojson`);

        if (!response.ok) {
          throw new Error(`Failed to load cities: ${response.status} ${response.statusText}`);
        }

        const data: CitiesGeoJSON = await response.json();

        if (!cancelled) {
          if (data.type !== 'FeatureCollection' || !Array.isArray(data.features)) {
            throw new Error('Invalid GeoJSON format: expected FeatureCollection');
          }
          setCities(data.features);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Unknown error loading cities'));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadCities();

    return () => {
      cancelled = true;
    };
  }, [basePath]);

  /**
   * Helper function to find a city by state and name
   * Requirements: 1.1 - Display all city locations from cities.geojson
   */
  const getCityByName = useCallback(
    (state: string, cityName: string): CityFeature | undefined => {
      return cities.find(
        (city) =>
          city.properties.state.toLowerCase() === state.toLowerCase() &&
          city.properties.city_name.toLowerCase() === cityName.toLowerCase()
      );
    },
    [cities]
  );

  const value: CitiesContextValue = {
    cities,
    loading,
    error,
    getCityByName,
  };

  return (
    <CitiesContext.Provider value={value}>{children}</CitiesContext.Provider>
  );
}

/**
 * Hook to access cities data from context
 *
 * @throws Error if used outside of CitiesProvider
 * @returns UseCitiesResult with cities data and helper functions
 */
export function useCities(): UseCitiesResult {
  const context = useContext(CitiesContext);

  if (context === null) {
    throw new Error('useCities must be used within a CitiesProvider');
  }

  return context;
}
