# Tech Stack

## Language & Runtime

- Python 3.10+
- Standard library: `xml.etree.ElementTree`, `urllib.request`, `json`, `dataclasses`, `pathlib`

## Dependencies

- `requests` - HTTP client (available but FTP uses urllib)
- `playwright` - Browser automation
- `beautifulsoup4` - HTML parsing
- `geopy` - Geocoding utilities

## Dev Dependencies

- `pytest` - Testing framework
- `hypothesis` - Property-based testing

## Build System

- `setuptools` via `pyproject.toml`
- Package discovery configured for `src/` directory

## Common Commands

```bash
# Run forecast collection
python collect_forecasts.py

# Run for a single city
python collect_forecasts.py --city Sydney

# Verbose logging
python collect_forecasts.py -v

# Run tests
pytest

# Install dependencies
pip install -r requirements.txt

# Install dev dependencies
pip install -e ".[dev]"
```

## Configuration

- `pyproject.toml` - Project metadata, dependencies, pytest/hypothesis settings
- `requirements.txt` - Pinned dependencies for reproducibility
- `data/locations.json` - Location configuration (product IDs, city names, states)
