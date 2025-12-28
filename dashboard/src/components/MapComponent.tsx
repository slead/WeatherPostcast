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

import { useEffect, useMemo, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Tooltip,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import type { CityFeature } from '../types';
import { getIconPath } from '@/utils/iconMapping';
import type { CityIconMap } from '@/hooks/useCityWeatherIcons';
import { getCityKey } from '@/hooks/useCityWeatherIcons';

// Fix for default marker icons in Leaflet with bundlers
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Configure default icon (fallback when no weather data)
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

L.Marker.prototype.options.icon = DefaultIcon;

/** Zoom constraints */
const MIN_ZOOM = 3;
const MAX_ZOOM = 10;

/** Australia bounds with ~100% padding */
const AUSTRALIA_BOUNDS = L.latLngBounds(
  L.latLng(-50, 100), // Southwest corner (with padding)
  L.latLng(0, 165) // Northeast corner (with padding)
);

/** Base icon size at zoom level 4 */
const BASE_ICON_SIZE = 24;
const BASE_ZOOM = 4;

/**
 * Calculate icon size based on zoom level
 * Icons scale proportionally with zoom
 * @param zoom - Current zoom level
 * @param highlighted - Whether this is the current/highlighted city
 * @param hovered - Whether this marker is being hovered (mini-map only)
 */
function getIconSizeForZoom(
  zoom: number,
  highlighted: boolean = false,
  hovered: boolean = false
): [number, number] {
  // Scale factor: doubles every 2 zoom levels
  const scale = Math.pow(2, (zoom - BASE_ZOOM) / 2);
  let baseSize = BASE_ICON_SIZE;
  if (highlighted) {
    baseSize = BASE_ICON_SIZE * 1.5;
  } else if (hovered) {
    baseSize = BASE_ICON_SIZE * 1.25;
  }
  const size = Math.round(baseSize * scale);
  // Clamp between 16 and 96 pixels (higher max for highlighted)
  const maxSize = highlighted ? 96 : 64;
  const clampedSize = Math.max(16, Math.min(maxSize, size));
  return [clampedSize, clampedSize];
}

/**
 * Create a Leaflet icon from a weather icon code with zoom-based sizing
 */
function createWeatherIcon(
  iconCode: number | null,
  zoom: number,
  highlighted: boolean = false,
  hovered: boolean = false
): L.Icon {
  const size = getIconSizeForZoom(zoom, highlighted, hovered);

  const iconPath = getIconPath(iconCode);
  const icon = L.icon({
    iconUrl: iconPath,
    iconSize: size,
    iconAnchor: [size[0] / 2, size[1] / 2],
    popupAnchor: [0, -size[1] / 2],
    tooltipAnchor: [size[0] / 2, 0],
  });

  return icon;
}

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
  /** Optional map of city keys to weather icon codes */
  weatherIcons?: CityIconMap;
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

  // Invalidate map size when container might have resized
  // This fixes centering issues on mobile when the container size changes
  useEffect(() => {
    // Small delay to ensure container has finished resizing
    const timeoutId = setTimeout(() => {
      map.invalidateSize();
    }, 100);

    // Also listen for window resize events
    const handleResize = () => {
      map.invalidateSize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, [map]);

  return null;
}

/**
 * Helper component to track zoom level changes
 */
function ZoomTracker({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
  const map = useMapEvents({
    zoomend: () => {
      onZoomChange(map.getZoom());
    },
  });

  useEffect(() => {
    onZoomChange(map.getZoom());
  }, [map, onZoomChange]);

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
  weatherIcons,
}: MapComponentProps) {
  const effectiveZoom = zoom ?? (size === 'mini' ? MINI_MAP_ZOOM : DEFAULT_ZOOM);
  const [currentZoom, setCurrentZoom] = useState(effectiveZoom);
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);

  // Determine container class based on size
  // touch-manipulation enables smooth touch interactions on mobile
  const containerClass =
    size === 'full'
      ? 'w-full h-full min-h-[300px] touch-manipulation'
      : 'w-full h-[32rem] rounded-lg touch-manipulation';

  // Memoize icon lookup - now includes zoom level for dynamic sizing
  const getMarkerIcon = useMemo(() => {
    return (
      state: string,
      cityName: string,
      isHighlighted: boolean,
      isHovered: boolean
    ) => {
      if (weatherIcons) {
        const key = getCityKey(state, cityName);
        const iconCode = weatherIcons.get(key) ?? null;
        return createWeatherIcon(iconCode, currentZoom, isHighlighted, isHovered);
      }
      return DefaultIcon;
    };
  }, [weatherIcons, currentZoom]);

  return (
    <MapContainer
      center={center}
      zoom={effectiveZoom}
      className={containerClass}
      scrollWheelZoom={true}
      style={{ zIndex: 0 }}
      minZoom={MIN_ZOOM}
      maxZoom={MAX_ZOOM}
      maxBounds={AUSTRALIA_BOUNDS}
      maxBoundsViscosity={1.0}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/attributions">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        opacity={0.9}
      />
      <MapUpdater center={center} zoom={effectiveZoom} />
      <ZoomTracker onZoomChange={setCurrentZoom} />

      {cities.map((city) => {
        // GeoJSON coordinates are [longitude, latitude]
        // Leaflet expects [latitude, longitude]
        const [lng, lat] = city.geometry.coordinates;
        const position: [number, number] = [lat, lng];

        const cityKey = `${city.properties.state}-${city.properties.city_name}`;
        const isHighlighted = highlightedCity === city.properties.city_name;
        const isHovered = size === 'mini' && hoveredCity === cityKey;
        const icon = getMarkerIcon(
          city.properties.state,
          city.properties.city_name,
          isHighlighted,
          isHovered
        );

        // Apply reduced opacity to non-highlighted markers in mini-map mode
        // Full opacity when highlighted or hovered
        const markerOpacity =
          size === 'mini' && !isHighlighted && !isHovered ? 0.5 : 1;

        return (
          <Marker
            key={cityKey}
            position={position}
            icon={icon}
            opacity={markerOpacity}
            eventHandlers={{
              click: () => onCityClick(city),
              mouseover: () => size === 'mini' && setHoveredCity(cityKey),
              mouseout: () => size === 'mini' && setHoveredCity(null),
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
