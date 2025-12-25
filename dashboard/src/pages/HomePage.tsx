/**
 * HomePage - Landing page with full-screen interactive map
 * Feature: weather-dashboard
 *
 * Requirements:
 * - 1.1: Display interactive map showing all city locations from cities.geojson
 * - 1.3: Navigate to city's forecast page on marker click
 */

import { useNavigate } from 'react-router-dom';
import { MapComponent } from '../components';
import { useCities } from '../context';
import type { CityFeature } from '../types';

/**
 * HomePage component
 * Renders a full-screen map of Australia with all city markers.
 * Clicking a marker navigates to that city's forecast page.
 */
export function HomePage() {
  const navigate = useNavigate();
  const { cities, loading, error } = useCities();

  /**
   * Handle city marker click - navigate to city page
   * Requirement 1.3: Navigate to city's forecast page on marker click
   */
  const handleCityClick = (city: CityFeature) => {
    const { state, city_name } = city.properties;
    // Encode city name to handle spaces and special characters
    navigate(`/city/${state}/${encodeURIComponent(city_name)}`);
  };

  // Show loading state while cities are being fetched
  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading cities...</p>
        </div>
      </div>
    );
  }

  // Show error state if cities failed to load
  if (error) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <p className="text-red-500 mb-4">Failed to load cities: {error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen">
      {/* Requirement 1.1: Display interactive map showing all city locations */}
      <MapComponent
        cities={cities}
        onCityClick={handleCityClick}
        size="full"
      />
    </div>
  );
}

export default HomePage;
