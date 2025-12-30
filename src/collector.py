"""Main collection orchestrator for BOM Weather Tracker.

This module provides the main orchestration logic for collecting
weather forecasts from the BOM FTP server for all configured locations.
"""

from dataclasses import dataclass, field
from datetime import date
from pathlib import Path
from typing import Optional

from src.config import load_config, LocationConfig
from src.ftp_fetcher import fetch_forecast_xml
from src.xml_parser import parse_forecast_xml
from src.merger import merge_forecast, archive_old_records
from src.file_io import get_location_file_path, get_archive_file_path, read_location_file, write_location_file, write_archive_file
from src.utils import setup_logging

logger = setup_logging()


@dataclass
class CollectionResult:
    """Summary of a forecast collection run.
    
    Attributes:
        total: Total number of locations to process
        successes: Number of locations successfully processed
        failures: Number of locations that failed
        errors: List of error messages with context
    """
    total: int = 0
    successes: int = 0
    failures: int = 0
    errors: list[str] = field(default_factory=list)


def collect_single_location(
    location: LocationConfig,
    data_dir: Path,
    collection_date: date,
) -> Optional[str]:
    """Collect forecast for a single location.
    
    Fetches XML from BOM FTP, parses it, merges with existing data,
    applies retention policy, and writes to JSON file.
    
    Args:
        location: Location configuration
        data_dir: Base directory for data files
        collection_date: Date of this collection
        
    Returns:
        Error message if failed, None if successful
    """
    product_id = location.product_id
    city_name = location.city_name
    state = location.state
    
    # Step 1: Fetch XML from BOM FTP
    logger.debug(f"Fetching forecast for {city_name} ({product_id})")
    xml_content = fetch_forecast_xml(product_id)
    
    if xml_content is None:
        return f"Failed to fetch XML for {city_name} ({product_id})"
    
    # Step 2: Parse XML
    parsed_forecast = parse_forecast_xml(xml_content)
    
    if parsed_forecast is None:
        return f"Failed to parse XML for {city_name} ({product_id})"
    
    # Step 3: Read existing data (if any)
    file_path = get_location_file_path(data_dir, state, city_name)
    existing_data = read_location_file(file_path)
    
    # Step 4: Merge new forecast with existing data
    merged_data = merge_forecast(
        existing=existing_data,
        new_forecast=parsed_forecast,
        collection_date=collection_date,
        state=state,
    )
    
    # Step 5: Archive old records and get current data
    current_data, archived_data = archive_old_records(merged_data, data_dir)
    
    # Step 6: Write current data to JSON file
    try:
        write_location_file(file_path, current_data)
    except Exception as e:
        return f"Failed to write file for {city_name} ({product_id}): {e}"
    
    # Step 7: Write archived data if any
    if archived_data is not None:
        archive_file_path = get_archive_file_path(data_dir, state, city_name)
        try:
            write_archive_file(archive_file_path, archived_data)
        except Exception as e:
            logger.warning(f"Failed to write archive file for {city_name} ({product_id}): {e}")
            # Don't fail the entire collection if archive write fails
    
    logger.debug(f"Successfully collected forecast for {city_name}")
    return None


def collect_forecasts(
    config_path: Path,
    data_dir: Path,
    collection_date: Optional[date] = None,
    city_filter: Optional[str] = None,
) -> CollectionResult:
    """Main entry point for forecast collection.
    
    Loads configuration, iterates through all locations, and collects
    forecasts for each. Errors are logged and processing continues
    for remaining locations.
    
    Args:
        config_path: Path to the locations.json configuration file
        data_dir: Base directory for data files (e.g., Path("data"))
        collection_date: Date of this collection (defaults to today)
        city_filter: Optional city name to filter to a single location
        
    Returns:
        CollectionResult with summary of processed locations
        
    Requirements: 2.1, 2.4, 2.5, 6.1, 6.2, 6.3, 6.5
    """
    from datetime import datetime
    
    start_time = datetime.now()
    
    if collection_date is None:
        collection_date = date.today()
    
    result = CollectionResult()
    
    # Load configuration
    try:
        locations = load_config(config_path)
    except FileNotFoundError:
        error_msg = f"Configuration file not found: {config_path}"
        logger.error(error_msg)
        result.errors.append(error_msg)
        return result
    except Exception as e:
        error_msg = f"Failed to load configuration: {e}"
        logger.error(error_msg)
        result.errors.append(error_msg)
        return result
    
    # Apply city filter if specified
    if city_filter:
        locations = [loc for loc in locations if loc.city_name.lower() == city_filter.lower()]
        if not locations:
            error_msg = f"No location found matching city: {city_filter}"
            logger.error(error_msg)
            result.errors.append(error_msg)
            return result
    
    result.total = len(locations)
    
    # Log start time and location count (Requirement 6.2)
    logger.info(
        f"Starting forecast collection at {start_time.isoformat()} "
        f"for {result.total} locations"
    )
    
    if result.total == 0:
        logger.warning("No locations found in configuration")
        return result
    
    # Process each location
    for i, location in enumerate(locations, 1):
        logger.info(f"Processing location {i}/{result.total}: {location.city_name} ({location.product_id})")
        
        error = collect_single_location(location, data_dir, collection_date)
        
        if error is None:
            result.successes += 1
            logger.info(f"Successfully collected forecast for {location.city_name}")
        else:
            result.failures += 1
            result.errors.append(error)
            # Error already logged in collect_single_location, but add context
            logger.error(f"Failed to collect forecast for {location.city_name}: {error}")
    
    # Log completion summary (Requirement 6.3)
    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()
    
    logger.info(
        f"Collection completed in {duration:.1f}s - "
        f"Total: {result.total}, Successes: {result.successes}, Failures: {result.failures}"
    )
    
    if result.failures > 0:
        logger.warning(f"Failed locations: {result.failures}")
        for error in result.errors:
            logger.warning(f"  - {error}")
    
    return result
