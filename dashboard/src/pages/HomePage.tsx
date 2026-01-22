/**
 * HomePage - Landing page with title, map, capital city forecasts, and search
 * Feature: weather-dashboard
 *
 * Requirements:
 * - 1.1: Display interactive map showing all city locations from cities.geojson
 * - 1.3: Navigate to city's forecast page on marker click
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapComponent, WeatherIcon } from '../components';
import { useCities } from '../context';
import { useCityWeatherIcons } from '../hooks/useCityWeatherIcons';
import { useForecast } from '../hooks/useForecast';
import { DATA_BASE_PATH } from '../config';
import { Card, CardContent } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import type { CityFeature } from '../types';
import stormLogo from '../assets/storms.svg';
import lightRainLogo from '../assets/light-rain.svg';

/** Australian capital cities with their states */
const CAPITAL_CITIES = [
  { city: 'Sydney', state: 'NSW' },
  { city: 'Melbourne', state: 'VIC' },
  { city: 'Brisbane', state: 'QLD' },
  { city: 'Perth', state: 'WA' },
  { city: 'Adelaide', state: 'SA' },
  { city: 'Hobart', state: 'TAS' },
  { city: 'Darwin', state: 'NT' },
  { city: 'Canberra', state: 'NSW' },
];

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
 * Hook to fetch forecast for a single capital city
 */
function useCapitalForecast(city: string, state: string) {
  return useForecast(state, city, { basePath: DATA_BASE_PATH });
}

/**
 * Capital city forecast row component - shows 7 days of predictions ending with today
 * Responsive: Shows all 8 days on desktop, condensed view on mobile
 */
interface CapitalCityRowProps {
  city: string;
  state: string;
  onClick: () => void;
}

function CapitalCityRow({ city, state, onClick }: CapitalCityRowProps) {
  const { data, loading, error } = useCapitalForecast(city, state);
  const todayDate = getTodayDateString();

  // Get predictions for today: days-ahead 7 down to 0 (oldest prediction to today's actual)
  const predictions = data?.forecasts[todayDate];

  // Days ahead from 7 to 0 (7 days ago prediction → today's actual)
  const daysAheadRange = [7, 6, 5, 4, 3, 2, 1, 0];

  // Mobile view: show only key days (7, 3, 1, 0)
  const mobileDaysAheadRange = [7, 3, 1, 0];

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow active:shadow-lg touch-manipulation"
      onClick={onClick}
    >
      <CardContent className="p-3 lg:p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-4">
          {/* City name */}
          <div className="flex items-center justify-between lg:block lg:w-32 flex-shrink-0">
            <div>
              <h3 className="font-semibold text-base lg:text-lg">{city}</h3>
              <p className="text-xs lg:text-sm text-gray-500">{state}</p>
            </div>
            {/* Mobile: Show today's weather prominently */}
            <div className="lg:hidden">
              {loading && !data ? (
                <Skeleton className="h-10 w-10 rounded" />
              ) : predictions?.['0'] ? (
                <div className="flex items-center gap-2">
                  <WeatherIcon iconCode={predictions['0'].icon_code} size="small" />
                  <span className="text-lg font-bold">
                    {predictions['0'].temp_max !== null ? `${predictions['0'].temp_max}°` : '--'}
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Forecast cells - Desktop: all 8 days, Mobile: 4 key days */}
          <div className="flex-1">
            {/* Desktop view - all days */}
            <div className="hidden lg:grid lg:grid-cols-8 gap-1 xl:gap-2">
              {loading && !data ? (
                // Loading skeleton
                daysAheadRange.map((day) => (
                  <div key={day} className="flex flex-col items-center p-1 xl:p-2">
                    <Skeleton className="h-10 w-10 xl:h-12 xl:w-12 rounded" />
                    <Skeleton className="h-3 xl:h-4 w-8 xl:w-10 mt-1 xl:mt-2" />
                  </div>
                ))
              ) : error ? (
                <p className="text-sm text-red-500 col-span-8 text-center">Unable to load</p>
              ) : (
                daysAheadRange.map((daysAhead) => {
                  const forecast = predictions?.[daysAhead.toString()];
                  const isToday = daysAhead === 0;
                  const tooltipText = forecast?.forecast || forecast?.precis || null;

                  return (
                    <div
                      key={daysAhead}
                      className={`group relative flex flex-col items-center p-1 xl:p-2 rounded-lg ${
                        isToday ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                      }`}
                    >
                      {forecast ? (
                        <>
                          <WeatherIcon iconCode={forecast.icon_code} size="medium" />
                          <span className="text-xs xl:text-sm font-semibold mt-1">
                            {forecast.temp_max !== null ? `${forecast.temp_max}°` : '--'}
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="w-10 h-10 xl:w-12 xl:h-12 bg-gray-200 rounded flex items-center justify-center">
                            <span className="text-gray-400 text-xs xl:text-sm">--</span>
                          </div>
                          <span className="text-xs xl:text-sm text-gray-400 mt-1">--</span>
                        </>
                      )}
                      {/* Tooltip - desktop only */}
                      {tooltipText && (
                        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none">
                          <div className="text-center">
                            <p className="font-medium mb-1">
                              {isToday
                                ? `Today's actual weather in ${city}:`
                                : `${daysAhead} day${daysAhead > 1 ? 's' : ''} ago, BOM predicted today's weather in ${city} would be:`}
                            </p>
                            <p>{tooltipText}</p>
                          </div>
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Mobile view - condensed 4 key days */}
            <div className="grid grid-cols-4 gap-2 lg:hidden">
              {loading && !data ? (
                mobileDaysAheadRange.map((day) => (
                  <div key={day} className="flex flex-col items-center p-1">
                    <Skeleton className="h-8 w-8 rounded" />
                    <Skeleton className="h-3 w-6 mt-1" />
                  </div>
                ))
              ) : error ? (
                <p className="text-xs text-red-500 col-span-4 text-center">Unable to load</p>
              ) : (
                mobileDaysAheadRange.map((daysAhead) => {
                  const forecast = predictions?.[daysAhead.toString()];
                  const isToday = daysAhead === 0;

                  return (
                    <div
                      key={daysAhead}
                      className={`flex flex-col items-center p-1 rounded-lg ${
                        isToday ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                      }`}
                    >
                      <span className="text-[10px] text-gray-500 mb-0.5">
                        {isToday ? 'Today' : `${daysAhead}d`}
                      </span>
                      {forecast ? (
                        <>
                          <WeatherIcon iconCode={forecast.icon_code} size="small" />
                          <span className="text-xs font-semibold">
                            {forecast.temp_max !== null ? `${forecast.temp_max}°` : '--'}
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                            <span className="text-gray-400 text-xs">--</span>
                          </div>
                          <span className="text-xs text-gray-400">--</span>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * City search component
 */
interface CitySearchProps {
  cities: CityFeature[];
  onSelect: (city: CityFeature) => void;
}

function CitySearch({ cities, onSelect }: CitySearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredCities = useMemo(() => {
    if (!query.trim()) return [];
    const lowerQuery = query.toLowerCase();
    return cities
      .filter((city) =>
        city.properties.city_name.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 8);
  }, [cities, query]);

  const handleSelect = (city: CityFeature) => {
    setQuery('');
    setIsOpen(false);
    onSelect(city);
  };

  return (
    <div className="relative w-full max-w-md mx-auto">
      <input
        type="text"
        placeholder="Search for a city..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      {isOpen && filteredCities.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {filteredCities.map((city) => (
            <li
              key={`${city.properties.state}-${city.properties.city_name}`}
              className="px-4 py-2 hover:bg-blue-50 cursor-pointer"
              onMouseDown={() => handleSelect(city)}
            >
              <span className="font-medium">{city.properties.city_name}</span>
              <span className="text-gray-500 ml-2">{city.properties.state}</span>
            </li>
          ))}
        </ul>
      )}
      {isOpen && query.trim() && filteredCities.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
          No cities found
        </div>
      )}
    </div>
  );
}

/**
 * HomePage component
 */
export function HomePage() {
  const navigate = useNavigate();
  const { cities, loading, error } = useCities();
  const { iconMap: weatherIcons, loading: iconsLoading } = useCityWeatherIcons(cities, DATA_BASE_PATH);

  const handleCityClick = (city: CityFeature) => {
    const { state, city_name } = city.properties;
    navigate(`/city/${state}/${encodeURIComponent(city_name)}`);
  };

  const handleCapitalClick = (city: string, state: string) => {
    navigate(`/city/${state}/${encodeURIComponent(city)}`);
  };

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
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 lg:py-8 text-center">
          <div className="flex items-center justify-center gap-2 lg:gap-3 mb-3">
            <img src={stormLogo} alt="Storm icon" className="h-8 w-8 lg:h-10 lg:w-10" />
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
              Weather Postcast
            </h1>
            <img src={lightRainLogo} alt="Light rain icon" className="h-8 w-8 lg:h-10 lg:w-10" />
          </div>
          <p className="text-sm lg:text-base text-gray-600 max-w-2xl mx-auto">
            Weather forecasts predict a week ahead. We change plans based on them - only to find the promised rain never came, or the heatwave was actually mild.</p>
            <p className="text-sm lg:text-base text-gray-600 max-w-2xl mx-auto mt-3 lg:mt-5">
            <strong>Weather Postcast</strong> lets you see what the <a target="_blank" href="https://www.bom.gov.au/" className="text-blue-600 font-bold hover:underline">Bureau of Meteorology</a> predicted for today's weather, over the past 7 days, and compare those predictions to actual conditions. Use this to decide how much faith to place in future long-term predictions!
          </p>
          <p className="text-sm lg:text-base text-gray-600 max-w-2xl mx-auto mt-3 lg:mt-5">This tool isn't meant to criticise the BOM's weather forecasts — it's about understanding forecast reliability. By comparing predictions made at different time horizons, you can see how accuracy changes as forecasts get closer to the actual date.</p>
        </div>
      </header>

      {/* Search Section */}
      <section className="max-w-7xl mx-auto px-4 py-4 lg:py-6">
        <CitySearch cities={cities} onSelect={handleCityClick} />
      </section>

      {/* Map Section - responsive height */}
      <section className="max-w-7xl mx-auto px-4 pb-4">
        <div className="relative h-[300px] md:h-[400px] lg:h-[500px] rounded-lg overflow-hidden shadow-md touch-manipulation">
          {iconsLoading && (
            <div className="absolute top-4 right-4 z-10 bg-white/80 px-3 py-1 rounded-full text-sm text-gray-600">
              Loading weather...
            </div>
          )}
          <MapComponent
            cities={cities}
            onCityClick={handleCityClick}
            size="full"
            weatherIcons={weatherIcons}
          />
        </div>
      </section>

      {/* Capital Cities Section */}
      <section className="max-w-7xl mx-auto px-4 py-4 lg:py-6">
        <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-3 lg:mb-4">
          Here are the predictions for today's weather, over the past 7 days:
        </h2>

        <div className="space-y-2">
          {/* Column headers - hidden on mobile, visible on lg+ */}
          <div className="hidden lg:flex items-center gap-4 px-4">
            <div className="w-32 flex-shrink-0" />
            <div className="flex-1 grid grid-cols-8 gap-1 xl:gap-2">
              {[7, 6, 5, 4, 3, 2, 1, 0].map((daysAhead) => (
                <div key={daysAhead} className="text-center text-[10px] xl:text-xs text-gray-500 font-medium">
                  {daysAhead === 0 ? "Today" : `${daysAhead}d ago`}
                </div>
              ))}
            </div>
          </div>
          {CAPITAL_CITIES.map(({ city, state }) => (
            <CapitalCityRow
              key={`${state}-${city}`}
              city={city}
              state={state}
              onClick={() => handleCapitalClick(city, state)}
            />
          ))}
        </div>
      </section>

      
    </div>
  );
}

export default HomePage;
