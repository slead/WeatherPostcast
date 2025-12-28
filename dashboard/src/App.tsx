/**
 * App Component - Root component with routing and context providers
 * Feature: weather-dashboard
 *
 * Requirements:
 * - 1.3: Navigate to city's forecast page on marker click
 * - 2.3: Navigate to city's forecast page from mini-map
 * - 5.1: Load cities.geojson on app initialization
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CitiesProvider } from './context';
import { HomePage, CityPage, NotFoundPage } from './pages';
import { DATA_BASE_PATH } from './config';
import './App.css';

/**
 * App component
 * Sets up routing and wraps the application in CitiesProvider
 *
 * Routes:
 * - / : HomePage with full Australia map
 * - /city/:state/:cityName : CityPage with forecast data
 * - * : NotFoundPage for 404/unknown routes
 */
function App() {
  return (
    <CitiesProvider basePath={DATA_BASE_PATH}>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          {/* Home page with interactive map (Requirement 1.3) */}
          <Route path="/" element={<HomePage />} />

          {/* City forecast page (Requirements 1.3, 2.3) */}
          <Route path="/city/:state/:cityName" element={<CityPage />} />

          {/* 404 handler for unknown routes */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </CitiesProvider>
  );
}

export default App;
