from pathlib import Path

import joblib
import pandas as pd


MODEL_DIR = Path("models/trained")


FEATURES = [
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


def analyze_city(city):

    filename = city.lower().replace(" ", "_")

    model_path = (
        MODEL_DIR
        / f"xgboost_{filename}_90d.joblib"
    )

    model = joblib.load(model_path)

    importance = model.feature_importances_

    result = pd.DataFrame(
        {
            "feature": FEATURES,
            "importance": importance,
        }
    )

    result = result.sort_values(
        "importance",
        ascending=False,
    )

    print(f"\n{city}")
    print("=" * 50)

    print(
        result.head(10).to_string(
            index=False
        )
    )


def main():

    for city in [
        "Delhi",
        "Johannesburg",
        "Sao Paulo",
    ]:
        analyze_city(city)


if __name__ == "__main__":
    main()