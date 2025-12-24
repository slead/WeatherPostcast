# Implementation Plan

- [-] 1. Set up React project with Vite and TypeScript

  - [-] 1.1 Initialize Vite React TypeScript project in `dashboard/` directory
    - Run `npm create vite@latest dashboard -- --template react-ts`
    - Install dependencies: react-router-dom, leaflet, react-leaflet, @types/leaflet
    - Install dev dependencies: vitest, fast-check, @testing-library/react, jsdom
    - _Requirements: 5.1_
  - [ ] 1.2 Set up Tailwind CSS
    - Install tailwindcss, postcss, autoprefixer
    - Initialize tailwind config with `npx tailwindcss init -p`
    - Configure content paths in tailwind.config.js
    - Add Tailwind directives to index.css
    - _Requirements: 7.1, 7.2_
  - [ ] 1.3 Set up shadcn/ui
    - Run `npx shadcn@latest init` to initialize shadcn/ui
    - Add required components: Card, Button, Skeleton, Alert
    - _Requirements: 5.3, 5.4_
  - [ ] 1.4 Configure Vite and TypeScript settings
    - Set up path aliases for clean imports (@/ prefix)
    - Configure vitest in vite.config.ts
    - _Requirements: 5.1_

- [ ] 2. Create TypeScript type definitions

  - [ ] 2.1 Define GeoJSON and city types
    - Create `src/types/index.ts` with CityFeature, CitiesGeoJSON interfaces
    - _Requirements: 1.1, 1.2_
  - [ ] 2.2 Define forecast data types
    - Add LocationData, ForecastRecord, PredictionEntry interfaces
    - _Requirements: 8.1, 8.2_
  - [ ]\* 2.3 Write property test for JSON parsing completeness
    - **Property 7: JSON Parsing Completeness**
    - **Validates: Requirements 8.1, 8.2, 8.3**

- [ ] 3. Implement data parsing utilities

  - [ ] 3.1 Create dataParser utility
    - Implement parseLocationData function to parse JSON to LocationData
    - Handle null values gracefully
    - Validate schema structure
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  - [ ]\* 3.2 Write property test for schema validation
    - **Property 8: Schema Validation**
    - **Validates: Requirements 8.4**
  - [ ] 3.3 Create dateFormatter utility
    - Implement formatDate function for human-readable dates
    - _Requirements: 8.5_
  - [ ]\* 3.4 Write property test for date formatting
    - **Property 9: Date Formatting**
    - **Validates: Requirements 8.5**

- [ ] 4. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement custom hooks for data fetching

  - [ ] 5.1 Create CitiesContext and useCities hook
    - Load cities.geojson on app initialization
    - Provide getCityByName helper function
    - Handle loading and error states
    - _Requirements: 5.1, 1.1_
  - [ ] 5.2 Create useForecast hook
    - Fetch city forecast data on demand
    - Parse JSON using dataParser
    - Handle loading, error, and refetch states
    - _Requirements: 5.2, 5.3, 5.4_

- [ ] 6. Implement WeatherIcon component

  - [ ] 6.1 Create icon mapping utility
    - Map BOM icon_codes (1-18) to weather icon representations
    - Define default icon for unknown codes
    - _Requirements: 6.1, 6.2_
  - [ ] 6.2 Implement WeatherIcon component
    - Render appropriate icon based on iconCode prop
    - Support size variants (small, medium, large)
    - _Requirements: 6.1, 6.2, 6.3_
  - [ ]\* 6.3 Write property test for icon code mapping
    - **Property 6: Icon Code Mapping**
    - **Validates: Requirements 6.1**

- [ ] 7. Implement ForecastDisplay component

  - [ ] 7.1 Create ForecastDisplay component
    - Use shadcn/ui Card component for layout
    - Display weather icon, temperature range, precipitation, precis
    - Format temperatures with °C symbol
    - Handle null values with placeholders
    - _Requirements: 3.2, 3.3, 3.4_
  - [ ]\* 7.2 Write property test for forecast display completeness
    - **Property 3: Forecast Display Completeness**
    - **Validates: Requirements 3.2, 3.3, 3.4**

- [ ] 8. Implement ReverseForecast component

  - [ ] 8.1 Create ReverseForecast component
    - Use shadcn/ui Card for each prediction entry
    - Display all predictions for a date organized by days-ahead
    - Order predictions from highest to lowest days-ahead
    - Label each entry with days-ahead value
    - Show placeholder for missing days-ahead slots
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [ ]\* 8.2 Write property test for reverse forecast ordering
    - **Property 5: Reverse Forecast Ordering**
    - **Validates: Requirements 4.1, 4.2, 4.3**

- [ ] 9. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Implement MapComponent

  - [ ] 10.1 Create MapComponent with Leaflet
    - Render interactive map with OpenStreetMap tiles
    - Display city markers at GeoJSON coordinates
    - Support click handler for marker selection
    - Show tooltip on hover with city name and state
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - [ ]\* 10.2 Write property test for marker position accuracy
    - **Property 1: Marker Position Accuracy**
    - **Validates: Requirements 1.2**

- [ ] 11. Implement MiniMap component

  - [ ] 11.1 Create MiniMap component
    - Extend MapComponent with mini-map specific features
    - Center map on current city coordinates
    - Highlight current city marker differently
    - Support navigation to other cities
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  - [ ]\* 11.2 Write property test for mini-map center position
    - **Property 2: Mini-map Center Position**
    - **Validates: Requirements 2.2**

- [ ] 12. Implement HomePage

  - [ ] 12.1 Create HomePage component
    - Render full-screen MapComponent
    - Navigate to city page on marker click
    - _Requirements: 1.1, 1.3_

- [ ] 13. Implement CityPage

  - [ ] 13.1 Create CityPage component
    - Extract state and cityName from URL params
    - Fetch forecast data using useForecast hook
    - Use shadcn/ui Skeleton for loading state
    - Use shadcn/ui Alert for error message with retry Button
    - _Requirements: 5.2, 5.3, 5.4_
  - [ ] 13.2 Integrate MiniMap and forecast display
    - Render MiniMap centered on current city
    - Render forecast dates with ReverseForecast components
    - _Requirements: 2.1, 2.2, 3.1, 4.1_
  - [ ]\* 13.3 Write property test for all forecast dates rendered
    - **Property 4: All Forecast Dates Rendered**
    - **Validates: Requirements 3.1**

- [ ] 14. Set up routing and App component

  - [ ] 14.1 Configure React Router
    - Set up routes for HomePage and CityPage
    - Handle 404/unknown routes
    - _Requirements: 1.3, 2.3_
  - [ ] 14.2 Create App component with CitiesProvider
    - Wrap app in CitiesContext provider
    - Set up router with routes
    - _Requirements: 5.1_

- [ ] 15. Add responsive styling

  - [ ] 15.1 Implement responsive layout with Tailwind
    - Use Tailwind responsive prefixes (sm:, md:, lg:) for breakpoints
    - Multi-column grid layout for desktop (md:grid-cols-2, lg:grid-cols-3)
    - Single-column layout for mobile
    - Touch-friendly map interactions
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 16. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
