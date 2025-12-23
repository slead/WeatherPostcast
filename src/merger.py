"""Data merger and retention for BOM Weather Tracker.

This module handles merging new forecast data with existing location data
and applying retention policies to remove old forecast records.
"""

from datetime import date
from typing import Optional

from src.models import (
    PredictionEntry,
    ForecastRecord,
    LocationData,
)
from src.xml_parser import ParsedForecast
from src.utils import setup_logging

logger = setup_logging()


def _merge_prediction_entry(
    existing: Optional[PredictionEntry],
    new: PredictionEntry,
) -> PredictionEntry:
    """Merge a new prediction entry with an existing one.
    
    Preserves existing non-null values when the new entry has null/empty values.
    New non-null values will overwrite existing values.
    
    Args:
        existing: Existing prediction entry, or None
        new: New prediction entry from current collection
        
    Returns:
        Merged PredictionEntry with preserved values
    """
    if existing is None:
        return new
    
    return PredictionEntry(
        icon_code=new.icon_code if new.icon_code is not None else existing.icon_code,
        temp_min=new.temp_min if new.temp_min is not None else existing.temp_min,
        temp_max=new.temp_max if new.temp_max is not None else existing.temp_max,
        precipitation_prob=new.precipitation_prob if new.precipitation_prob else existing.precipitation_prob,
        precis=new.precis if new.precis else existing.precis,
        forecast=new.forecast if new.forecast else existing.forecast,
    )


def merge_forecast(
    existing: Optional[LocationData],
    new_forecast: ParsedForecast,
    collection_date: date,
    state: str,
) -> LocationData:
    """Merge new forecast into existing location data.
    
    Creates a new LocationData if existing is None. Preserves all existing
    prediction entries and adds new entries from the parsed forecast.
    Predictions are keyed by days_ahead (integer 0-7).
    
    Args:
        existing: Existing location data, or None if this is the first collection
        new_forecast: Newly parsed forecast data from BOM XML
        collection_date: The date when this forecast was collected
        state: State abbreviation for the location
        
    Returns:
        Updated LocationData with merged forecast data
        
    Requirements: 3.3, 5.1, 5.2
    """
    # Create new LocationData if none exists
    if existing is None:
        existing = LocationData(
            product_id=new_forecast.product_id,
            city_name=new_forecast.city_name,
            state=state,
            timezone=new_forecast.timezone,
            forecasts={},
        )
    
    # Process each forecast day from the new forecast
    for forecast_day in new_forecast.forecasts:
        forecast_date_str = forecast_day.forecast_date.isoformat()
        
        # Calculate days_ahead as (forecast_date - collection_date).days
        days_ahead = (forecast_day.forecast_date - collection_date).days
        
        # Create prediction entry from forecast day
        new_prediction = PredictionEntry(
            icon_code=forecast_day.icon_code,
            temp_min=forecast_day.temp_min,
            temp_max=forecast_day.temp_max,
            precipitation_prob=forecast_day.precipitation_prob,
            precis=forecast_day.precis,
            forecast=forecast_day.forecast,
        )
        
        # Get or create forecast record for this forecast date
        if forecast_date_str in existing.forecasts:
            forecast_record = existing.forecasts[forecast_date_str]
        else:
            forecast_record = ForecastRecord(
                forecast_date=forecast_day.forecast_date,
                predictions={},
            )
            existing.forecasts[forecast_date_str] = forecast_record
        
        # Merge with existing prediction if present, preserving non-null values
        existing_prediction = forecast_record.predictions.get(days_ahead)
        forecast_record.predictions[days_ahead] = _merge_prediction_entry(
            existing_prediction, new_prediction
        )
        
        # Sort predictions by days_ahead to maintain consistent order
        forecast_record.predictions = dict(
            sorted(forecast_record.predictions.items())
        )
    
    # Sort forecasts by date for consistent output
    existing.forecasts = dict(sorted(existing.forecasts.items()))
    
    logger.debug(
        f"Merged {len(new_forecast.forecasts)} forecast days for "
        f"{new_forecast.city_name} (collection date: {collection_date})"
    )
    
    return existing


def apply_retention(
    data: LocationData,
    retention_days: int = 8,
    reference_date: Optional[date] = None,
) -> LocationData:
    """Remove forecast records older than retention_days.
    
    Removes any forecast records where the forecast_date is more than
    retention_days before the reference date (defaults to today).
    
    Args:
        data: Location data to apply retention to
        retention_days: Number of days to retain (default 8)
        reference_date: Date to calculate retention from (default: today)
        
    Returns:
        LocationData with old forecast records removed
        
    Requirements: 3.4
    """
    if reference_date is None:
        reference_date = date.today()
    
    # Calculate cutoff date
    cutoff_date = date.fromordinal(reference_date.toordinal() - retention_days)
    
    # Filter out old forecast records
    retained_forecasts: dict[str, ForecastRecord] = {}
    removed_count = 0
    
    for forecast_date_str, forecast_record in data.forecasts.items():
        if forecast_record.forecast_date >= cutoff_date:
            retained_forecasts[forecast_date_str] = forecast_record
        else:
            removed_count += 1
    
    if removed_count > 0:
        logger.debug(
            f"Retention policy removed {removed_count} forecast records "
            f"older than {cutoff_date} for {data.city_name}"
        )
    
    data.forecasts = retained_forecasts
    return data
