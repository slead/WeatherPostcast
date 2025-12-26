/**
 * MapComponent - Interactive map for displaying city markers
 * Feature: weather-dashboard
 *
 * Requirements:
 * - 1.1: Display interactive map showing all city locations from cities.geojson
 * - 1.2: Render city markers at their geographic coordinates
 * - 1.3: Navigate to city's forecast page on marker click
 * - 1.4: Display city name and state as tooltip on hover
 */

import { useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Tooltip,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import type { CityFeature } from '../types';

// Fix for default marker icons in Leaflet with bundlers
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Configure default icon
const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

// Highlighted icon for current city (used in mini-map)
const HighlightedIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [30, 49],
  iconAnchor: [15, 49],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
  className: 'highlighted-marker',
});

L.Marker.prototype.options.icon = DefaultIcon;

/**
 * Props for the MapComponent
 */
export interface MapComponentProps {
  /** Array of city features to display as markers */
  cities: CityFeature[];
  /** Callback when a city marker is clicked */
  onCityClick: (city: CityFeature) => void;
  /** Optional center coordinates [lat, lng] */
  center?: [number, number];
  /** Optional zoom level */
  zoom?: number;
  /** Optional city name to highlight (for mini-map) */
  highlightedCity?: string;
  /** Map size variant */
  size?: 'full' | 'mini';
}

// Default center of Australia
const AUSTRALIA_CENTER: [number, number] = [-25.2744, 133.7751];
const DEFAULT_ZOOM = 4;
const MINI_MAP_ZOOM = 8;

/**
 * Helper component to update map view when center/zoom changes
 */
function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);

  return null;
}

/**
 * MapComponent - Renders an interactive Leaflet map with city markers
 *
 * Requirements:
 * - 1.1: Display interactive map showing all city locations
 * - 1.2: Render city markers at geographic coordinates (GeoJSON [lng, lat] -> Leaflet [lat, lng])
 * - 1.3: Support click handler for marker selection
 * - 1.4: Show tooltip on hover with city name and state
 */
export function MapComponent({
  cities,
  onCityClick,
  center = AUSTRALIA_CENTER,
  zoom,
  highlightedCity,
  size = 'full',
}: MapComponentProps) {
  const effectiveZoom = zoom ?? (size === 'mini' ? MINI_MAP_ZOOM : DEFAULT_ZOOM);

  // Determine container class based on size
  const containerClass = size === 'full' 
    ? 'w-full h-full min-h-[400px]' 
    : 'w-full h-[32rem] rounded-lg';

  return (
    <MapContainer
      center={center}
      zoom={effectiveZoom}
      className={containerClass}
      scrollWheelZoom={true}
      style={{ zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapUpdater center={center} zoom={effectiveZoom} />
      
      {cities.map((city) => {
        // GeoJSON coordinates are [longitude, latitude]
        // Leaflet expects [latitude, longitude]
        const [lng, lat] = city.geometry.coordinates;
        const position: [number, number] = [lat, lng];
        
        const isHighlighted = highlightedCity === city.properties.city_name;
        const icon = isHighlighted ? HighlightedIcon : DefaultIcon;

        return (
          <Marker
            key={`${city.properties.state}-${city.properties.city_name}`}
            position={position}
            icon={icon}
            eventHandlers={{
              click: () => onCityClick(city),
            }}
          >
            {/* Requirement 1.4: Display city name and state as tooltip on hover */}
            <Tooltip>
              <span className="font-medium">{city.properties.city_name}</span>
              <span className="text-gray-500">, {city.properties.state}</span>
            </Tooltip>
          </Marker>
        );
      })}
    </MapContainer>
  );
}

export default MapComponent;
