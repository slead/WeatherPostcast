# Implementation Plan

- [x] 1. Set up project structure and dependencies

  - Create directory structure: `src/`, `tests/`, `data/`
  - Create `requirements.txt` with dependencies: `requests`, `playwright`, `beautifulsoup4`, `hypothesis`
  - Create `pyproject.toml` or `setup.py` for project configuration
  - Set up pytest configuration in `pytest.ini` or `pyproject.toml`
  - _Requirements: 1.1, 2.1_

- [ ] 2. Implement shared utilities and data models

  - [ ] 2.1 Create data models and serialization
    - Implement `Location` and `ForecastRecord` dataclasses in `src/models.py`
    - Implement JSON serialization/deserialization functions
    - _Requirements: 3.5, 3.6_
  - [ ]\* 2.2 Write property test for round-trip serialization
    - **Property 1: Forecast Data Round-Trip Serialization**
    - **Validates: Requirements 3.5, 3.6**
  - [ ] 2.3 Implement utility functions
    - Create `src/utils.py` with logging setup, path generation, and retry decorator
    - Implement `get_data_filepath(state, city)` function
    - Implement `retry_request` decorator with configurable retries
    - _Requirements: 4.1, 6.1, 6.4_
  - [ ]\* 2.4 Write property test for path generation
    - **Property 10: Data File Path Generation**
    - **Validates: Requirements 4.1**
  - [ ]\* 2.5 Write property test for retry mechanism
    - **Property 9: Retry Mechanism Attempts**
    - **Validates: Requirements 6.4**

- [ ] 3. Implement state name mapping

  - [ ] 3.1 Create state abbreviation mapping function
    - Implement `state_name_to_abbrev()` in `src/utils.py`
    - Handle all 8 Australian states/territories
    - _Requirements: 1.6, 4.3_
  - [ ]\* 3.2 Write property test for state mapping
    - **Property 3: State Name to Abbreviation Mapping**
    - **Validates: Requirements 1.6, 4.3**

- [ ] 4. Implement location discovery script

  - [ ] 4.1 Implement places page parsing
    - Create `src/discover_locations.py`
    - Implement `fetch_places_page()` to retrieve BOM places page
    - Implement `parse_city_links()` to extract city URLs and names from HTML
    - _Requirements: 1.1_
  - [ ] 4.2 Implement API URL extraction
    - Implement `extract_api_code()` using Playwright headless browser
    - Capture network requests to identify API endpoint
    - Implement `parse_api_url()` to extract location code from URL
    - _Requirements: 1.2, 1.5_
  - [ ]\* 4.3 Write property test for API URL parsing
    - **Property 2: API URL Location Code Extraction**
    - **Validates: Requirements 1.5**
  - [ ] 4.4 Implement discovery orchestration
    - Implement `discover_all_locations()` main function
    - Handle partial failures gracefully
    - Output `locations.json` with all discovered locations
    - _Requirements: 1.3, 1.4_
  - [ ]\* 4.5 Write property test for partial failure resilience
    - **Property 8: Partial Failure Resilience**
    - **Validates: Requirements 1.4, 2.4**

- [ ] 5. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement forecast collection script

  - [ ] 6.1 Implement API response parsing
    - Create `src/collect_forecasts.py`
    - Implement `fetch_forecast()` to call BOM API with retry logic
    - Implement `parse_forecast()` to extract weather metrics from API response
    - _Requirements: 2.2, 2.3_
  - [ ]\* 6.2 Write property test for API response parsing
    - **Property 4: API Response Field Extraction**
    - **Validates: Requirements 2.3**
  - [ ] 6.3 Implement forecast data merging
    - Implement `load_existing_data()` to read existing JSON file
    - Implement `merge_forecasts()` to combine new predictions with existing data
    - _Requirements: 3.3_
  - [ ]\* 6.4 Write property test for merge operation
    - **Property 5: Merge Preserves Existing Data**
    - **Validates: Requirements 3.3**
  - [ ] 6.5 Implement data pruning
    - Implement `prune_old_records()` to remove forecasts older than 8 days
    - _Requirements: 3.4_
  - [ ]\* 6.6 Write property test for pruning
    - **Property 6: Pruning Removes Only Old Records**
    - **Validates: Requirements 3.4**
  - [ ] 6.7 Implement collection date ordering
    - Ensure `merge_forecasts()` maintains chronological order of collection dates
    - _Requirements: 5.2_
  - [ ]\* 6.8 Write property test for chronological ordering
    - **Property 7: Collection Date Chronological Ordering**
    - **Validates: Requirements 5.2**

- [ ] 7. Implement file storage operations

  - [ ] 7.1 Implement JSON file operations
    - Implement `save_forecast_data()` with consistent JSON formatting (2-space indent)
    - Implement `load_locations()` to read location configuration
    - Create state subdirectories as needed
    - _Requirements: 3.1, 4.2, 5.1_

- [ ] 8. Implement collection orchestration and logging

  - [ ] 8.1 Implement main collection function
    - Implement `collect_all_forecasts()` orchestration function
    - Add start/completion logging with statistics
    - Handle partial failures and continue processing
    - _Requirements: 2.1, 2.4, 2.5, 6.2, 6.3_

- [ ] 9. Create CLI entry points

  - [ ] 9.1 Add command-line interfaces
    - Add `if __name__ == "__main__"` blocks to both scripts
    - Add argument parsing for optional config file paths
    - Add `--dry-run` option for testing without writing files
    - _Requirements: 1.1, 2.1_

- [ ] 10. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
