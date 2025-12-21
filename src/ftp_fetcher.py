"""FTP fetcher module for BOM Weather Tracker.

This module handles downloading XML forecast files from the BOM FTP server
with retry logic and error handling.
"""

import socket
import time
import urllib.request
import urllib.error
from typing import Optional

from src.utils import setup_logging

logger = setup_logging()

# BOM FTP server configuration
BOM_FTP_BASE_URL = "ftp://ftp.bom.gov.au/anon/gen/fwo"
DEFAULT_TIMEOUT = 30  # seconds
DEFAULT_MAX_RETRIES = 3
DEFAULT_INITIAL_DELAY = 1.0  # seconds
DEFAULT_BACKOFF_MULTIPLIER = 2.0


def construct_ftp_url(product_id: str) -> str:
    """Construct the FTP URL for a BOM product ID.
    
    Args:
        product_id: BOM Product ID (e.g., "IDD10161")
        
    Returns:
        Full FTP URL in format ftp://ftp.bom.gov.au/anon/gen/fwo/{product_id}.xml
    """
    return f"{BOM_FTP_BASE_URL}/{product_id}.xml"


def fetch_forecast_xml(
    product_id: str,
    max_retries: int = DEFAULT_MAX_RETRIES,
    timeout: int = DEFAULT_TIMEOUT,
    initial_delay: float = DEFAULT_INITIAL_DELAY,
    backoff_multiplier: float = DEFAULT_BACKOFF_MULTIPLIER,
) -> Optional[str]:
    """Download forecast XML from BOM FTP server.
    
    Fetches the XML forecast file for the given product ID from the BOM
    anonymous FTP server. Implements retry logic with exponential backoff
    for handling transient network failures.
    
    Args:
        product_id: BOM Product ID (e.g., "IDD10161")
        max_retries: Maximum number of retry attempts (default: 3)
        timeout: Request timeout in seconds (default: 30)
        initial_delay: Initial delay between retries in seconds (default: 1.0)
        backoff_multiplier: Multiplier for delay after each retry (default: 2.0)
        
    Returns:
        XML content as string if successful, None on failure after all retries
    """
    url = construct_ftp_url(product_id)
    current_delay = initial_delay
    last_error: Optional[Exception] = None
    
    for attempt in range(max_retries):
        try:
            logger.debug(f"Fetching forecast for {product_id} (attempt {attempt + 1}/{max_retries})")
            
            with urllib.request.urlopen(url, timeout=timeout) as response:
                xml_content = response.read().decode("utf-8")
                logger.debug(f"Successfully fetched forecast for {product_id}")
                return xml_content
                
        except urllib.error.URLError as e:
            last_error = e
            error_msg = str(e.reason) if hasattr(e, 'reason') else str(e)
            
            if attempt < max_retries - 1:
                logger.warning(
                    f"FTP request failed for {product_id} (attempt {attempt + 1}/{max_retries}): "
                    f"{error_msg}. Retrying in {current_delay:.1f}s..."
                )
                time.sleep(current_delay)
                current_delay *= backoff_multiplier
            else:
                logger.error(
                    f"All {max_retries} attempts failed for {product_id}: {error_msg}"
                )
                
        except socket.timeout as e:
            last_error = e
            
            if attempt < max_retries - 1:
                logger.warning(
                    f"Timeout fetching {product_id} (attempt {attempt + 1}/{max_retries}). "
                    f"Retrying in {current_delay:.1f}s..."
                )
                time.sleep(current_delay)
                current_delay *= backoff_multiplier
            else:
                logger.error(
                    f"All {max_retries} attempts timed out for {product_id}"
                )
                
        except Exception as e:
            last_error = e
            
            if attempt < max_retries - 1:
                logger.warning(
                    f"Unexpected error fetching {product_id} (attempt {attempt + 1}/{max_retries}): "
                    f"{type(e).__name__}: {e}. Retrying in {current_delay:.1f}s..."
                )
                time.sleep(current_delay)
                current_delay *= backoff_multiplier
            else:
                logger.error(
                    f"All {max_retries} attempts failed for {product_id}: "
                    f"{type(e).__name__}: {e}"
                )
    
    return None
