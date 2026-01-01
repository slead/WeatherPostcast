# BOM Weather Tracker

A Python application that collects and stores daily weather forecasts from the Australian Bureau of Meteorology (BOM) FTP server.

## Purpose

- Fetches XML forecast data from BOM's public FTP server for ~100 Australian cities
- Parses forecast data (temperatures, precipitation, conditions) for 7-day forecasts
- Stores forecasts in Git-friendly JSON files organized by state/city
- Tracks prediction accuracy by preserving historical forecasts with days-ahead indexing
- Archives old forecast records to separate files for historical analysis

## Data Flow

1. Load location configuration from `data/locations.json`
2. Fetch XML forecasts from `ftp://ftp.bom.gov.au/anon/gen/fwo/{product_id}.xml`
3. Parse XML to extract forecast periods
4. Merge new forecasts with existing data (preserving historical predictions)
5. Apply 8-day retention policy
6. Write to `data/{state}/{city}.json`
