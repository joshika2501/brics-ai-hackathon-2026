import requests


OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"


def get_weather(latitude: float, longitude: float):
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "hourly": (
            "temperature_2m,"
            "relative_humidity_2m,"
            "wind_speed_10m,"
            "wind_direction_10m,"
            "surface_pressure,"
            "precipitation"
        ),
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
        raise ValueError("No weather data returned")

    times = hourly.get("time", [])

    if not times:
        raise ValueError("No timestamps returned")

    index = len(times) - 1

    return {
        "timestamp": times[index],
        "temperature": hourly.get("temperature_2m", [None])[index],
        "humidity": hourly.get("relative_humidity_2m", [None])[index],
        "wind_speed": hourly.get("wind_speed_10m", [None])[index],
        "wind_direction": hourly.get("wind_direction_10m", [None])[index],
        "pressure": hourly.get("surface_pressure", [None])[index],
        "precipitation": hourly.get("precipitation", [None])[index]
    }