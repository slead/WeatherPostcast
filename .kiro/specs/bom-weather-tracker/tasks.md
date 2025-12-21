# Implementation Plan

- [x] 1. Create location configuration file and loader

  - [x] 1.1 Create locations.json with all BOM town Product IDs, city names, and state abbreviations
    - Include all locations from the provided Product ID list (NT, NSW, QLD, SA, TAS, VIC, WA)
    - _Requirements: 1.1_
  - [x] 1.2 Implement LocationConfig dataclass and load_config function
    - Create dataclass with product_id, city_name, state fields
    - Implement JSON loading with validation
    - _Requirements: 1.2_
  - [ ]\* 1.3 Write property test for configuration validation
    - **Property 1: Configuration Validation**
    - **Validates: Requirements 1.2**
  - [ ]\* 1.4 Write property test for state abbreviation validation
    - **Property 9: State Abbreviation Validation**
    - **Validates: Requirements 4.3**

- [ ] 2. Implement FTP fetcher module

  - [ ] 2.1 Implement fetch_forecast_xml function with retry logic
    - Construct FTP URL from product_id
    - Implement 3 retries with exponential backoff
    - Handle timeouts and connection errors
    - _Requirements: 1.3, 6.4_
  - [ ]\* 2.2 Write property test for FTP URL construction
    - **Property 2: FTP URL Construction**
    - **Validates: Requirements 1.3**

- [ ] 3. Implement XML parser module

  - [ ] 3.1 Implement ForecastDay and ParsedForecast dataclasses
    - Define all fields matching the BOM XML schema
    - _Requirements: 2.3_
  - [ ] 3.2 Implement parse_forecast_xml function
    - Extract location area with type="location"
    - Parse all forecast periods with weather data
    - Handle missing optional fields with null values
    - Extract issue-time-local and timezone
    - _Requirements: 2.3, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_
  - [ ]\* 3.3 Write property test for XML parsing completeness
    - **Property 3: XML Parsing Completeness**
    - **Validates: Requirements 2.3, 7.5**

- [ ] 4. Implement data models and serialization

  - [ ] 4.1 Implement CollectionEntry, ForecastRecord, and LocationData dataclasses
    - Define nested structure for forecast storage
    - _Requirements: 3.1, 3.2_
  - [ ] 4.2 Implement JSON serialization and deserialization functions
    - Serialize LocationData to JSON with consistent formatting
    - Deserialize JSON back to LocationData
    - _Requirements: 3.5, 3.6, 4.2_
  - [ ]\* 4.3 Write property test for serialization round trip
    - **Property 7: Serialization Round Trip**
    - **Validates: Requirements 3.5, 3.6**
  - [ ]\* 4.4 Write property test for forecast data completeness
    - **Property 4: Forecast Data Completeness**
    - **Validates: Requirements 3.2**

- [ ] 5. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement data merger and retention

  - [ ] 6.1 Implement merge_forecast function
    - Merge new forecast into existing LocationData
    - Preserve existing collection entries
    - Maintain chronological order of collections
    - _Requirements: 3.3, 5.1, 5.2_
  - [ ] 6.2 Implement apply_retention function
    - Remove forecast records older than 8 days
    - _Requirements: 3.4_
  - [ ]\* 6.3 Write property test for merge preserves existing data
    - **Property 5: Merge Preserves Existing Data**
    - **Validates: Requirements 3.3**
  - [ ]\* 6.4 Write property test for retention policy
    - **Property 6: Retention Policy**
    - **Validates: Requirements 3.4**
  - [ ]\* 6.5 Write property test for data organization structure
    - **Property 10: Data Organization Structure**
    - **Validates: Requirements 5.1, 5.2**

- [ ] 7. Implement file I/O module

  - [ ] 7.1 Implement get_location_file_path function
    - Generate path: data/{state}/{city_name}.json
    - _Requirements: 4.1_
  - [ ] 7.2 Implement read_location_file and write_location_file functions
    - Create parent directories as needed
    - Format JSON with consistent indentation
    - _Requirements: 3.1, 4.2_
  - [ ]\* 7.3 Write property test for file path generation
    - **Property 8: File Path Generation**
    - **Validates: Requirements 4.1**

- [ ] 8. Implement main collection script

  - [ ] 8.1 Implement collect_forecasts orchestrator function
    - Load configuration
    - Iterate through all locations
    - Fetch, parse, merge, and write for each location
    - Handle errors and continue processing
    - _Requirements: 2.1, 2.4, 2.5_
  - [ ] 8.2 Implement logging throughout the collection process
    - Log start time and location count
    - Log errors with context
    - Log completion summary
    - _Requirements: 6.1, 6.2, 6.3, 6.5_
  - [ ] 8.3 Create main entry point script (collect_forecasts.py)
    - Parse command line arguments for config and data paths
    - Execute collection and report results
    - _Requirements: 2.1_

- [ ] 9. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
