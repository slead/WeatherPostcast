"""XML parser for BOM Weather Tracker.

This module handles parsing BOM forecast XML files and extracting
structured forecast data.
"""

from dataclasses import dataclass
from datetime import date, datetime
from typing import Optional
import xml.etree.ElementTree as ET
import logging

from src.utils import setup_logging

logger = setup_logging()


@dataclass
class ForecastDay:
    """Represents a single day's forecast data extracted from BOM XML.
    
    Attributes:
        forecast_date: The date this forecast is for
        icon_code: BOM forecast icon code (forecast_icon_code element)
        temp_min: Minimum temperature in Celsius (air_temperature_minimum)
        temp_max: Maximum temperature in Celsius (air_temperature_maximum)
        precipitation_prob: Probability of precipitation text (e.g., "40%")
        precis: Short summary forecast text (text type="precis")
        forecast: Detailed forecast text (text type="forecast")
    """
    forecast_date: date
    icon_code: Optional[int] = None
    temp_min: Optional[int] = None
    temp_max: Optional[int] = None
    precipitation_prob: Optional[str] = None
    precis: Optional[str] = None
    forecast: Optional[str] = None


@dataclass
class ParsedForecast:
    """Represents a complete parsed BOM forecast XML.
    
    Attributes:
        product_id: BOM Product ID from the XML identifier
        city_name: City name from the location area description
        issue_time: When the forecast was issued (from amoc/issue-time-local)
        timezone: Timezone abbreviation (from issue-time-local tz attribute)
        forecasts: List of forecast days extracted from the XML
    """
    product_id: str
    city_name: str
    issue_time: datetime
    timezone: str
    forecasts: list[ForecastDay]



def _parse_forecast_period(period_elem: ET.Element) -> Optional[ForecastDay]:
    """Parse a single forecast-period element.
    
    Args:
        period_elem: XML Element for a forecast-period
        
    Returns:
        ForecastDay if parsing succeeds, None if critical data is missing
    """
    # Extract forecast date from start-time-local attribute
    start_time_str = period_elem.get("start-time-local")
    if not start_time_str:
        logger.warning("Forecast period missing start-time-local attribute")
        return None
    
    try:
        # Parse the datetime and extract just the date
        # Format: 2025-12-21T00:00:00+09:30
        forecast_date = datetime.fromisoformat(start_time_str).date()
    except ValueError as e:
        logger.warning(f"Invalid date format in forecast period: {start_time_str} - {e}")
        return None
    
    # Extract element values (icon_code, temp_min, temp_max)
    icon_code: Optional[int] = None
    temp_min: Optional[int] = None
    temp_max: Optional[int] = None
    
    for elem in period_elem.findall("element"):
        elem_type = elem.get("type")
        elem_text = elem.text
        
        if elem_type == "forecast_icon_code" and elem_text:
            try:
                icon_code = int(elem_text)
            except ValueError:
                logger.warning(f"Invalid icon_code value: {elem_text}")
        elif elem_type == "air_temperature_minimum" and elem_text:
            try:
                temp_min = int(elem_text)
            except ValueError:
                logger.warning(f"Invalid temp_min value: {elem_text}")
        elif elem_type == "air_temperature_maximum" and elem_text:
            try:
                temp_max = int(elem_text)
            except ValueError:
                logger.warning(f"Invalid temp_max value: {elem_text}")
    
    # Extract text values (precipitation_prob, precis, forecast)
    precipitation_prob: Optional[str] = None
    precis: Optional[str] = None
    forecast: Optional[str] = None
    
    for text_elem in period_elem.findall("text"):
        text_type = text_elem.get("type")
        text_content = text_elem.text
        
        if text_type == "probability_of_precipitation" and text_content:
            precipitation_prob = text_content.strip()
        elif text_type == "precis" and text_content:
            precis = text_content.strip()
        elif text_type == "forecast" and text_content:
            forecast = text_content.strip()
    
    return ForecastDay(
        forecast_date=forecast_date,
        icon_code=icon_code,
        temp_min=temp_min,
        temp_max=temp_max,
        precipitation_prob=precipitation_prob,
        precis=precis,
        forecast=forecast
    )


def parse_forecast_xml(xml_content: str) -> Optional[ParsedForecast]:
    """Parse BOM forecast XML and extract structured forecast data.
    
    Extracts the location area with type="location", parses all forecast
    periods, and extracts the issue time and timezone from the amoc section.
    
    Args:
        xml_content: Raw XML content as string
        
    Returns:
        ParsedForecast if parsing succeeds, None on failure
    """
    try:
        root = ET.fromstring(xml_content)
    except ET.ParseError as e:
        logger.error(f"Failed to parse XML: {e}")
        return None
    
    # Extract product_id from amoc/identifier
    amoc = root.find("amoc")
    if amoc is None:
        logger.error("XML missing amoc section")
        return None
    
    identifier_elem = amoc.find("identifier")
    if identifier_elem is None or not identifier_elem.text:
        logger.error("XML missing identifier in amoc section")
        return None
    product_id = identifier_elem.text.strip()
    
    # Extract issue-time-local and timezone
    issue_time_elem = amoc.find("issue-time-local")
    if issue_time_elem is None or not issue_time_elem.text:
        logger.error("XML missing issue-time-local in amoc section")
        return None
    
    timezone = issue_time_elem.get("tz", "")
    issue_time_str = issue_time_elem.text.strip()
    
    try:
        issue_time = datetime.fromisoformat(issue_time_str)
    except ValueError as e:
        logger.error(f"Invalid issue-time-local format: {issue_time_str} - {e}")
        return None
    
    # Find the location area (type="location")
    forecast_section = root.find("forecast")
    if forecast_section is None:
        logger.error("XML missing forecast section")
        return None
    
    location_area = None
    for area in forecast_section.findall("area"):
        if area.get("type") == "location":
            location_area = area
            break
    
    if location_area is None:
        logger.error("XML missing location area (type='location')")
        return None
    
    # Extract city name from area description
    city_name = location_area.get("description", "")
    if not city_name:
        logger.error("Location area missing description attribute")
        return None
    
    # Parse all forecast periods
    forecasts: list[ForecastDay] = []
    for period in location_area.findall("forecast-period"):
        forecast_day = _parse_forecast_period(period)
        if forecast_day is not None:
            forecasts.append(forecast_day)
    
    if not forecasts:
        logger.warning(f"No valid forecast periods found for {product_id}")
    
    return ParsedForecast(
        product_id=product_id,
        city_name=city_name,
        issue_time=issue_time,
        timezone=timezone,
        forecasts=forecasts
    )
