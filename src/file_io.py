"""File I/O module for BOM Weather Tracker.

This module handles reading and writing location forecast data to JSON files,
with consistent formatting for Git-friendly diffs.
"""

from pathlib import Path
from typing import Optional

from src.models import LocationData, serialize_location_data, deserialize_location_data
from src.utils import setup_logging

logger = setup_logging()


def get_location_file_path(base_dir: Path, state: str, city_name: str) -> Path:
    """Generate file path for a location's forecast data.
    
    Creates a path in the format: {base_dir}/{state}/{city_name}.json
    
    Args:
        base_dir: Base directory for data files (e.g., Path("data"))
        state: State abbreviation (e.g., "NSW", "VIC")
        city_name: City name (e.g., "Sydney", "Melbourne")
        
    Returns:
        Path object for the location's JSON file
        
    Requirements: 4.1
    
    Examples:
        >>> get_location_file_path(Path("data"), "NSW", "Sydney")
        PosixPath('data/NSW/Sydney.json')
    """
    return base_dir / state / f"{city_name}.json"


def get_archive_file_path(base_dir: Path, state: str, city_name: str) -> Path:
    """Generate file path for a location's archived forecast data.
    
    Creates a path in the format: {base_dir}/archive/{state}/{city_name}.json
    
    Args:
        base_dir: Base directory for data files (e.g., Path("dashboard/public/data"))
        state: State abbreviation (e.g., "NSW", "VIC")
        city_name: City name (e.g., "Sydney", "Melbourne")
        
    Returns:
        Path object for the location's archived JSON file
        
    Examples:
        >>> get_archive_file_path(Path("dashboard/public/data"), "NSW", "Sydney")
        PosixPath('dashboard/public/data/archive/NSW/Sydney.json')
    """
    return base_dir / "archive" / state / f"{city_name}.json"


def read_location_file(file_path: Path) -> Optional[LocationData]:
    """Read existing location JSON file.
    
    Args:
        file_path: Path to the JSON file to read
        
    Returns:
        LocationData if file exists and is valid, None otherwise
        
    Requirements: 3.1
    """
    if not file_path.exists():
        logger.debug(f"Location file does not exist: {file_path}")
        return None
    
    try:
        json_content = file_path.read_text(encoding="utf-8")
        location_data = deserialize_location_data(json_content)
        logger.debug(f"Successfully read location file: {file_path}")
        return location_data
    except Exception as e:
        logger.error(f"Failed to read location file {file_path}: {e}")
        return None


def merge_archive_data(existing_archive: Optional[LocationData], new_archive: LocationData) -> LocationData:
    """Merge new archived data with existing archived data.
    
    Combines forecast records from both datasets, preserving all historical data.
    
    Args:
        existing_archive: Existing archived data, or None if no archive exists
        new_archive: New archived data to merge
        
    Returns:
        Merged LocationData with all archived forecast records
    """
    if existing_archive is None:
        return new_archive
    
    # Merge forecasts from both archives
    merged_forecasts = existing_archive.forecasts.copy()
    
    for forecast_date_str, forecast_record in new_archive.forecasts.items():
        if forecast_date_str in merged_forecasts:
            # Merge predictions for the same forecast date
            existing_record = merged_forecasts[forecast_date_str]
            for days_ahead, prediction in forecast_record.predictions.items():
                existing_record.predictions[days_ahead] = prediction
            # Sort predictions by days_ahead
            existing_record.predictions = dict(sorted(existing_record.predictions.items()))
        else:
            merged_forecasts[forecast_date_str] = forecast_record
    
    # Sort forecasts by date
    existing_archive.forecasts = dict(sorted(merged_forecasts.items()))
    
    return existing_archive


def write_location_file(file_path: Path, data: LocationData) -> None:
    """Write location data to JSON file with consistent formatting.
    
    Creates parent directories as needed. Uses 2-space indentation
    for Git-friendly diffs.
    
    Args:
        file_path: Path to write the JSON file
        data: LocationData to serialize and write
        
    Requirements: 3.1, 4.2
    """
    # Create parent directories if they don't exist
    file_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Serialize and write with consistent formatting
    json_content = serialize_location_data(data)
    file_path.write_text(json_content, encoding="utf-8")
    
    logger.debug(f"Successfully wrote location file: {file_path}")


def write_archive_file(file_path: Path, data: LocationData) -> None:
    """Write archived location data to JSON file.
    
    Reads existing archive data, merges with new data, and writes back.
    Creates parent directories as needed.
    
    Args:
        file_path: Path to write the archived JSON file
        data: LocationData to archive
    """
    # Read existing archive data if it exists
    existing_archive = read_location_file(file_path)
    
    # Merge with existing archive data
    merged_archive = merge_archive_data(existing_archive, data)
    
    # Write merged archive data
    write_location_file(file_path, merged_archive)
    
    logger.debug(f"Successfully wrote archive file: {file_path}")
