# Project Structure

```
├── collect_forecasts.py    # CLI entry point
├── src/                    # Main package
│   ├── collector.py        # Orchestration logic
│   ├── config.py           # Configuration loading/validation
│   ├── file_io.py          # JSON file read/write
│   ├── ftp_fetcher.py      # BOM FTP download with retry
│   ├── merger.py           # Forecast merging and retention
│   ├── models.py           # Data classes (LocationData, ForecastRecord, PredictionEntry)
│   ├── utils.py            # Logging, retry decorator, state mappings
│   └── xml_parser.py       # BOM XML parsing
├── tests/                  # Test suite
│   └── conftest.py         # Shared fixtures
├── data/                   # Forecast data (Git-tracked)
│   ├── locations.json      # Location configuration
│   ├── cities.geojson      # City coordinates
│   └── {STATE}/            # State folders (NSW, VIC, QLD, etc.)
│       └── {City}.json     # Per-city forecast files
```

## Code Conventions

- Dataclasses for all data models with `to_dict()`/`from_dict()` methods
- Type hints throughout (Python 3.10+ syntax)
- Docstrings with Args/Returns sections
- Logging via `setup_logging()` from utils
- JSON files use 2-space indentation for Git-friendly diffs
- State abbreviations: NSW, VIC, QLD, SA, WA, TAS, NT, ACT

## Module Responsibilities

| Module           | Purpose                                                |
| ---------------- | ------------------------------------------------------ |
| `collector.py`   | Main orchestration, iterates locations, handles errors |
| `config.py`      | Loads `locations.json`, validates entries              |
| `ftp_fetcher.py` | Downloads XML with exponential backoff retry           |
| `xml_parser.py`  | Parses BOM XML format, extracts forecast periods       |
| `merger.py`      | Merges new forecasts, applies retention policy         |
| `file_io.py`     | Reads/writes location JSON files                       |
| `models.py`      | Data structures and JSON serialization                 |
