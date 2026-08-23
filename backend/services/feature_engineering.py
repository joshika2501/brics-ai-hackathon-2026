import pandas as pd
import numpy as np


def create_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Create time-series features for 6-hour-ahead PM2.5 prediction.

    The function assumes that the input dataframe contains:
    - time
    - pm2_5
    - pm10
    - nitrogen_dioxide
    - temperature_2m
    - relative_humidity_2m
    - wind_speed_10m
    - wind_direction_10m
    - surface_pressure
    - precipitation
    - city
    - country
    """

    df = df.copy()

    # Ensure chronological ordering within each city.
    df["time"] = pd.to_datetime(df["time"])

    df = df.sort_values(
        ["country", "city", "time"]
    ).reset_index(drop=True)

    # ---------------------------------------------------------
    # Historical PM2.5 features
    # ---------------------------------------------------------

    grouped_pm25 = df.groupby(
        ["country", "city"]
    )["pm2_5"]

    df["pm25_lag_1"] = grouped_pm25.shift(1)
    df["pm25_lag_3"] = grouped_pm25.shift(3)
    df["pm25_lag_6"] = grouped_pm25.shift(6)

    # ---------------------------------------------------------
    # Rolling PM2.5 statistics
    # ---------------------------------------------------------

    df["pm25_rolling_mean_6h"] = (
        df.groupby(["country", "city"])["pm2_5"]
        .transform(
            lambda x: x.shift(1).rolling(6).mean()
        )
    )

    df["pm25_rolling_std_6h"] = (
        df.groupby(["country", "city"])["pm2_5"]
        .transform(
            lambda x: x.shift(1).rolling(6).std()
        )
    )

    # ---------------------------------------------------------
    # NO2 trend
    # ---------------------------------------------------------

    df["no2_change"] = (
        df.groupby(["country", "city"])["nitrogen_dioxide"]
        .diff(1)
    )

    # ---------------------------------------------------------
    # Time features
    # ---------------------------------------------------------

    df["hour"] = df["time"].dt.hour
    df["day_of_week"] = df["time"].dt.dayofweek

    # ---------------------------------------------------------
    # Cyclical time features
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
    # Wind vector features
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
    # Prediction target
    #
    # Predict PM2.5 six hours into the future.
    # ---------------------------------------------------------

    df["target_pm25_6h"] = (
        df.groupby(["country", "city"])["pm2_5"]
        .shift(-6)
    )

    # ---------------------------------------------------------
    # Remove rows that cannot have complete lag/target data.
    # ---------------------------------------------------------

    df = df.dropna(
        subset=[
            "pm25_lag_1",
            "pm25_lag_3",
            "pm25_lag_6",
            "pm25_rolling_mean_6h",
            "pm25_rolling_std_6h",
            "no2_change",
            "target_pm25_6h",
        ]
    )

    return df