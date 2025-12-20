"""Location discovery script for BOM Weather Tracker.

This script discovers all Australian city locations and their API codes
from the BOM website. It navigates to the BOM places page, extracts city
URLs, visits each city page with a headless browser to capture API calls,
and outputs locations.json.
"""

import json
import logging
import re
import time
from datetime import datetime, timezone as dt_timezone
from typing import Any

import requests
from bs4 import BeautifulSoup

from src.models import Location, serialize_locations
from src.utils import (
    setup_logging,
    state_name_to_abbrev,
    retry_request,
    ensure_directory_exists,
)


# BOM places page URL
BOM_PLACES_URL = "https://www.bom.gov.au/places/australia"

# Timezone mapping for Australian states
STATE_TIMEZONES: dict[str, str] = {
    "NSW": "Australia/Sydney",
    "VIC": "Australia/Melbourne",
    "QLD": "Australia/Brisbane",
    "SA": "Australia/Adelaide",
    "WA": "Australia/Perth",
    "TAS": "Australia/Hobart",
    "NT": "Australia/Darwin",
    "ACT": "Australia/Sydney",
}

logger = setup_logging()


@retry_request(max_retries=3, delay=1.0, exceptions=(requests.RequestException,))
def fetch_places_page() -> str:
    """Fetch the BOM places page HTML content.
    
    Returns:
        HTML content of the BOM places page
        
    Raises:
        requests.RequestException: If the request fails after retries
    """
    response = requests.get(BOM_PLACES_URL, timeout=30)
    response.raise_for_status()
    return response.text


def parse_city_links(html: str) -> list[dict[str, str]]:
    """Extract city URLs and names from places page HTML.
    
    Parses the BOM places page HTML to extract all city links,
    including the city name, URL, and state extracted from the URL path.
    
    Args:
        html: HTML content of the BOM places page
        
    Returns:
        List of dictionaries with keys: name, url, state
        Example: [{"name": "Sydney", "url": "https://...", "state": "NSW"}, ...]
    """
    soup = BeautifulSoup(html, "html.parser")
    cities: list[dict[str, str]] = []
    
    # Find all city links - they typically have a specific pattern in the URL
    # BOM city URLs follow pattern: /places/{state}/{city}
    for link in soup.find_all("a", href=True):
        href = link.get("href", "")
        
        # Match city page URLs like /places/nsw/sydney or full URLs
        # Pattern: /places/{state}/{city} or https://www.bom.gov.au/places/{state}/{city}
        match = re.search(
            r"(?:https?://www\.bom\.gov\.au)?/places/([a-z-]+)/([a-z-]+)/?$",
            href,
            re.IGNORECASE,
        )
        
        if match:
            state_slug = match.group(1).lower()
            city_slug = match.group(2).lower()
            
            # Skip non-state paths like "australia" or navigation links
            if state_slug in ("australia", "all"):
                continue
            
            # Try to convert state slug to abbreviation
            try:
                state_abbrev = state_name_to_abbrev(state_slug)
            except ValueError:
                # Not a valid state, skip
                continue
            
            # Get city name from link text or derive from slug
            city_name = link.get_text(strip=True)
            if not city_name:
                # Convert slug to title case: "alice-springs" -> "Alice Springs"
                city_name = city_slug.replace("-", " ").title()
            
            # Build full URL if relative
            if href.startswith("/"):
                full_url = f"https://www.bom.gov.au{href}"
            else:
                full_url = href
            
            # Avoid duplicates
            if not any(c["url"] == full_url for c in cities):
                cities.append({
                    "name": city_name,
                    "url": full_url,
                    "state": state_abbrev,
                })
    
    return cities


def parse_api_url(api_url: str) -> str | None:
    """Extract location code from BOM API URL.
    
    Parses a BOM API URL to extract the location code pattern (e.g., "653/225").
    
    Args:
        api_url: Full BOM API URL containing the location code
        
    Returns:
        Location code string (e.g., "653/225") or None if not found
        
    Examples:
        >>> parse_api_url("https://api.weather.bom.gov.au/v1/locations/r1r0fsn/forecasts/daily")
        'r1r0fsn'
        >>> parse_api_url("https://api.weather.bom.gov.au/v1/locations/653/225/forecasts/daily")
        '653/225'
    """
    # Pattern 1: Geohash-style codes like "r1r0fsn"
    match = re.search(r"/locations/([a-z0-9]+)/forecasts", api_url, re.IGNORECASE)
    if match:
        return match.group(1)
    
    # Pattern 2: Numeric codes like "653/225"
    match = re.search(r"/locations/(\d+/\d+)/forecasts", api_url)
    if match:
        return match.group(1)
    
    # Pattern 3: Just extract anything between /locations/ and /forecasts
    match = re.search(r"/locations/([^/]+(?:/[^/]+)?)/forecasts", api_url)
    if match:
        return match.group(1)
    
    return None


def extract_api_code(city_url: str) -> str | None:
    """Use headless browser to load city page and capture API endpoint.
    
    Loads the city page using Playwright, intercepts network requests to
    identify the BOM API endpoint, and extracts the location code.
    
    Args:
        city_url: Full URL to the BOM city page
        
    Returns:
        Location code like "r1r0fsn" or None if not found
    """
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        logger.error("Playwright not installed. Run: pip install playwright && playwright install")
        return None
    
    api_code: str | None = None
    
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context()
            page = context.new_page()
            
            # Capture network requests to find API calls
            def handle_request(request):
                nonlocal api_code
                url = request.url
                # Look for BOM API forecast requests
                if "api.weather.bom.gov.au" in url and "/forecasts" in url:
                    extracted = parse_api_url(url)
                    if extracted:
                        api_code = extracted
                        logger.debug(f"Found API code: {api_code} from {url}")
            
            page.on("request", handle_request)
            
            # Navigate to the city page and wait for network activity
            page.goto(city_url, wait_until="networkidle", timeout=60000)
            
            # Give extra time for any delayed API calls
            time.sleep(2)
            
            browser.close()
            
    except Exception as e:
        logger.error(f"Error extracting API code from {city_url}: {e}")
        return None
    
    return api_code


def discover_all_locations(output_path: str = "locations.json") -> list[Location]:
    """Main orchestration function for location discovery.
    
    Discovers all Australian city locations from the BOM website:
    1. Fetches the BOM places page
    2. Parses city links from the HTML
    3. Visits each city page to extract API codes
    4. Outputs locations.json with all discovered locations
    
    Handles partial failures gracefully - if a city fails, logs the error
    and continues processing remaining cities.
    
    Args:
        output_path: Path to write the locations.json file
        
    Returns:
        List of successfully discovered Location objects
    """
    logger.info("Starting location discovery...")
    
    # Step 1: Fetch places page
    logger.info(f"Fetching BOM places page: {BOM_PLACES_URL}")
    try:
        html = fetch_places_page()
    except Exception as e:
        logger.error(f"Failed to fetch places page: {e}")
        return []
    
    # Step 2: Parse city links
    city_links = parse_city_links(html)
    logger.info(f"Found {len(city_links)} cities to process")
    
    if not city_links:
        logger.warning("No city links found on places page")
        return []
    
    # Step 3: Extract API codes for each city
    locations: list[Location] = []
    failed_count = 0
    
    for i, city_info in enumerate(city_links, 1):
        city_name = city_info["name"]
        city_url = city_info["url"]
        state = city_info["state"]
        
        logger.info(f"Processing {i}/{len(city_links)}: {city_name} ({state})")
        
        try:
            api_code = extract_api_code(city_url)
            
            if api_code:
                timezone = STATE_TIMEZONES.get(state, "Australia/Sydney")
                location = Location(
                    name=city_name,
                    state=state,
                    url=city_url,
                    api_code=api_code,
                    timezone=timezone,
                )
                locations.append(location)
                logger.info(f"  -> API code: {api_code}")
            else:
                logger.warning(f"  -> No API code found for {city_name}")
                failed_count += 1
                
        except Exception as e:
            logger.error(f"  -> Error processing {city_name}: {e}")
            failed_count += 1
            # Continue processing remaining cities (partial failure resilience)
            continue
    
    # Step 4: Save to locations.json
    if locations:
        discovered_at = datetime.now(dt_timezone.utc).isoformat()
        json_content = serialize_locations(locations, discovered_at)
        
        ensure_directory_exists(output_path)
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(json_content)
        
        logger.info(f"Saved {len(locations)} locations to {output_path}")
    
    # Log summary
    logger.info(
        f"Discovery complete: {len(locations)} success, {failed_count} failed"
    )
    
    return locations


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Discover BOM weather locations and their API codes"
    )
    parser.add_argument(
        "-o", "--output",
        default="locations.json",
        help="Output file path (default: locations.json)"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Run without writing output file"
    )
    parser.add_argument(
        "-v", "--verbose",
        action="store_true",
        help="Enable verbose logging"
    )
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    if args.dry_run:
        logger.info("Dry run mode - no files will be written")
        # For dry run, we still discover but don't save
        locations = discover_all_locations(output_path="/dev/null")
    else:
        locations = discover_all_locations(output_path=args.output)
    
    print(f"\nDiscovered {len(locations)} locations")
