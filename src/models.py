"""Data models for BOM Weather Tracker.

This module defines the core data structures for storing location
configuration and forecast data, along with JSON serialization functions.
"""

from dataclasses import dataclass, field, asdict
from datetime import datetime
from typing import Any
import json


@dataclass
class Location:
    """Represents a BOM weather location."""
    name: str           # City name as displayed on BOM website
    state: str          # State abbreviation (NSW, VIC, etc.)
    region: str         # Region/district within the state (e.g., "Central Tablelands")
    url: str            # Full BOM city page URL
    api_code: str       # API location code (e.g., "653/225")
    timezone: str       # Timezone for API requests

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "Location":
        """Create Location from dictionary."""
        return cls(
            name=data["name"],
            state=data["state"],
            region=data.get("region", ""),
            url=data["url"],
            api_code=data["api_code"],
            timezone=data["timezone"],
        )


@dataclass
class DailyPrediction:
    """Represents a single day's weather prediction."""
    collection_date: str    # ISO date when forecast was collected
    temp_max_cel: float     # Maximum temperature in Celsius
    temp_min_cel: float     # Minimum temperature in Celsius
    precip_chance: int      # Probability of any precipitation (%)
    precip_10mm_chance: int # Probability of 10mm+ precipitation (%)
    weather_icon: int       # BOM weather icon code

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            "temp_max_cel": self.temp_max_cel,
            "temp_min_cel": self.temp_min_cel,
            "precip_chance": self.precip_chance,
            "precip_10mm_chance": self.precip_10mm_chance,
            "weather_icon": self.weather_icon,
        }

    @classmethod
    def from_dict(cls, collection_date: str, data: dict[str, Any]) -> "DailyPrediction":
        """Create DailyPrediction from dictionary."""
        return cls(
            collection_date=collection_date,
            temp_max_cel=data["temp_max_cel"],
            temp_min_cel=data["temp_min_cel"],
            precip_chance=data["precip_chance"],
            precip_10mm_chance=data["precip_10mm_chance"],
            weather_icon=data["weather_icon"],
        )


@dataclass
class ForecastRecord:
    """Represents all predictions for a specific forecast date."""
    forecast_date: str                              # ISO date this forecast is for
    predictions: dict[str, DailyPrediction] = field(default_factory=dict)  # Keyed by collection_date

    def to_dict(self) -> dict[str, dict[str, Any]]:
        """Convert predictions to dictionary for JSON serialization."""
        return {
            collection_date: pred.to_dict()
            for collection_date, pred in self.predictions.items()
        }

    @classmethod
    def from_dict(cls, forecast_date: str, data: dict[str, dict[str, Any]]) -> "ForecastRecord":
        """Create ForecastRecord from dictionary."""
        predictions = {
            collection_date: DailyPrediction.from_dict(collection_date, pred_data)
            for collection_date, pred_data in data.items()
        }
        return cls(forecast_date=forecast_date, predictions=predictions)


@dataclass
class LocationForecastData:
    """Complete forecast data for a location, as stored in JSON files."""
    location: Location
    forecasts: dict[str, ForecastRecord] = field(default_factory=dict)  # Keyed by forecast_date
    last_updated: str = ""

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            "location": self.location.to_dict(),
            "forecasts": {
                forecast_date: record.to_dict()
                for forecast_date, record in self.forecasts.items()
            },
            "last_updated": self.last_updated,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "LocationForecastData":
        """Create LocationForecastData from dictionary."""
        location = Location.from_dict(data["location"])
        forecasts = {
            forecast_date: ForecastRecord.from_dict(forecast_date, record_data)
            for forecast_date, record_data in data.get("forecasts", {}).items()
        }
        return cls(
            location=location,
            forecasts=forecasts,
            last_updated=data.get("last_updated", ""),
        )


# JSON Serialization/Deserialization Functions

def serialize_forecast_data(data: LocationForecastData) -> str:
    """Serialize LocationForecastData to JSON string with consistent formatting.
    
    Args:
        data: The forecast data to serialize
        
    Returns:
        JSON string with 2-space indentation for Git-friendly diffs
    """
    return json.dumps(data.to_dict(), indent=2, sort_keys=True)


def deserialize_forecast_data(json_str: str) -> LocationForecastData:
    """Deserialize JSON string to LocationForecastData.
    
    Args:
        json_str: JSON string to parse
        
    Returns:
        LocationForecastData instance with all fields intact
    """
    data = json.loads(json_str)
    return LocationForecastData.from_dict(data)


def serialize_locations(locations: list[Location], discovered_at: str) -> str:
    """Serialize location list to JSON string for locations.json.
    
    Args:
        locations: List of Location objects
        discovered_at: ISO timestamp of discovery
        
    Returns:
        JSON string with 2-space indentation
    """
    data = {
        "locations": [loc.to_dict() for loc in locations],
        "discovered_at": discovered_at,
    }
    return json.dumps(data, indent=2, sort_keys=True)


def deserialize_locations(json_str: str) -> tuple[list[Location], str]:
    """Deserialize JSON string to location list.
    
    Args:
        json_str: JSON string to parse
        
    Returns:
        Tuple of (list of Location objects, discovered_at timestamp)
    """
    data = json.loads(json_str)
    locations = [Location.from_dict(loc) for loc in data["locations"]]
    return locations, data.get("discovered_at", "")
