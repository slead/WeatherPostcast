/**
 * MiniMap Component - Smaller map for city page navigation
 * Feature: weather-dashboard
 *
 * Requirements:
 * - 2.1: Display a mini-map showing all city locations
 * - 2.2: Center the map on the currently selected city's coordinates
 * - 2.3: Navigate to that city's forecast page on marker click
 * - 2.4: Visually distinguish the current city marker from other city markers
 */

import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapComponent } from './MapComponent';
import { useCities } from '../context';
import { useCityWeatherIcons } from '../hooks/useCityWeatherIcons';
import type { CityFeature } from '../types';

/**
 * Props for the MiniMap component
 */
export interface MiniMapProps {
  /** Current city name to highlight and center on */
  currentCityName: string;
  /** Current state for the city */
  currentState: string;
  /** Optional custom zoom level (defaults to 8 for mini-map) */
  zoom?: number;
  /** Optional CSS class name for the container */
  className?: string;
}

/**
 * MiniMap Component
 *
 * A smaller map component designed for city pages that:
 * - Centers on the currently selected city
 * - Highlights the current city marker
 * - Allows navigation to other cities by clicking their markers
 *
 * Requirements:
 * - 2.1: Display a mini-map showing all city locations
 * - 2.2: Center the map on the currently selected city's coordinates
 * - 2.3: Navigate to that city's forecast page on marker click
 * - 2.4: Visually distinguish the current city marker from other city markers
 */
export function MiniMap({
  currentCityName,
  currentState,
  zoom,
  className,
}: MiniMapProps) {
  const navigate = useNavigate();
  const { cities, getCityByName } = useCities();
  const { iconMap: weatherIcons } = useCityWeatherIcons(cities);

  // Get the current city's coordinates for centering the map
  // Requirement 2.2: Center the map on the currently selected city's coordinates
  const currentCity = useMemo(() => {
    return getCityByName(currentState, currentCityName);
  }, [getCityByName, currentState, currentCityName]);

  // Calculate center coordinates from current city
  // GeoJSON coordinates are [longitude, latitude], Leaflet expects [latitude, longitude]
  const center = useMemo((): [number, number] => {
    if (currentCity) {
      const [lng, lat] = currentCity.geometry.coordinates;
      return [lat, lng];
    }
    // Default to Australia center if city not found
    return [-25.2744, 133.7751];
  }, [currentCity]);

  // Handle city marker click - navigate to the selected city's page
  // Requirement 2.3: Navigate to that city's forecast page on marker click
  const handleCityClick = useCallback(
    (city: CityFeature) => {
      const { state, city_name } = city.properties;
      // Encode city name for URL (handles spaces and special characters)
      const encodedCityName = encodeURIComponent(city_name);
      navigate(`/city/${state}/${encodedCityName}`);
    },
    [navigate]
  );

  return (
    <div className={className}>
      <MapComponent
        cities={cities}
        onCityClick={handleCityClick}
        center={center}
        zoom={zoom}
        highlightedCity={currentCityName}
        size="mini"
        weatherIcons={weatherIcons}
      />
    </div>
  );
}

export default MiniMap;
