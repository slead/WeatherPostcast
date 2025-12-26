/**
 * ReverseForecast component for displaying all predictions for a single date
 * Feature: weather-dashboard
 *
 * Shows today's actual weather prominently, then historical predictions
 * showing what was forecast X days ago.
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WeatherIcon } from '@/components/WeatherIcon';
import { formatDate } from '@/utils/dateFormatter';
import { cn } from '@/lib/utils';
import type { ForecastRecord, PredictionEntry } from '@/types';

export interface ReverseForecastProps {
  /** The forecast date in ISO format (YYYY-MM-DD) */
  forecastDate: string;
  /** Predictions keyed by days-ahead value (as strings) */
  predictions: ForecastRecord;
  /** Optional additional CSS classes */
  className?: string;
  /** Maximum days-ahead to display (default: 7) */
  maxDaysAhead?: number;
}

/**
 * Formats a temperature value with °C symbol
 * Returns placeholder for null values
 */
function formatTemperature(temp: number | null): string {
  if (temp === null) {
    return '--';
  }
  return `${temp}°C`;
}

/**
 * Formats the temperature range (min/max)
 */
function formatTemperatureRange(
  tempMin: number | null,
  tempMax: number | null
): string {
  const min = formatTemperature(tempMin);
  const max = formatTemperature(tempMax);
  return `${min} / ${max}`;
}

/**
 * Formats precipitation probability for display
 */
function formatPrecipitation(precipitationProb: string | null): string {
  if (precipitationProb === null || precipitationProb === '') {
    return 'N/A';
  }
  return precipitationProb;
}

/**
 * Formats the historical prediction label
 * e.g., "Predicted 3 days ago"
 */
function formatHistoricalLabel(daysAhead: number): string {
  if (daysAhead === 1) {
    return 'Predicted yesterday';
  }
  return `Predicted ${daysAhead} days ago`;
}

/**
 * Today's actual weather card - full width, prominent display
 */
interface TodayWeatherCardProps {
  prediction: PredictionEntry | null;
}

const TodayWeatherCard: React.FC<TodayWeatherCardProps> = ({ prediction }) => {
  if (!prediction) {
    return (
      <Card className="bg-muted/50 border-dashed">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-24 text-muted-foreground">
            <span className="text-lg">No weather data available yet</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { icon_code, temp_max, precipitation_prob, precis, forecast } =
    prediction;

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-sky-50 border-blue-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-blue-900">
          Today's Actual Weather
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col md:flex-row items-center gap-6 pb-6">
        {/* Weather Icon - larger */}
        <div className="flex-shrink-0">
          <WeatherIcon iconCode={icon_code} size="large" />
        </div>

        {/* Weather details */}
        <div className="flex-1 text-center md:text-left space-y-2">
          {/* Temperature - Today only has max temp available */}
          <div className="text-2xl font-bold text-gray-900">
            <span className="text-base font-medium text-gray-600">Max: </span>
            {formatTemperature(temp_max)}
          </div>

          {/* Precipitation */}
          <div className="text-sm text-gray-600">
            <span className="font-medium">Chance of rain: </span>
            {formatPrecipitation(precipitation_prob)}
          </div>

          {/* Precis / Forecast */}
          {(forecast || precis) && (
            <p className="text-gray-700">{forecast || precis}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Historical prediction card - compact display
 */
interface HistoricalPredictionCardProps {
  daysAhead: number;
  prediction: PredictionEntry | null;
}

const HistoricalPredictionCard: React.FC<HistoricalPredictionCardProps> = ({
  daysAhead,
  prediction,
}) => {
  // Show placeholder for missing predictions (Requirement 4.4)
  if (!prediction) {
    return (
      <Card className="bg-muted/50 border-dashed">
        <CardHeader className="pb-2 pt-3 px-3">
          <CardTitle className="text-xs font-medium text-muted-foreground">
            {formatHistoricalLabel(daysAhead)}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          <div className="flex flex-col items-center justify-center h-24 text-muted-foreground">
            <span className="text-sm">No data</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { icon_code, temp_min, temp_max, precipitation_prob, precis, forecast } =
    prediction;

  // Build tooltip text from available forecast info
  const tooltipText = forecast || precis || null;

  return (
    <div className="group relative">
      <Card className="cursor-pointer transition-shadow hover:shadow-md h-full">
        <CardHeader className="pb-2 pt-3 px-3">
          <CardTitle className="text-xs font-medium text-amber-700">
            {formatHistoricalLabel(daysAhead)}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3 space-y-2">
          {/* Weather Icon */}
          <div className="flex justify-center">
            <WeatherIcon iconCode={icon_code} size="medium" />
          </div>

          {/* Temperature Range */}
          <div className="text-center">
            <span className="text-sm font-semibold">
              {formatTemperatureRange(temp_min, temp_max)}
            </span>
          </div>

          {/* Precipitation Probability */}
          <div className="text-center text-xs text-muted-foreground">
            <span className="font-medium">Rain: </span>
            {formatPrecipitation(precipitation_prob)}
          </div>

          {/* Precis (short description) - truncated */}
          {precis !== null && precis !== '' && (
            <p className="text-xs text-center text-muted-foreground line-clamp-2">
              {precis}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Custom tooltip - appears on hover */}
      {tooltipText && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-4 py-3 bg-gray-900 text-white text-sm rounded-lg shadow-lg w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none">
          <div className="text-center">{tooltipText}</div>
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
};

/**
 * Gets historical days-ahead values (1 to maxDaysAhead), sorted from highest to lowest
 * Requirements: 4.2 - Order from highest days-ahead to lowest
 */
export function getHistoricalDaysAhead(maxDaysAhead: number): number[] {
  const days: number[] = [];
  for (let i = maxDaysAhead; i >= 1; i--) {
    days.push(i);
  }
  return days;
}

/**
 * ReverseForecast component that displays today's actual weather prominently,
 * followed by historical predictions showing what was forecast X days ago.
 *
 * - Today's weather (days-ahead = 0) shown as full-width prominent card
 * - Historical predictions (days 1-7) shown in grid below
 * - Labels emphasize these are past predictions for today
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */
export const ReverseForecast: React.FC<ReverseForecastProps> = ({
  forecastDate,
  predictions,
  className,
  maxDaysAhead = 7,
}) => {
  // Get historical days (1 to maxDaysAhead, highest to lowest)
  const historicalDays = getHistoricalDaysAhead(maxDaysAhead);

  // Format the date for display
  const formattedDate = formatDate(forecastDate, { short: true });

  // Get today's actual weather (days-ahead = 0)
  const todayPrediction = predictions['0'] ?? null;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Date Header */}
      <h3 className="text-lg font-semibold">{formattedDate}</h3>

      {/* Today's Actual Weather - full width prominent card */}
      <TodayWeatherCard prediction={todayPrediction} />

      {/* Historical Predictions Section */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-600">
          How accurate were the predictions for today's weather?
        </h4>

        {/* Historical predictions grid - 7 columns on desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {historicalDays.map((daysAhead) => (
            <HistoricalPredictionCard
              key={daysAhead}
              daysAhead={daysAhead}
              prediction={predictions[daysAhead.toString()] ?? null}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReverseForecast;
