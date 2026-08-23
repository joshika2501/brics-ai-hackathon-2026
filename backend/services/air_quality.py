import requests
from datetime import datetime, timezone


OPEN_METEO_URL = "https://air-quality-api.open-meteo.com/v1/air-quality"


def get_air_quality(latitude: float, longitude: float):
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "hourly": "pm2_5,pm10,nitrogen_dioxide",
        "timezone": "UTC",
        "forecast_days": 1,
        "past_days": 1
    }

    response = requests.get(
        OPEN_METEO_URL,
        params=params,
        timeout=20
    )

    response.raise_for_status()

    data = response.json()

    hourly = data.get("hourly", {})

    if not hourly:
        raise ValueError("No air-quality data returned")

    times = hourly.get("time", [])

    if not times:
        raise ValueError("No timestamps returned")

    # Use the latest available observation
    index = len(times) - 1

    return {
        "timestamp": times[index],
        "pm25": hourly.get("pm2_5", [None])[index],
        "pm10": hourly.get("pm10", [None])[index],
        "no2": hourly.get("nitrogen_dioxide", [None])[index]
    }