/**
 * CityPage - City forecast page with mini-map and reverse forecast display
 * Feature: weather-dashboard
 *
 * Requirements:
 * - 2.1, 2.2: Display mini-map centered on current city
 * - 3.1: Display forecasts for all available dates
 * - 4.1: Display reverse forecast organized by days-ahead
 * - 5.2: Fetch city's forecast data on demand
 * - 5.3: Display loading indicator
 * - 5.4: Display error message with retry
 */

import { useParams, Link } from 'react-router-dom';
import { useForecast } from '../hooks/useForecast';
import { useCities } from '../context';
import { MiniMap } from '../components/MiniMap';
import { ReverseForecast } from '../components/ReverseForecast';
import { Skeleton } from '../components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert';
import { Button } from '../components/ui/button';

/**
 * Loading skeleton for the city page
 * Requirement 5.3: Display loading indicator
 */
function CityPageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header skeleton with map */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-40 w-full lg:w-64 rounded-lg" />
      </div>

      {/* Forecast skeleton - full width grid */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-32" />
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-44 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}


/**
 * Error display component with retry functionality
 * Requirement 5.4: Display error message and allow retry
 */
interface ErrorDisplayProps {
  error: Error;
  onRetry: () => void;
  cityName: string;
  state: string;
}

function ErrorDisplay({ error, onRetry, cityName, state }: ErrorDisplayProps) {
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Back link */}
      <Link
        to="/"
        className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6"
      >
        ← Back to map
      </Link>

      {/* City header */}
      <h1 className="text-2xl font-bold mb-2">
        {decodeURIComponent(cityName)}
      </h1>
      <p className="text-gray-600 mb-6">{state}</p>

      {/* Error alert */}
      <Alert variant="destructive" className="max-w-lg">
        <AlertTitle>Error loading forecast</AlertTitle>
        <AlertDescription className="mt-2">
          <p className="mb-4">{error.message}</p>
          <Button onClick={onRetry} variant="outline" size="sm">
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}

/**
 * Get today's date in ISO format (YYYY-MM-DD)
 */
function getTodayDateString(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

/**
 * CityPage component
 *
 * Displays forecast data for a specific city with:
 * - Mini-map centered on the city (Requirements 2.1, 2.2)
 * - Reverse forecast for today's date (Requirements 3.1, 4.1)
 * - Loading state with skeletons (Requirement 5.3)
 * - Error state with retry (Requirement 5.4)
 */
export function CityPage() {
  // Extract state and cityName from URL params
  const { state, cityName } = useParams<{ state: string; cityName: string }>();

  // Get city info from context
  const { getCityByName, loading: citiesLoading } = useCities();

  // Fetch forecast data on demand (Requirement 5.2)
  const {
    data: forecastData,
    loading: forecastLoading,
    error: forecastError,
    refetch,
  } = useForecast(state || '', cityName || '');

  // Handle missing URL params
  if (!state || !cityName) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <Alert variant="destructive">
          <AlertTitle>Invalid URL</AlertTitle>
          <AlertDescription>
            <p className="mb-4">City or state not specified in URL.</p>
            <Link to="/">
              <Button variant="outline" size="sm">
                Go to map
              </Button>
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Decode city name from URL
  const decodedCityName = decodeURIComponent(cityName);

  // Show loading skeleton (Requirement 5.3)
  if (forecastLoading || citiesLoading) {
    return <CityPageSkeleton />;
  }

  // Show error with retry (Requirement 5.4)
  if (forecastError) {
    return (
      <ErrorDisplay
        error={forecastError}
        onRetry={refetch}
        cityName={cityName}
        state={state}
      />
    );
  }

  // Get city coordinates for mini-map
  const city = getCityByName(state, decodedCityName);

  // Get today's date and its predictions
  const todayDate = getTodayDateString();
  const todayPredictions = forecastData?.forecasts[todayDate];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Back link */}
      <Link
        to="/"
        className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
      >
        ← Back to map
      </Link>

      {/* Header with city info */}
      <header className="mb-6">
        {/* City info */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            {forecastData?.city_name || decodedCityName}
          </h1>
          <p className="text-gray-600">
            {forecastData?.state || state}
          </p>
        </div>
      </header>

      {/* Forecast section - full width for maximum card space */}
      <main className="space-y-6">
        {/* <h2 className="text-lg font-semibold mb-4">Today's Forecast</h2> */}

        {!todayPredictions ? (
          <Alert>
            <AlertTitle>No forecast data</AlertTitle>
            <AlertDescription>
              No forecast data is available for today yet.
            </AlertDescription>
          </Alert>
        ) : (
          <ReverseForecast
            forecastDate={todayDate}
            predictions={todayPredictions}
            maxDaysAhead={7}
          />
        )}

        {/* Mini-map section (Requirements 2.1, 2.2) - full width below predictions */}
        <section>
          {city ? (
            <MiniMap
              currentCityName={decodedCityName}
              currentState={state}
              className="h-[32rem] w-full rounded-lg overflow-hidden shadow-md blah"
            />
          ) : (
            <div className="h-[32rem] bg-gray-200 rounded-lg flex items-center justify-center">
              <p className="text-gray-500 text-sm">Location not found</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default CityPage;
