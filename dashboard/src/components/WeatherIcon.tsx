/**
 * WeatherIcon component for displaying BOM weather icons
 * Feature: weather-dashboard
 *
 * Renders appropriate weather icon based on BOM icon_code.
 * Supports size variants (small, medium, large) for consistent sizing.
 *
 * Requirements: 6.1, 6.2, 6.3
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { getIconPath, getIconAltText } from '@/utils/iconMapping';

export type WeatherIconSize = 'small' | 'medium' | 'large';

export interface WeatherIconProps {
  /** BOM icon code (1-18) or null for unknown weather */
  iconCode: number | null;
  /** Size variant for consistent sizing across displays */
  size?: WeatherIconSize;
  /** Additional CSS classes */
  className?: string;
}

/** Size mappings for consistent icon dimensions */
const sizeClasses: Record<WeatherIconSize, string> = {
  small: 'w-8 h-8',
  medium: 'w-12 h-12',
  large: 'w-16 h-16',
};

/**
 * WeatherIcon component that renders a weather icon based on BOM icon_code.
 *
 * - Renders the appropriate icon for valid codes (1-18)
 * - Falls back to a default icon for invalid or null codes
 * - Supports three size variants for consistent sizing
 */
export const WeatherIcon: React.FC<WeatherIconProps> = ({
  iconCode,
  size = 'medium',
  className,
}) => {
  const iconPath = getIconPath(iconCode);
  const altText = getIconAltText(iconCode);

  return (
    <img
      src={iconPath}
      alt={altText}
      className={cn(sizeClasses[size], 'object-contain', className)}
      loading="lazy"
    />
  );
};

export default WeatherIcon;
