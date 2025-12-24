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

## Dev Server Management

### Prevent Hanging Dev Server

When the agent is about to run `npm run dev`, do not start the server.

Instead:

- Print a reminder: "⚠️ Please start the dev server yourself in a separate terminal using `npm run dev`."
- Do not execute the command.
- Continue with the rest of the agent's work as normal.

If the agent needs a running server to test something, just assume the developer has already started it.
