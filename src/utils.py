"""Utility functions for BOM Weather Tracker.

This module provides shared utilities including logging setup,
path generation, and retry logic for network requests.
"""

import logging
import os
import time
from functools import wraps
from typing import Callable, TypeVar, ParamSpec

P = ParamSpec("P")
T = TypeVar("T")


def setup_logging(name: str = "bom_weather_tracker") -> logging.Logger:
    """Configure logging with timestamp and context.
    
    Args:
        name: Logger name
        
    Returns:
        Configured logger instance
    """
    logger = logging.getLogger(name)
    
    if not logger.handlers:
        handler = logging.StreamHandler()
        formatter = logging.Formatter(
            "[%(asctime)s] [%(levelname)s] %(message)s",
            datefmt="%Y-%m-%dT%H:%M:%SZ"
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
    
    return logger


def get_data_filepath(state: str, city: str, base_dir: str = "data") -> str:
    """Generate filepath for city data file.
    
    Args:
        state: State abbreviation (e.g., "NSW")
        city: City name (e.g., "Sydney")
        base_dir: Base directory for data files
        
    Returns:
        Path in format data/{state}/{city}.json
    """
    return os.path.join(base_dir, state, f"{city}.json")


def retry_request(
    max_retries: int = 3,
    delay: float = 1.0,
    backoff: float = 2.0,
    exceptions: tuple = (Exception,),
) -> Callable[[Callable[P, T]], Callable[P, T]]:
    """Decorator for retry logic on network requests.
    
    Implements exponential backoff: delay, delay*backoff, delay*backoff^2, etc.
    
    Args:
        max_retries: Maximum number of retry attempts
        delay: Initial delay between retries in seconds
        backoff: Multiplier for delay after each retry
        exceptions: Tuple of exception types to catch and retry
        
    Returns:
        Decorated function with retry logic
    """
    def decorator(func: Callable[P, T]) -> Callable[P, T]:
        @wraps(func)
        def wrapper(*args: P.args, **kwargs: P.kwargs) -> T:
            logger = setup_logging()
            last_exception = None
            current_delay = delay
            
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except exceptions as e:
                    last_exception = e
                    if attempt < max_retries - 1:
                        logger.warning(
                            f"Attempt {attempt + 1}/{max_retries} failed: {e}. "
                            f"Retrying in {current_delay:.1f}s..."
                        )
                        time.sleep(current_delay)
                        current_delay *= backoff
                    else:
                        logger.error(
                            f"All {max_retries} attempts failed for {func.__name__}: {e}"
                        )
            
            raise last_exception  # type: ignore
        
        return wrapper
    
    return decorator


def ensure_directory_exists(filepath: str) -> None:
    """Ensure the directory for a filepath exists.
    
    Args:
        filepath: Path to a file (directory will be created if needed)
    """
    directory = os.path.dirname(filepath)
    if directory:
        os.makedirs(directory, exist_ok=True)
