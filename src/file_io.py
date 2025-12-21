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
