/**
 * ReverseForecast component for displaying all predictions for a single date
 * Feature: weather-dashboard
 *
 * Shows how predictions for a specific date evolved over time,
 * organized by days-ahead (from highest to lowest).
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WeatherIcon } from '@/components/WeatherIcon';
import { formatDate, formatDaysAhead } from '@/utils/dateFormatter';
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

interface PredictionCardProps {
  daysAhead: number;
  prediction: PredictionEntry | null;
}

/**
 * Individual prediction card within the reverse forecast
 */
const PredictionCard: React.FC<PredictionCardProps> = ({
  daysAhead,
  prediction,
}) => {
  // Show placeholder for missing predictions (Requirement 4.4)
  if (!prediction) {
    return (
      <Card className="bg-muted/50 border-dashed">
        <CardHeader className="pb-2 pt-3 px-3">
          <CardTitle className="text-xs font-medium text-muted-foreground">
            {formatDaysAhead(daysAhead)}
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

  const { icon_code, temp_min, temp_max, precipitation_prob, forecast } =
    prediction;

  return (
    <Card>
      <CardHeader className="pb-2 pt-3 px-3">
        <CardTitle className="text-xs font-medium text-muted-foreground">
          {formatDaysAhead(daysAhead)}
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

        {/* Precis (short description) */}
        {/* {precis !== null && precis !== '' && (
          <p className="text-xs text-center text-muted-foreground line-clamp-2">
            {precis}
          </p>
        )} */}

        {forecast !== null && forecast !== '' && (
          <p className="text-xs text-center text-muted-foreground line-clamp-2">
            {forecast}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Gets all days-ahead values from predictions, sorted from highest to lowest
 * Requirements: 4.2 - Order from highest days-ahead to lowest
 */
export function getSortedDaysAhead(
  predictions: ForecastRecord,
  maxDaysAhead: number
): number[] {
  // Get all available days-ahead values
  const availableDays = Object.keys(predictions)
    .map((key) => parseInt(key, 10))
    .filter((num) => !isNaN(num) && num >= 0 && num <= maxDaysAhead);

  // Create array of all possible days from 0 to max available
  const maxAvailable = availableDays.length > 0 ? Math.max(...availableDays) : 0;
  const allDays: number[] = [];
  for (let i = maxAvailable; i >= 0; i--) {
    allDays.push(i);
  }

  return allDays;
}

/**
 * ReverseForecast component that displays all predictions for a single date.
 *
 * - Shows predictions organized by days-ahead value
 * - Orders from highest days-ahead (oldest prediction) to lowest (most recent)
 * - Labels each entry with its days-ahead value
 * - Shows placeholder for missing days-ahead slots
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */
export const ReverseForecast: React.FC<ReverseForecastProps> = ({
  forecastDate,
  predictions,
  className,
  maxDaysAhead = 7,
}) => {
  // Get sorted days-ahead values (highest to lowest)
  const sortedDays = getSortedDaysAhead(predictions, maxDaysAhead);

  // Format the date for display
  const formattedDate = formatDate(forecastDate, { short: true });

  return (
    <div className={cn('space-y-3', className)}>
      {/* Date Header */}
      <h3 className="text-lg font-semibold">{formattedDate}</h3>

      {/* Predictions Grid - ordered from highest to lowest days-ahead */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {sortedDays.map((daysAhead) => (
          <PredictionCard
            key={daysAhead}
            daysAhead={daysAhead}
            prediction={predictions[daysAhead.toString()] ?? null}
          />
        ))}
      </div>
    </div>
  );
};

export default ReverseForecast;
