# Requirements Document

## Introduction

The BOM Weather Tracker is a system designed to collect and store daily weather predictions from the Australian Bureau of Meteorology (BOM) via their anonymous FTP service. The system enables retrospective analysis by storing 7-day forecasts daily, allowing users to compare what was predicted for any given day against predictions made on previous days. The system consists of a single Python script that downloads XML forecast files from the BOM FTP server, with location mappings stored in a configuration file and forecast data stored in Git-friendly JSON files.

## Glossary

- **BOM**: Australian Bureau of Meteorology, the authoritative source for Australian weather data
- **Product ID**: A unique identifier (e.g., "IDD10161" for Alice Springs) used to identify BOM forecast XML files on the FTP server
- **Prediction Matrix**: A data structure storing forecasts for a location, organized by forecast date and collection date
- **Collection Date**: The date on which a forecast was retrieved from the BOM FTP server
- **Forecast Date**: The future date for which a weather prediction applies
- **Location Configuration**: A JSON file mapping Product IDs to city names and state abbreviations
- **FTP Endpoint**: The BOM anonymous FTP server at ftp://ftp.bom.gov.au/anon/gen/fwo/

## Requirements

### Requirement 1

**User Story:** As a system administrator, I want location mappings stored in a configuration file, so that the collection script knows which XML files to download from the BOM FTP server.

#### Acceptance Criteria

1. WHEN the system is deployed THEN the system SHALL include a JSON configuration file containing all supported town locations with their Product IDs, city names, and state abbreviations
2. WHEN the configuration file is read THEN the system SHALL validate that each entry contains a Product ID, city name, and state abbreviation
3. WHEN the system constructs an FTP URL THEN the system SHALL use the pattern `ftp://ftp.bom.gov.au/anon/gen/fwo/{product_id}.xml` where product_id is the configured Product ID
4. WHEN the configuration file contains an invalid entry THEN the system SHALL log a warning and skip that entry during processing

### Requirement 2

**User Story:** As a data analyst, I want to collect daily weather predictions for all configured locations, so that I can build a historical record of forecast accuracy.

#### Acceptance Criteria

1. WHEN the Collection Script is executed THEN the system SHALL read the location configuration file and iterate through all configured locations
2. WHEN the Collection Script requests forecast data THEN the system SHALL download the XML file from the BOM FTP server for each location
3. WHEN the Collection Script parses XML response data THEN the system SHALL extract temperature maximums, temperature minimums, precipitation probabilities, forecast icon codes, and precis text for each forecast day
4. IF the Collection Script encounters an FTP or parsing error THEN the system SHALL log the error with location details and continue processing remaining locations
5. WHEN the Collection Script completes successfully THEN the system SHALL have processed all configured locations within a single execution

### Requirement 3

**User Story:** As a data analyst, I want forecasts stored in a structured format organized by location, so that I can easily query historical predictions for any given day.

#### Acceptance Criteria

1. WHEN the Collection Script stores forecast data THEN the system SHALL save data in JSON format with one file per location containing all recent forecasts
2. WHEN the Collection Script writes forecast data THEN the system SHALL include the collection date, forecast date, location identifier, and all extracted weather metrics
3. WHEN the Collection Script encounters an existing location file THEN the system SHALL merge the new predictions with the existing file rather than overwriting
4. WHEN the Collection Script updates a location file THEN the system SHALL delete any records where the forecast date is more than 8 days in the past
5. WHEN the system serializes forecast data to JSON THEN the system SHALL use a consistent schema that can be deserialized back to equivalent data structures
6. WHEN the system deserializes forecast data from JSON THEN the system SHALL reconstruct the original data structure with all fields intact

### Requirement 4

**User Story:** As a developer, I want the data storage to be Git-friendly, so that I can version control the prediction history and serve it via static hosting.

#### Acceptance Criteria

1. WHEN the system creates data files THEN the system SHALL organize files in a directory structure of `data/{state_abbreviation}/{city_name}.json` (e.g., `data/NSW/Sydney.json`)
2. WHEN the system writes JSON files THEN the system SHALL format the JSON with consistent indentation for readable Git diffs
3. WHEN the system derives state abbreviations THEN the system SHALL use standard Australian state/territory codes (NSW, VIC, QLD, SA, WA, TAS, NT, ACT)
4. WHEN the system derives city names THEN the system SHALL use the city name as specified in the location configuration file

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
2. WHEN the Collection Script starts THEN the system SHALL log the execution start time and number of locations to process
3. WHEN the Collection Script completes THEN the system SHALL log a summary including locations processed, successes, and failures
4. IF a network request times out THEN the system SHALL retry the request up to 3 times before logging a failure
5. WHEN the Collection Script encounters an XML parsing error THEN the system SHALL log the specific parsing failure and the Product ID that caused it

### Requirement 7

**User Story:** As a developer, I want the XML parsing logic to handle the BOM forecast XML schema correctly, so that all relevant forecast data is extracted accurately.

#### Acceptance Criteria

1. WHEN the system parses a BOM XML file THEN the system SHALL extract the location area element with type="location" containing the forecast periods
2. WHEN the system parses a forecast period THEN the system SHALL extract the start-time-local attribute to determine the forecast date
3. WHEN the system parses a forecast period THEN the system SHALL extract element values for forecast_icon_code, air_temperature_minimum, and air_temperature_maximum
4. WHEN the system parses a forecast period THEN the system SHALL extract text values for probability_of_precipitation and precis
5. WHEN a forecast period is missing optional fields THEN the system SHALL use null values for those fields and continue processing
6. WHEN the system parses the XML THEN the system SHALL extract the issue-time-local from the amoc section to record when the forecast was issued
