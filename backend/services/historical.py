import requests
import pandas as pd


AIR_QUALITY_URL = "https://air-quality-api.open-meteo.com/v1/air-quality"
WEATHER_URL = "https://archive-api.open-meteo.com/v1/archive"


def get_historical_data(
    latitude: float,
    longitude: float,
    start_date: str,
    end_date: str,
) -> pd.DataFrame:

    air_params = {
        "latitude": latitude,
        "longitude": longitude,
        "start_date": start_date,
        "end_date": end_date,
        "hourly": "pm2_5,pm10,nitrogen_dioxide",
        "timezone": "UTC",
    }

    weather_params = {
        "latitude": latitude,
        "longitude": longitude,
        "start_date": start_date,
        "end_date": end_date,
        "hourly": (
            "temperature_2m,"
            "relative_humidity_2m,"
            "wind_speed_10m,"
            "wind_direction_10m,"
            "surface_pressure,"
            "precipitation"
        ),
        "timezone": "UTC",
    }

    air_response = requests.get(
        AIR_QUALITY_URL,
        params=air_params,
        timeout=30,
    )

    air_response.raise_for_status()

    weather_response = requests.get(
        WEATHER_URL,
        params=weather_params,
        timeout=30,
    )

    weather_response.raise_for_status()

    air_data = air_response.json()["hourly"]
    weather_data = weather_response.json()["hourly"]

    air_df = pd.DataFrame(air_data)
    weather_df = pd.DataFrame(weather_data)

    air_df["time"] = pd.to_datetime(air_df["time"])
    weather_df["time"] = pd.to_datetime(weather_df["time"])

    df = pd.merge(
        air_df,
        weather_df,
        on="time",
        how="inner",
    )

    return df