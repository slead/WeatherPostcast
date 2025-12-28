/**
 * App Component - Root component with routing and context providers
 * Feature: weather-dashboard
 *
 * Requirements:
 * - 1.3: Navigate to city's forecast page on marker click
 * - 2.3: Navigate to city's forecast page from mini-map
 * - 5.1: Load cities.geojson on app initialization
 */

import { HashRouter, Routes, Route } from 'react-router-dom';
import { CitiesProvider } from './context';
import { HomePage, CityPage, NotFoundPage } from './pages';
import { Footer } from './components/Footer';
import { DATA_BASE_PATH } from './config';
import './App.css';

/**
 * App component
 * Sets up routing and wraps the application in CitiesProvider
 *
 * Uses HashRouter for GitHub Pages compatibility - URLs will be like:
 * - /#/ : HomePage
 * - /#/city/QLD/Birdsville : CityPage
 *
 * Routes:
 * - / : HomePage with full Australia map
 * - /city/:state/:cityName : CityPage with forecast data
 * - * : NotFoundPage for 404/unknown routes
 */
function App() {
  return (
    <CitiesProvider basePath={DATA_BASE_PATH}>
      <HashRouter>
        <div className="min-h-screen flex flex-col">
          <div className="flex-1">
            <Routes>
              {/* Home page with interactive map (Requirement 1.3) */}
              <Route path="/" element={<HomePage />} />

              {/* City forecast page (Requirements 1.3, 2.3) */}
              <Route path="/city/:state/:cityName" element={<CityPage />} />

              {/* 404 handler for unknown routes */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </div>
          <Footer />
        </div>
      </HashRouter>
    </CitiesProvider>
  );
}

export default App;
