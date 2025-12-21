# Design Document: BOM Weather Tracker

## Overview

The BOM Weather Tracker is a Python-based system that collects daily weather forecasts from the Australian Bureau of Meteorology's anonymous FTP service. The system downloads XML forecast files for configured locations, parses the forecast data, and stores it in a Git-friendly JSON format organized by location and forecast date.

The architecture is intentionally simple: a single Python script reads a configuration file, downloads XML files via FTP, parses the forecast data, and merges it with existing JSON files. This design prioritizes reliability, maintainability, and compatibility with static hosting.

## Architecture

```mermaid
flowchart TD
    subgraph Input
        CONFIG[locations.json<br/>Configuration File]
        FTP[BOM FTP Server<br/>ftp://ftp.bom.gov.au/anon/gen/fwo/]
    end

    subgraph Collection Script
        LOADER[Config Loader]
        FETCHER[FTP Fetcher]
        PARSER[XML Parser]
        MERGER[Data Merger]
        WRITER[JSON Writer]
    end

    subgraph Output
        DATA[data/{state}/{city}.json<br/>Forecast Files]
    end

    CONFIG --> LOADER
    LOADER --> FETCHER
    FTP --> FETCHER
    FETCHER --> PARSER
    PARSER --> MERGER
    DATA --> MERGER
    MERGER --> WRITER
    WRITER --> DATA
```

## Components and Interfaces

### 1. Configuration Loader

Reads and validates the location configuration file.

```python
@dataclass
class LocationConfig:
    product_id: str      # e.g., "IDD10161"
    city_name: str       # e.g., "Alice Springs"
    state: str           # e.g., "NT"

def load_config(config_path: Path) -> list[LocationConfig]:
    """Load and validate location configuration from JSON file."""
    pass

def validate_config_entry(entry: dict) -> LocationConfig | None:
    """Validate a single config entry, return None if invalid."""
    pass
```

### 2. FTP Fetcher

Downloads XML files from the BOM FTP server with retry logic.

```python
def fetch_forecast_xml(product_id: str, max_retries: int = 3) -> str | None:
    """
    Download forecast XML from BOM FTP server.
    Returns XML content as string, or None on failure.
    URL pattern: ftp://ftp.bom.gov.au/anon/gen/fwo/{product_id}.xml
    """
    pass
```

### 3. XML Parser

Parses BOM forecast XML and extracts structured forecast data.

```python
@dataclass
class ForecastDay:
    forecast_date: date           # The date this forecast is for
    icon_code: int | None         # forecast_icon_code element
    temp_min: int | None          # air_temperature_minimum element
    temp_max: int | None          # air_temperature_maximum element
    precipitation_prob: str | None # probability_of_precipitation text
    precis: str | None            # precis text

@dataclass
class ParsedForecast:
    product_id: str
    city_name: str                # From area description attribute
    issue_time: datetime          # From amoc/issue-time-local
    timezone: str                 # From issue-time-local tz attribute
    forecasts: list[ForecastDay]

def parse_forecast_xml(xml_content: str) -> ParsedForecast | None:
    """Parse BOM XML and extract forecast data."""
    pass
```

### 4. Data Merger

Merges new forecast data with existing JSON files, handling retention.

```python
@dataclass
class PredictionEntry:
    icon_code: int | None
    temp_min: int | None
    temp_max: int | None
    precipitation_prob: str | None
    precis: str | None

@dataclass
class ForecastRecord:
    forecast_date: date
    predictions: dict[int, PredictionEntry]  # keyed by days_ahead (0-7)

@dataclass
class LocationData:
    product_id: str
    city_name: str
    state: str
    timezone: str
    forecasts: dict[str, ForecastRecord]  # keyed by forecast_date ISO string

def merge_forecast(existing: LocationData | None, new_forecast: ParsedForecast,
                   collection_date: date, state: str) -> LocationData:
    """Merge new forecast into existing data, calculating days_ahead for each prediction."""
    pass

def apply_retention(data: LocationData, retention_days: int = 8) -> LocationData:
    """Remove forecast records older than retention_days."""
    pass
```

### 5. JSON Writer

Handles reading/writing JSON files with consistent formatting.

```python
def read_location_file(file_path: Path) -> LocationData | None:
    """Read existing location JSON file, return None if not exists."""
    pass

def write_location_file(file_path: Path, data: LocationData) -> None:
    """Write location data to JSON file with consistent formatting."""
    pass

def get_location_file_path(base_dir: Path, state: str, city_name: str) -> Path:
    """Generate file path: data/{state}/{city_name}.json"""
    pass
```

### 6. Main Orchestrator

Coordinates the collection process with logging.

```python
def collect_forecasts(config_path: Path, data_dir: Path) -> CollectionResult:
    """
    Main entry point for forecast collection.
    Returns summary of processed locations.
    """
    pass

@dataclass
class CollectionResult:
    total: int
    successes: int
    failures: int
    errors: list[str]
```

## Data Models

### Location Configuration (locations.json)

```json
{
  "locations": [
    {
      "product_id": "IDD10161",
      "city_name": "Alice Springs",
      "state": "NT"
    },
    {
      "product_id": "IDN11101",
      "city_name": "Armidale",
      "state": "NSW"
    }
  ]
}
```

### Forecast Data (data/{state}/{city}.json)

```json
{
  "product_id": "IDD10161",
  "city_name": "Alice Springs",
  "state": "NT",
  "timezone": "CST",
  "forecasts": {
    "2025-12-21": {
      "0": {
        "icon_code": 16,
        "temp_min": null,
        "temp_max": 38,
        "precipitation_prob": "40%",
        "precis": "Possible shower or storm."
      },
      "1": {
        "icon_code": 16,
        "temp_min": null,
        "temp_max": 37,
        "precipitation_prob": "50%",
        "precis": "Shower or storm likely."
      }
    }
  }
}
```

Note: The integer keys (0, 1, 2, etc.) represent "days ahead" - how many days in advance the prediction was made. A key of "0" means the prediction was collected on the same day as the forecast date, "1" means it was a 1-day forecast, etc.

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Configuration Validation

_For any_ configuration entry dictionary, the validation function should return a valid LocationConfig if and only if the entry contains non-empty strings for product_id, city_name, and state fields.

**Validates: Requirements 1.2**

### Property 2: FTP URL Construction

_For any_ valid product_id string, the constructed FTP URL should match the pattern `ftp://ftp.bom.gov.au/anon/gen/fwo/{product_id}.xml`.

**Validates: Requirements 1.3**

### Property 3: XML Parsing Completeness

_For any_ valid BOM forecast XML containing a location area with forecast periods, the parser should extract all forecast periods with their icon_code, temp_min, temp_max, precipitation_prob, and precis fields (using null for missing optional fields).

**Validates: Requirements 2.3, 7.5**

### Property 4: Forecast Data Completeness

_For any_ forecast data written to JSON, the output should contain forecast_date, days_ahead key, and all weather metrics (icon_code, temp_min, temp_max, precipitation_prob, precis) from the source forecast.

**Validates: Requirements 3.2**

### Property 5: Merge Preserves Existing Data

_For any_ existing LocationData and new ParsedForecast, merging should preserve all existing prediction entries that are not being replaced by the new forecast.

**Validates: Requirements 3.3**

### Property 6: Retention Policy

_For any_ LocationData after applying retention with N days, no forecast_date should be more than N days before the current date.

**Validates: Requirements 3.4**

### Property 7: Serialization Round Trip

_For any_ valid LocationData object, serializing to JSON and deserializing back should produce an equivalent LocationData object.

**Validates: Requirements 3.5, 3.6**

### Property 8: File Path Generation

_For any_ valid state abbreviation and city name, the generated file path should match the pattern `{base_dir}/{state}/{city_name}.json`.

**Validates: Requirements 4.1**

### Property 9: State Abbreviation Validation

_For any_ state string used in the system, it should be one of the valid Australian state/territory codes: NSW, VIC, QLD, SA, WA, TAS, NT, ACT.

**Validates: Requirements 4.3**

### Property 10: Data Organization Structure

_For any_ LocationData after storing forecasts, predictions should be organized by forecast_date with prediction entries keyed by days_ahead (integer 0-7).

**Validates: Requirements 5.1, 5.2**

### Property 11: Days Ahead Calculation

_For any_ forecast with a known collection_date and forecast_date, the days_ahead value should equal (forecast_date - collection_date).days.

**Validates: Requirements 5.2**

## Error Handling

### FTP Errors

- **Connection failures**: Retry up to 3 times with exponential backoff (1s, 2s, 4s)
- **Timeout**: 30-second timeout per request, logged with product_id
- **File not found**: Log warning, skip location, continue processing

### XML Parsing Errors

- **Malformed XML**: Log error with product_id, skip location
- **Missing required elements**: Log warning, use null values for optional fields
- **Invalid date formats**: Log error, skip that forecast period

### File I/O Errors

- **Directory creation**: Create parent directories as needed
- **Write failures**: Log error, do not corrupt existing file
- **Read failures**: Treat as empty file, start fresh

### Logging Strategy

All errors logged with:

- ISO 8601 timestamp
- Error type/category
- Product ID (when applicable)
- Contextual message

## Testing Strategy

### Property-Based Testing

The system will use **Hypothesis** as the property-based testing library for Python.

Each property-based test will:

- Run a minimum of 100 iterations
- Be tagged with a comment referencing the correctness property: `# Feature: bom-weather-tracker, Property {N}: {description}`
- Generate inputs using Hypothesis strategies

Key generators needed:

- `LocationConfig` generator: valid product_ids, city names, states
- `ForecastDay` generator: dates, temperatures, precipitation strings
- `LocationData` generator: nested forecast structures
- `XML content` generator: valid BOM XML structures

### Unit Tests

Unit tests will cover:

- Configuration file loading with valid/invalid JSON
- FTP URL construction edge cases
- XML parsing with sample BOM files
- Date handling and timezone conversion
- File path generation

### Integration Tests

Integration tests will verify:

- End-to-end collection with mock FTP server
- File creation and update workflows
- Retention policy application over multiple runs
