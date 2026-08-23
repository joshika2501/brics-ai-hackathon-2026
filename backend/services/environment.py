from datetime import datetime

from backend.schemas.environmental import (
    EnvironmentalObservation,
    Location,
    AirQuality,
    Weather,
)

from backend.services.air_quality import get_air_quality
from backend.services.weather import get_weather


def get_current_environment(
    country: str,
    city: str,
    latitude: float,
    longitude: float,
) -> EnvironmentalObservation:

    air_quality = get_air_quality(latitude, longitude)
    weather = get_weather(latitude, longitude)

    # Use the air-quality timestamp as the reference timestamp.
    # The data providers return hourly observations, so this keeps
    # the environmental observation aligned to a single time point.
    timestamp = air_quality.get("timestamp") or weather.get("timestamp")

    if not timestamp:
        raise ValueError("No valid timestamp returned")

    return EnvironmentalObservation(
        location=Location(
            country=country,
            city=city,
            latitude=latitude,
            longitude=longitude,
        ),
        timestamp=datetime.fromisoformat(timestamp),
        air_quality=AirQuality(
            pm25=air_quality.get("pm25"),
            pm10=air_quality.get("pm10"),
            no2=air_quality.get("no2"),
        ),
        weather=Weather(
            temperature=weather.get("temperature"),
            humidity=weather.get("humidity"),
            wind_speed=weather.get("wind_speed"),
            wind_direction=weather.get("wind_direction"),
            pressure=weather.get("pressure"),
            precipitation=weather.get("precipitation"),
        ),
    )