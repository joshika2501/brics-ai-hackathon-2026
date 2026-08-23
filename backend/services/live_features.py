from datetime import datetime
import time

import numpy as np
import pandas as pd
import requests


AIR_QUALITY_URL = (
    "https://air-quality-api.open-meteo.com/v1/air-quality"
)

WEATHER_URL = (
    "https://api.open-meteo.com/v1/forecast"
)

# Retry configuration for transient network/API failures.
MAX_RETRIES = 3
RETRY_DELAY_SECONDS = 2


def _get_with_retry(
    url: str,
    params: dict,
    timeout: int = 20,
):
    """
    Perform a GET request with retries for transient
    network/SSL/API failures.

    No environmental values are fabricated. If all retries
    fail, the original request error is raised.
    """

    last_error = None

    for attempt in range(1, MAX_RETRIES + 1):

        try:

            response = requests.get(
                url,
                params=params,
                timeout=timeout,
            )

            response.raise_for_status()

            return response

        except requests.exceptions.RequestException as exc:

            last_error = exc

            if attempt < MAX_RETRIES:

                time.sleep(
                    RETRY_DELAY_SECONDS * attempt
                )

            else:

                raise RuntimeError(
                    "Unable to retrieve live environmental "
                    f"data after {MAX_RETRIES} attempts. "
                    f"Endpoint: {url}. "
                    f"Reason: {exc}"
                ) from exc

    raise RuntimeError(
        "Unable to retrieve live environmental data."
    ) from last_error


def get_live_feature_row(
    latitude: float,
    longitude: float,
) -> dict:
    """
    Retrieve recent hourly environmental data and construct
    the same feature representation used during model training.

    The returned dictionary represents the latest complete
    observation available for prediction.
    """

    # ---------------------------------------------------------
    # Air quality
    # ---------------------------------------------------------

    air_params = {
        "latitude": latitude,
        "longitude": longitude,
        "hourly": (
            "pm2_5,"
            "pm10,"
            "nitrogen_dioxide"
        ),
        "timezone": "UTC",
        "forecast_days": 1,
        "past_days": 1,
    }

    air_response = _get_with_retry(
        AIR_QUALITY_URL,
        params=air_params,
        timeout=20,
    )

    air_data = air_response.json()
    air_hourly = air_data["hourly"]

    # ---------------------------------------------------------
    # Weather
    # ---------------------------------------------------------

    weather_params = {
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
        "past_days": 1,
    }

    weather_response = _get_with_retry(
        WEATHER_URL,
        params=weather_params,
        timeout=20,
    )

    weather_data = weather_response.json()
    weather_hourly = weather_data["hourly"]

    # ---------------------------------------------------------
    # Build separate dataframes
    # ---------------------------------------------------------

    air_df = pd.DataFrame(
        {
            "time": pd.to_datetime(
                air_hourly["time"]
            ),
            "pm2_5": air_hourly["pm2_5"],
            "pm10": air_hourly["pm10"],
            "nitrogen_dioxide": air_hourly[
                "nitrogen_dioxide"
            ],
        }
    )

    weather_df = pd.DataFrame(
        {
            "time": pd.to_datetime(
                weather_hourly["time"]
            ),
            "temperature_2m": weather_hourly[
                "temperature_2m"
            ],
            "relative_humidity_2m": weather_hourly[
                "relative_humidity_2m"
            ],
            "wind_speed_10m": weather_hourly[
                "wind_speed_10m"
            ],
            "wind_direction_10m": weather_hourly[
                "wind_direction_10m"
            ],
            "surface_pressure": weather_hourly[
                "surface_pressure"
            ],
            "precipitation": weather_hourly[
                "precipitation"
            ],
        }
    )

    # ---------------------------------------------------------
    # Align air quality + weather by timestamp
    # ---------------------------------------------------------

    df = pd.merge(
        air_df,
        weather_df,
        on="time",
        how="inner",
    )

    df = df.sort_values(
        "time"
    ).reset_index(drop=True)

    # ---------------------------------------------------------
    # Remove incomplete observations
    # ---------------------------------------------------------

    required_columns = [
        "pm2_5",
        "pm10",
        "nitrogen_dioxide",
        "temperature_2m",
        "relative_humidity_2m",
        "wind_speed_10m",
        "wind_direction_10m",
        "surface_pressure",
        "precipitation",
    ]

    df = df.dropna(
        subset=required_columns
    ).reset_index(drop=True)

    if len(df) < 7:

        raise ValueError(
            "Not enough recent environmental observations "
            "to construct lag and rolling features."
        )

    # ---------------------------------------------------------
    # Historical PM2.5 features
    # ---------------------------------------------------------

    df["pm25_lag_1"] = (
        df["pm2_5"].shift(1)
    )

    df["pm25_lag_3"] = (
        df["pm2_5"].shift(3)
    )

    df["pm25_lag_6"] = (
        df["pm2_5"].shift(6)
    )

    # ---------------------------------------------------------
    # Rolling PM2.5 statistics
    # ---------------------------------------------------------

    df["pm25_rolling_mean_6h"] = (
        df["pm2_5"]
        .shift(1)
        .rolling(6)
        .mean()
    )

    df["pm25_rolling_std_6h"] = (
        df["pm2_5"]
        .shift(1)
        .rolling(6)
        .std()
    )

    # ---------------------------------------------------------
    # NO2 trend
    # ---------------------------------------------------------

    df["no2_change"] = (
        df["nitrogen_dioxide"]
        .diff(1)
    )

    # ---------------------------------------------------------
    # Time features
    # ---------------------------------------------------------

    df["hour"] = df["time"].dt.hour

    df["day_of_week"] = (
        df["time"].dt.dayofweek
    )

    # ---------------------------------------------------------
    # Cyclical time
    # ---------------------------------------------------------

    df["hour_sin"] = np.sin(
        2 * np.pi * df["hour"] / 24
    )

    df["hour_cos"] = np.cos(
        2 * np.pi * df["hour"] / 24
    )

    df["dow_sin"] = np.sin(
        2 * np.pi * df["day_of_week"] / 7
    )

    df["dow_cos"] = np.cos(
        2 * np.pi * df["day_of_week"] / 7
    )

    # ---------------------------------------------------------
    # Wind vector
    # ---------------------------------------------------------

    wind_direction_rad = np.deg2rad(
        df["wind_direction_10m"]
    )

    df["wind_x"] = (
        df["wind_speed_10m"]
        * np.cos(wind_direction_rad)
    )

    df["wind_y"] = (
        df["wind_speed_10m"]
        * np.sin(wind_direction_rad)
    )

    # ---------------------------------------------------------
    # Select latest complete feature row
    # ---------------------------------------------------------

    feature_columns = [
        "pm2_5",
        "pm10",
        "nitrogen_dioxide",
        "temperature_2m",
        "relative_humidity_2m",
        "wind_speed_10m",
        "wind_direction_10m",
        "surface_pressure",
        "precipitation",
        "pm25_lag_1",
        "pm25_lag_3",
        "pm25_lag_6",
        "pm25_rolling_mean_6h",
        "pm25_rolling_std_6h",
        "no2_change",
        "hour",
        "day_of_week",
        "hour_sin",
        "hour_cos",
        "dow_sin",
        "dow_cos",
        "wind_x",
        "wind_y",
    ]

    valid = df.dropna(
        subset=feature_columns
    )

    if valid.empty:

        raise ValueError(
            "Unable to construct a complete "
            "live feature vector."
        )

    latest = valid.iloc[-1]

    return {
        "timestamp": str(
            latest["time"]
        ),
        "current_pm25": float(
            latest["pm2_5"]
        ),
        "features": {
            column: float(
                latest[column]
            )
            for column in feature_columns
        },
    }