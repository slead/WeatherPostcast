#!/usr/bin/env python3
"""
Geocode Australian cities from locations.json and save as GeoJSON.
Uses Nominatim (OpenStreetMap) for geocoding.
"""

import json
import time
from pathlib import Path
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderServiceError

# State name mapping for better geocoding results
STATE_NAMES = {
    "NSW": "New South Wales",
    "VIC": "Victoria",
    "QLD": "Queensland",
    "SA": "South Australia",
    "WA": "Western Australia",
    "TAS": "Tasmania",
    "NT": "Northern Territory",
    "ACT": "Australian Capital Territory",
}


def geocode_city(geolocator: Nominatim, city: str, state: str) -> tuple[float, float] | None:
    """Geocode a city, returning (longitude, latitude) or None if not found."""
    state_full = STATE_NAMES.get(state, state)
    query = f"{city}, {state_full}, Australia"
    
    try:
        location = geolocator.geocode(query, timeout=10)
        if location:
            return (location.longitude, location.latitude)
        print(f"  Warning: Could not geocode '{query}'")
        return None
    except (GeocoderTimedOut, GeocoderServiceError) as e:
        print(f"  Error geocoding '{query}': {e}")
        return None


def main():
    # Load locations
    locations_path = Path("data/locations.json")
    with open(locations_path) as f:
        data = json.load(f)
    
    locations = data["locations"]
    print(f"Geocoding {len(locations)} cities...")
    
    # Initialize geocoder with a user agent (required by Nominatim)
    geolocator = Nominatim(user_agent="australian_weather_geocoder")
    
    # Build GeoJSON features
    features = []
    for loc in locations:
        city = loc["city_name"]
        state = loc["state"]
        product_id = loc["product_id"]
        
        print(f"Geocoding: {city}, {state}...")
        coords = geocode_city(geolocator, city, state)
        
        if coords:
            feature = {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": list(coords),
                },
                "properties": {
                    "city_name": city,
                    "state": state,
                    "product_id": product_id,
                },
            }
            features.append(feature)
        
        # Respect Nominatim's usage policy (1 request per second)
        time.sleep(1)
    
    # Create GeoJSON structure
    geojson = {
        "type": "FeatureCollection",
        "features": features,
    }
    
    # Save to file
    output_path = Path("data/cities.geojson")
    with open(output_path, "w") as f:
        json.dump(geojson, f, indent=2)
    
    print(f"\nDone! Saved {len(features)} cities to {output_path}")


if __name__ == "__main__":
    main()
