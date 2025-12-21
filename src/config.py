"""Configuration loader for BOM Weather Tracker.

This module handles loading and validating location configuration
from the JSON configuration file.
"""

from dataclasses import dataclass
from pathlib import Path
import json
import logging

from src.utils import setup_logging

logger = setup_logging()

# Valid Australian state/territory abbreviations
VALID_STATES = frozenset({"NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"})


@dataclass
class LocationConfig:
    """Represents a BOM weather location configuration.
    
    Attributes:
        product_id: BOM Product ID (e.g., "IDD10161")
        city_name: City name (e.g., "Alice Springs")
        state: State abbreviation (e.g., "NT")
    """
    product_id: str
    city_name: str
    state: str


def validate_config_entry(entry: dict) -> LocationConfig | None:
    """Validate a single configuration entry.
    
    Validates that the entry contains non-empty strings for product_id,
    city_name, and state fields, and that state is a valid Australian
    state/territory abbreviation.
    
    Args:
        entry: Dictionary with location configuration data
        
    Returns:
        LocationConfig if valid, None if invalid
    """
    # Check required fields exist and are non-empty strings
    product_id = entry.get("product_id", "")
    city_name = entry.get("city_name", "")
    state = entry.get("state", "")
    
    if not isinstance(product_id, str) or not product_id.strip():
        logger.warning(f"Invalid config entry: missing or empty product_id: {entry}")
        return None
    
    if not isinstance(city_name, str) or not city_name.strip():
        logger.warning(f"Invalid config entry: missing or empty city_name: {entry}")
        return None
    
    if not isinstance(state, str) or not state.strip():
        logger.warning(f"Invalid config entry: missing or empty state: {entry}")
        return None
    
    # Validate state abbreviation
    state_upper = state.strip().upper()
    if state_upper not in VALID_STATES:
        logger.warning(
            f"Invalid config entry: invalid state '{state}' for {city_name}. "
            f"Valid states: {sorted(VALID_STATES)}"
        )
        return None
    
    return LocationConfig(
        product_id=product_id.strip(),
        city_name=city_name.strip(),
        state=state_upper
    )


def load_config(config_path: Path) -> list[LocationConfig]:
    """Load and validate location configuration from JSON file.
    
    Reads the configuration file and validates each entry. Invalid entries
    are logged and skipped.
    
    Args:
        config_path: Path to the JSON configuration file
        
    Returns:
        List of valid LocationConfig objects
        
    Raises:
        FileNotFoundError: If config file doesn't exist
        json.JSONDecodeError: If config file contains invalid JSON
    """
    logger.info(f"Loading configuration from {config_path}")
    
    with open(config_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    locations_data = data.get("locations", [])
    
    if not isinstance(locations_data, list):
        logger.error("Configuration file 'locations' field must be a list")
        return []
    
    valid_configs: list[LocationConfig] = []
    
    for entry in locations_data:
        if not isinstance(entry, dict):
            logger.warning(f"Skipping non-dict entry: {entry}")
            continue
            
        config = validate_config_entry(entry)
        if config is not None:
            valid_configs.append(config)
    
    logger.info(f"Loaded {len(valid_configs)} valid locations from configuration")
    
    return valid_configs
