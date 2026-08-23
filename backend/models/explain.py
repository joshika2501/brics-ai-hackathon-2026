from pathlib import Path

import joblib
import pandas as pd
import shap


MODEL_DIR = Path("models/trained")

DATASET = Path(
    "data/processed/training_dataset_90d.csv"
)


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


def explain_city(city):

    filename = city.lower().replace(
        " ",
        "_"
    )

    model_path = (
        MODEL_DIR
        / f"xgboost_{filename}_90d.joblib"
    )

    model = joblib.load(model_path)

    df = pd.read_csv(DATASET)

    city_df = (
        df[df["city"] == city]
        .sort_values("time")
        .reset_index(drop=True)
    )

    # Use the final test observation
    observation = city_df[FEATURES].iloc[
        [-1]
    ]

    explainer = shap.TreeExplainer(
        model
    )

    shap_values = explainer(
        observation
    )

    values = shap_values.values[0]

    explanation = pd.DataFrame(
        {
            "feature": FEATURES,
            "shap_value": values,
            "absolute_impact": abs(values),
        }
    ).sort_values(
        "absolute_impact",
        ascending=False,
    )

    prediction = model.predict(
        observation
    )[0]

    print(f"\n{city}")
    print("=" * 60)

    print(
        f"Predicted PM2.5: "
        f"{prediction:.2f}"
    )

    print("\nTop prediction drivers:")

    print(
        explanation.head(10).to_string(
            index=False
        )
    )


def main():

    for city in [
        "Delhi",
        "Johannesburg",
        "Sao Paulo",
    ]:
        explain_city(city)


if __name__ == "__main__":
    main()