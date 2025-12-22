"""Data models for BOM Weather Tracker.

This module defines the core data structures for storing location
configuration and forecast data, along with JSON serialization functions.
"""

from dataclasses import dataclass, field
from datetime import date
from typing import Any, Optional
import json


@dataclass
class PredictionEntry:
    """Represents a single prediction for a specific forecast date.
    
    Attributes:
        icon_code: BOM forecast icon code
        temp_min: Minimum temperature in Celsius
        temp_max: Maximum temperature in Celsius
        precipitation_prob: Probability of precipitation text (e.g., "40%")
        forecast: Detailed forecast text
    """
    icon_code: Optional[int] = None
    temp_min: Optional[int] = None
    temp_max: Optional[int] = None
    precipitation_prob: Optional[str] = None
    forecast: Optional[str] = None

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            "icon_code": self.icon_code,
            "temp_min": self.temp_min,
            "temp_max": self.temp_max,
            "precipitation_prob": self.precipitation_prob,
            "forecast": self.forecast,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "PredictionEntry":
        """Create PredictionEntry from dictionary."""
        return cls(
            icon_code=data.get("icon_code"),
            temp_min=data.get("temp_min"),
            temp_max=data.get("temp_max"),
            precipitation_prob=data.get("precipitation_prob"),
            forecast=data.get("forecast"),
        )


@dataclass
class ForecastRecord:
    """Represents all predictions for a specific forecast date.
    
    Attributes:
        forecast_date: The date this forecast is for
        predictions: Dictionary of prediction entries keyed by days_ahead (int as string for JSON)
    """
    forecast_date: date
    predictions: dict[int, PredictionEntry] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for JSON serialization.
        
        Note: Integer keys are converted to strings for JSON compatibility.
        """
        return {
            str(days_ahead): entry.to_dict()
            for days_ahead, entry in self.predictions.items()
        }

    @classmethod
    def from_dict(cls, forecast_date_str: str, data: dict[str, Any]) -> "ForecastRecord":
        """Create ForecastRecord from dictionary.
        
        Args:
            forecast_date_str: The forecast date as ISO string
            data: Dictionary with string keys (days_ahead) mapping to prediction data
        """
        forecast_date = date.fromisoformat(forecast_date_str)
        predictions = {
            int(days_ahead): PredictionEntry.from_dict(entry_data)
            for days_ahead, entry_data in data.items()
        }
        return cls(forecast_date=forecast_date, predictions=predictions)


@dataclass
class LocationData:
    """Complete forecast data for a location, as stored in JSON files.
    
    Attributes:
        product_id: BOM Product ID (e.g., "IDD10161")
        city_name: City name (e.g., "Alice Springs")
        state: State abbreviation (e.g., "NT")
        timezone: Timezone abbreviation (e.g., "CST")
        forecasts: Dictionary of forecast records keyed by forecast_date ISO string
    """
    product_id: str
    city_name: str
    state: str
    timezone: str
    forecasts: dict[str, ForecastRecord] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            "product_id": self.product_id,
            "city_name": self.city_name,
            "state": self.state,
            "timezone": self.timezone,
            "forecasts": {
                forecast_date: record.to_dict()
                for forecast_date, record in self.forecasts.items()
            },
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "LocationData":
        """Create LocationData from dictionary."""
        forecasts = {
            forecast_date: ForecastRecord.from_dict(forecast_date, record_data)
            for forecast_date, record_data in data.get("forecasts", {}).items()
        }
        return cls(
            product_id=data["product_id"],
            city_name=data["city_name"],
            state=data["state"],
            timezone=data["timezone"],
            forecasts=forecasts,
        )


# JSON Serialization/Deserialization Functions

def serialize_location_data(data: LocationData) -> str:
    """Serialize LocationData to JSON string with consistent formatting.
    
    Args:
        data: The location data to serialize
        
    Returns:
        JSON string with 2-space indentation for Git-friendly diffs
    """
    return json.dumps(data.to_dict(), indent=2, sort_keys=True)


def deserialize_location_data(json_str: str) -> LocationData:
    """Deserialize JSON string to LocationData.
    
    Args:
        json_str: JSON string to parse
        
    Returns:
        LocationData instance with all fields intact
    """
    data = json.loads(json_str)
    return LocationData.from_dict(data)
