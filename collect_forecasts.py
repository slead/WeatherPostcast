#!/usr/bin/env python3
"""BOM Weather Tracker - Forecast Collection Script.

This script collects weather forecasts from the Australian Bureau of
Meteorology (BOM) FTP server for all configured locations and stores
them in Git-friendly JSON files.

Usage:
    python collect_forecasts.py [--config CONFIG_PATH] [--data DATA_DIR]

Arguments:
    --config    Path to locations.json configuration file (default: data/locations.json)
    --data      Base directory for data files (default: data)

Requirements: 2.1
"""

import argparse
import logging
import os
import sys
import time
from pathlib import Path

from src.collector import collect_forecasts
from src.utils import setup_logging


def setup_timezone():
    """Set timezone to Australia/Sydney (AEDT) for consistent date handling."""
    try:
        os.environ['TZ'] = 'Australia/Sydney'
        # Call tzset() if available (Unix systems)
        if hasattr(time, 'tzset'):
            time.tzset()
    except Exception:
        # If timezone setting fails, continue with system timezone
        pass


def parse_args() -> argparse.Namespace:
    """Parse command line arguments.
    
    Returns:
        Parsed arguments namespace
    """
    parser = argparse.ArgumentParser(
        description="Collect weather forecasts from BOM FTP server",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    # Run with default paths
    python collect_forecasts.py
    
    # Specify custom config and data paths
    python collect_forecasts.py --config /path/to/locations.json --data /path/to/data
        """,
    )
    
    parser.add_argument(
        "--config",
        type=Path,
        default=Path("dashboard/public/data/locations.json"),
        help="Path to locations.json configuration file (default: dashboard/public/data/locations.json)",
    )
    
    parser.add_argument(
        "--data",
        type=Path,
        default=Path("dashboard/public/data"),
        help="Base directory for data files (default: dashboard/public/data)",
    )
    
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Enable verbose (debug) logging",
    )
    
    parser.add_argument(
        "--city",
        type=str,
        default=None,
        help="Filter to a single city name (e.g., 'Sydney')",
    )
    
    return parser.parse_args()


def main() -> int:
    """Main entry point for forecast collection.
    
    Returns:
        Exit code: 0 for success, 1 for partial failure, 2 for complete failure
    """
    # Set timezone to AEDT for consistent date handling
    setup_timezone()
    
    args = parse_args()
    
    # Configure logging level
    logger = setup_logging()
    if args.verbose:
        logger.setLevel(logging.DEBUG)
    
    # Run collection
    result = collect_forecasts(
        config_path=args.config,
        data_dir=args.data,
        city_filter=args.city,
    )
    
    # Report results
    if result.total == 0:
        print("No locations to process")
        return 2
    
    print(f"\nCollection Summary:")
    print(f"  Total locations: {result.total}")
    print(f"  Successes: {result.successes}")
    print(f"  Failures: {result.failures}")
    
    if result.failures > 0:
        print(f"\nFailed locations:")
        for error in result.errors:
            print(f"  - {error}")
    
    # Return appropriate exit code
    if result.failures == result.total:
        return 2  # Complete failure
    elif result.failures > 0:
        return 1  # Partial failure
    else:
        return 0  # Success


if __name__ == "__main__":
    sys.exit(main())
