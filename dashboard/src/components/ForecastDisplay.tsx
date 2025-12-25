/**
 * ForecastDisplay component for displaying a single forecast prediction
 * Feature: weather-dashboard
 *
 * Displays weather icon, temperature range, precipitation, and precis
 * using shadcn/ui Card component for layout.
 *
 * Requirements: 3.2, 3.3, 3.4
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WeatherIcon } from '@/components/WeatherIcon';
import { formatDaysAhead } from '@/utils/dateFormatter';
import type { PredictionEntry } from '@/types';

export interface ForecastDisplayProps {
  /** The date this forecast is for (ISO format YYYY-MM-DD) */
  forecastDate: string;
  /** The prediction data to display */
  prediction: PredictionEntry;
  /** Number of days ahead this prediction was made */
  daysAhead: number;
  /** Optional additional CSS classes */
  className?: string;
}

/**
 * Formats a temperature value with °C symbol
 * Returns placeholder for null values
 *
 * Requirements: 3.4 - Display temperatures in Celsius with degree symbol
 */
function formatTemperature(temp: number | null): string {
  if (temp === null) {
    return '--';
  }
  return `${temp}°C`;
}

/**
 * Formats the temperature range (min/max)
 * Handles null values gracefully
 *
 * Requirements: 3.2, 3.3
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
 * Returns placeholder for null values
 *
 * Requirements: 3.3
 */
function formatPrecipitation(precipitationProb: string | null): string {
  if (precipitationProb === null || precipitationProb === '') {
    return 'N/A';
  }
  return precipitationProb;
}

/**
 * ForecastDisplay component that renders a single forecast prediction.
 *
 * - Uses shadcn/ui Card for consistent layout
 * - Displays weather icon, temperature range, precipitation, and precis
 * - Handles null values with appropriate placeholders
 * - Shows days-ahead label for context
 */
export const ForecastDisplay: React.FC<ForecastDisplayProps> = ({
  forecastDate: _forecastDate, // Available for future use (e.g., accessibility labels)
  prediction,
  daysAhead,
  className,
}) => {
  const {
    icon_code,
    temp_min,
    temp_max,
    precipitation_prob,
    precis,
  } = prediction;

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {formatDaysAhead(daysAhead)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Weather Icon */}
        <div className="flex justify-center">
          <WeatherIcon iconCode={icon_code} size="large" />
        </div>

        {/* Temperature Range */}
        <div className="text-center">
          <span className="text-lg font-semibold">
            {formatTemperatureRange(temp_min, temp_max)}
          </span>
        </div>

        {/* Precipitation Probability */}
        <div className="text-center text-sm text-muted-foreground">
          <span className="font-medium">Rain: </span>
          {formatPrecipitation(precipitation_prob)}
        </div>

        {/* Precis (short description) */}
        {precis !== null && precis !== '' && (
          <p className="text-sm text-center text-muted-foreground line-clamp-2">
            {precis}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ForecastDisplay;
