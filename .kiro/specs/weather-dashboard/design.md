# Design Document: Weather Dashboard

## Overview

The Weather Dashboard is a React-based single-page application (SPA) that displays weather forecast data collected by the BOM Weather Tracker. The application features an interactive map of Australia on the landing page, allowing users to select cities and view their forecast history. Each city page displays a mini-map centered on that location and shows the "reverse forecast" - all predictions made for each date over the past 7 days, enabling users to evaluate forecast accuracy.

The application is designed to be statically hosted alongside the forecast data files, consuming JSON data directly from the `data/` directory structure.

## Architecture

```mermaid
flowchart TD
    subgraph Data Layer
        GEOJSON[cities.geojson]
        FORECASTS[data/{state}/{city}.json]
    end

    subgraph React Application
        APP[App Component]
        ROUTER[React Router]

        subgraph Pages
            HOME[HomePage]
            CITY[CityPage]
        end

        subgraph Components
            MAP[MapComponent]
            MINIMAP[MiniMap]
            FORECAST[ForecastDisplay]
            REVERSE[ReverseForecast]
            ICON[WeatherIcon]
            LOADER[LoadingSpinner]
        end

        subgraph Hooks
            USECITIES[useCities]
            USEFORECAST[useForecast]
        end

        subgraph Utils
            PARSER[dataParser]
            FORMATTER[dateFormatter]
        end
    end

    GEOJSON --> USECITIES
    FORECASTS --> USEFORECAST

    APP --> ROUTER
    ROUTER --> HOME
    ROUTER --> CITY

    HOME --> MAP
    CITY --> MINIMAP
    CITY --> FORECAST
    CITY --> REVERSE

    FORECAST --> ICON
    REVERSE --> ICON

    USECITIES --> HOME
    USECITIES --> CITY
    USEFORECAST --> CITY

    PARSER --> USEFORECAST
    FORMATTER --> FORECAST
    FORMATTER --> REVERSE
```

## Components and Interfaces

### 1. App Component

Root component that sets up routing and global context.

```typescript
// App.tsx
const App: React.FC = () => {
  return (
    <CitiesProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/city/:state/:cityName" element={<CityPage />} />
        </Routes>
      </Router>
    </CitiesProvider>
  );
};
```

### 2. HomePage Component

Landing page with full-screen interactive map of Australia.

```typescript
interface HomePageProps {}

const HomePage: React.FC<HomePageProps> = () => {
  // Renders full-screen map with all city markers
  // Clicking a marker navigates to /city/{state}/{cityName}
};
```

### 3. CityPage Component

City detail page with mini-map and forecast data.

```typescript
interface CityPageProps {}

const CityPage: React.FC<CityPageProps> = () => {
  // Uses useParams to get state and cityName
  // Fetches forecast data on mount
  // Renders mini-map centered on city
  // Renders forecast display and reverse forecast view
};
```

### 4. MapComponent

Interactive map using Leaflet for rendering city markers.

```typescript
interface MapComponentProps {
  cities: CityFeature[];
  onCityClick: (city: CityFeature) => void;
  center?: [number, number]; // [lat, lng]
  zoom?: number;
  highlightedCity?: string; // city_name to highlight
  size?: "full" | "mini";
}

interface CityFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
  };
  properties: {
    city_name: string;
    state: string;
    product_id: string;
  };
}
```

### 5. ForecastDisplay Component

Displays forecast data for a single date with all weather metrics.

```typescript
interface ForecastDisplayProps {
  forecastDate: string;
  prediction: PredictionEntry;
  daysAhead: number;
}

interface PredictionEntry {
  icon_code: number | null;
  temp_min: number | null;
  temp_max: number | null;
  precipitation_prob: string | null;
  precis: string | null;
  forecast: string | null;
}
```

### 6. ReverseForecast Component

Displays all predictions for a single date, organized by days-ahead.

```typescript
interface ReverseForecastProps {
  forecastDate: string;
  predictions: Record<string, PredictionEntry>; // keyed by days-ahead
}
```

### 7. WeatherIcon Component

Renders weather icon based on BOM icon_code.

```typescript
interface WeatherIconProps {
  iconCode: number | null;
  size?: "small" | "medium" | "large";
}

// BOM icon codes map to weather conditions:
// 1: Sunny, 2: Clear, 3: Partly cloudy, 4: Cloudy
// 6: Haze, 8: Light rain, 9: Wind, 10: Fog
// 11: Showers, 12: Rain, 13: Dust, 14: Frost
// 15: Snow, 16: Storm, 17: Light showers, 18: Heavy showers
```

### 8. Custom Hooks

```typescript
// useCities.ts
interface UseCitiesResult {
  cities: CityFeature[];
  loading: boolean;
  error: Error | null;
  getCityByName: (state: string, cityName: string) => CityFeature | undefined;
}

function useCities(): UseCitiesResult;

// useForecast.ts
interface UseForecastResult {
  data: LocationData | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

function useForecast(state: string, cityName: string): UseForecastResult;
```

## Data Models

### GeoJSON City Data (cities.geojson)

```typescript
interface CitiesGeoJSON {
  type: "FeatureCollection";
  features: CityFeature[];
}

interface CityFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
  properties: {
    city_name: string;
    state: string;
    product_id: string;
  };
}
```

### Location Forecast Data (data/{state}/{city}.json)

```typescript
interface LocationData {
  product_id: string;
  city_name: string;
  state: string;
  timezone: string;
  forecasts: Record<string, ForecastRecord>; // keyed by ISO date string
}

interface ForecastRecord {
  [daysAhead: string]: PredictionEntry; // "0", "1", "2", etc.
}

interface PredictionEntry {
  icon_code: number | null;
  temp_min: number | null;
  temp_max: number | null;
  precipitation_prob: string | null;
  precis: string | null;
  forecast: string | null;
}
```

### Parsed/Display Types

```typescript
interface ParsedForecast {
  date: Date;
  dateString: string;
  predictions: ParsedPrediction[];
}

interface ParsedPrediction {
  daysAhead: number;
  iconCode: number | null;
  tempMin: number | null;
  tempMax: number | null;
  precipitationProb: string | null;
  precis: string | null;
}
```

## URL Routing

| Route                    | Component | Description                          |
| ------------------------ | --------- | ------------------------------------ |
| `/`                      | HomePage  | Landing page with full Australia map |
| `/city/:state/:cityName` | CityPage  | City forecast page with mini-map     |

Example URLs:

- `/city/NSW/Sydney`
- `/city/VIC/Melbourne`
- `/city/QLD/Brisbane`

## Data Flow

1. **App Initialization**

   - Load `cities.geojson` via `useCities` hook
   - Store in React Context for global access

2. **Landing Page**

   - Render map with all city markers from context
   - On marker click, navigate to `/city/{state}/{cityName}`

3. **City Page**
   - Extract `state` and `cityName` from URL params
   - Fetch `data/{state}/{cityName}.json` via `useForecast` hook
   - Parse JSON into display-ready format
   - Render mini-map centered on city coordinates
   - Render forecast data organized by date

## Error Handling

### Network Errors

- Display user-friendly error message with retry button
- Log errors to console for debugging
- Show cached data if available (future enhancement)

### Data Parsing Errors

- Handle missing/null fields gracefully with fallback values
- Display "N/A" or placeholder for missing data
- Log parsing warnings without breaking the UI

### Invalid Routes

- Redirect to home page for unknown cities
- Display "City not found" message with link to home

### Loading States

- Show loading spinner while fetching data
- Skeleton loaders for forecast cards (optional)

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Marker Position Accuracy

_For any_ city feature from the GeoJSON data, the map marker position should match the coordinates specified in the feature's geometry (longitude, latitude).

**Validates: Requirements 1.2**

### Property 2: Mini-map Center Position

_For any_ city page, the mini-map center coordinates should match the currently selected city's coordinates from the GeoJSON data.

**Validates: Requirements 2.2**

### Property 3: Forecast Display Completeness

_For any_ prediction entry with non-null values, the rendered forecast display should include the weather icon, temperature range with °C symbol, precipitation probability, and precis text for all present fields.

**Validates: Requirements 3.2, 3.3, 3.4**

### Property 4: All Forecast Dates Rendered

_For any_ location data, the city page should render forecast information for every date key present in the forecasts object.

**Validates: Requirements 3.1**

### Property 5: Reverse Forecast Ordering

_For any_ forecast date with multiple predictions, the reverse forecast display should show predictions ordered from highest days-ahead value to lowest, with each entry labeled with its days-ahead value.

**Validates: Requirements 4.1, 4.2, 4.3**

### Property 6: Icon Code Mapping

_For any_ valid BOM icon_code (1-18), the WeatherIcon component should render the corresponding weather icon without error.

**Validates: Requirements 6.1**

### Property 7: JSON Parsing Completeness

_For any_ valid location JSON file, parsing should extract product_id, city_name, state, timezone, and forecasts fields, correctly interpreting string keys as days-ahead integers and handling null values without errors.

**Validates: Requirements 8.1, 8.2, 8.3**

### Property 8: Schema Validation

_For any_ JSON input, the validation function should correctly identify whether the structure matches the expected LocationData schema.

**Validates: Requirements 8.4**

### Property 9: Date Formatting

_For any_ valid ISO date string (YYYY-MM-DD format), the date formatter should produce a human-readable string representation.

**Validates: Requirements 8.5**

## Testing Strategy

### Property-Based Testing

The application will use **fast-check** as the property-based testing library for TypeScript/JavaScript.

Each property-based test will:

- Run a minimum of 100 iterations
- Be tagged with a comment referencing the correctness property: `// Feature: weather-dashboard, Property {N}: {description}`
- Generate inputs using fast-check arbitraries

Key generators needed:

- `CityFeature` generator: valid GeoJSON point features with coordinates and properties
- `LocationData` generator: valid location data with nested forecast structures
- `PredictionEntry` generator: prediction objects with optional null fields
- `ForecastRecord` generator: records with days-ahead keys (0-7)
- `ISO date string` generator: valid YYYY-MM-DD format strings

### Unit Tests

Unit tests will cover:

- Component rendering with various props
- Hook behavior (loading, error, success states)
- URL routing and navigation
- Edge cases (empty data, missing cities)

### Integration Tests

Integration tests will verify:

- Full page rendering with mock data
- Navigation between home and city pages
- Data fetching and display pipeline

## Technology Stack

### Core Framework

- React 18+ with TypeScript
- Vite for build tooling

### Routing

- React Router v6

### Mapping

- Leaflet with react-leaflet wrapper
- OpenStreetMap tiles (free, no API key required)

### Styling

- Tailwind CSS for utility-first styling
- shadcn/ui for pre-built accessible components (Card, Button, Skeleton, Alert, etc.)
- Responsive design with Tailwind breakpoints

### Testing

- Vitest for unit/integration tests
- fast-check for property-based testing
- React Testing Library for component tests

### Data Fetching

- Native fetch API
- Custom hooks for data management

## File Structure

```
dashboard/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── skeleton.tsx
│   │   │   └── alert.tsx
│   │   ├── ForecastDisplay.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── MapComponent.tsx
│   │   ├── MiniMap.tsx
│   │   ├── ReverseForecast.tsx
│   │   └── WeatherIcon.tsx
│   ├── hooks/
│   │   ├── useCities.ts
│   │   └── useForecast.ts
│   ├── pages/
│   │   ├── CityPage.tsx
│   │   └── HomePage.tsx
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   ├── dataParser.ts
│   │   ├── dateFormatter.ts
│   │   └── iconMapping.ts
│   ├── context/
│   │   └── CitiesContext.tsx
│   ├── lib/
│   │   └── utils.ts               # shadcn/ui cn() utility
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css                  # Tailwind directives
├── tests/
│   ├── components/
│   ├── hooks/
│   ├── utils/
│   └── properties/
├── components.json                # shadcn/ui config
├── tailwind.config.js
├── postcss.config.js
├── package.json
├── tsconfig.json
├── vite.config.ts
└── vitest.config.ts
```
