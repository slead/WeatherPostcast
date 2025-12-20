# Requirements Document

## Introduction

The BOM Weather Tracker is a system designed to collect and store daily weather predictions from the Australian Bureau of Meteorology (BOM) API. The system enables retrospective analysis by storing 7-day forecasts daily, allowing users to compare what was predicted for any given day against predictions made on previous days. The system consists of two Python scripts: a one-time location discovery script and a daily prediction collection script, with data stored in Git-friendly JSON files.

## Glossary

- **BOM**: Australian Bureau of Meteorology, the authoritative source for Australian weather data
- **Location Code**: A unique identifier (e.g., "653/225" for Sydney) used in BOM API requests to identify a specific location
- **Prediction Matrix**: A data structure storing forecasts for a location, organized by forecast date and collection date
- **Collection Date**: The date on which a forecast was retrieved from the BOM API
- **Forecast Date**: The future date for which a weather prediction applies
- **Location Discovery Script**: A one-time Python script that extracts location codes from BOM website pages
- **Daily Collection Script**: A Python script run via cron job to collect and store daily forecasts

## Requirements

### Requirement 1

**User Story:** As a system administrator, I want to discover all Australian city locations and their API codes from the BOM website, so that I can configure the daily collection script with valid location data.

#### Acceptance Criteria

1. WHEN the Location Discovery Script is executed THEN the system SHALL navigate to the BOM places page (https://www.bom.gov.au/location/australia#places) and extract all listed city URLs
2. WHEN the Location Discovery Script processes a city page THEN the system SHALL use a headless browser to load the page and capture the API endpoint URL containing the location code
3. WHEN the Location Discovery Script completes THEN the system SHALL output a JSON file containing city names, state abbreviations, URLs, and their corresponding API location codes
4. IF the Location Discovery Script encounters a page that fails to load THEN the system SHALL log the error and continue processing remaining cities
5. WHEN the Location Discovery Script parses an API URL THEN the system SHALL extract the location code pattern (e.g., "653/225") from the URL path
6. WHEN the Location Discovery Script parses a city URL THEN the system SHALL extract the state name from the URL path and convert it to the standard abbreviation (e.g., "new-south-wales" becomes "NSW")

### Requirement 2

**User Story:** As a data analyst, I want to collect daily weather predictions for all configured locations, so that I can build a historical record of forecast accuracy.

#### Acceptance Criteria

1. WHEN the Daily Collection Script is executed THEN the system SHALL read the location configuration file and iterate through all configured locations
2. WHEN the Daily Collection Script requests forecast data THEN the system SHALL call the BOM API endpoint for each location and retrieve the 7-day forecast
3. WHEN the Daily Collection Script receives API response data THEN the system SHALL extract temperature maximums, temperature minimums, precipitation probabilities, and weather icon codes for each forecast day
4. IF the Daily Collection Script encounters an API error THEN the system SHALL log the error with location details and continue processing remaining locations
5. WHEN the Daily Collection Script completes successfully THEN the system SHALL have processed all configured locations within a single execution

### Requirement 3

**User Story:** As a data analyst, I want forecasts stored in a structured format organized by location, so that I can easily query historical predictions for any given day.

#### Acceptance Criteria

1. WHEN the Daily Collection Script stores forecast data THEN the system SHALL save data in JSON format with one file per location containing all recent forecasts
2. WHEN the Daily Collection Script writes forecast data THEN the system SHALL include the collection date, forecast date, location identifier, and all extracted weather metrics
3. WHEN the Daily Collection Script encounters an existing location file THEN the system SHALL append the new predictions to the existing file rather than overwriting
4. WHEN the Daily Collection Script updates a location file THEN the system SHALL delete any records where the forecast date is more than 8 days in the past
5. WHEN the system serializes forecast data to JSON THEN the system SHALL use a consistent schema that can be deserialized back to equivalent data structures
6. WHEN the system deserializes forecast data from JSON THEN the system SHALL reconstruct the original data structure with all fields intact

### Requirement 4

**User Story:** As a developer, I want the data storage to be Git-friendly, so that I can version control the prediction history and serve it via static hosting.

#### Acceptance Criteria

1. WHEN the system creates data files THEN the system SHALL organize files in a directory structure of `data/{state_abbreviation}/{city_name}.json` (e.g., `data/NSW/Sydney.json`)
2. WHEN the system writes JSON files THEN the system SHALL format the JSON with consistent indentation for readable Git diffs
3. WHEN the system derives state abbreviations THEN the system SHALL use standard Australian state/territory codes (NSW, VIC, QLD, SA, WA, TAS, NT, ACT)
4. WHEN the system derives city names THEN the system SHALL match the city name as displayed on the BOM website

### Requirement 5

**User Story:** As a future front-end developer, I want to retrieve all predictions made for a specific date, so that I can display the "reverse forecast" showing what was predicted for today over the past 7 days.

#### Acceptance Criteria

1. WHEN the system stores forecasts THEN the system SHALL organize predictions by forecast date, with each forecast date containing entries keyed by collection date
2. WHEN the system appends a new prediction THEN the system SHALL maintain chronological order of collection dates within each forecast date group
3. WHEN the system stores prediction data THEN the system SHALL include sufficient metadata to identify the source location and timezone
4. WHEN the front-end queries a location file THEN the system SHALL provide up to 8 days of forecast history for each forecast date still within the retention window

### Requirement 6

**User Story:** As a system administrator, I want robust error handling and logging, so that I can diagnose issues with the data collection process.

#### Acceptance Criteria

1. WHEN any script encounters an error THEN the system SHALL log the error with timestamp, error type, and contextual information
2. WHEN the Daily Collection Script starts THEN the system SHALL log the execution start time and number of locations to process
3. WHEN the Daily Collection Script completes THEN the system SHALL log a summary including locations processed, successes, and failures
4. IF a network request times out THEN the system SHALL retry the request up to 3 times before logging a failure
