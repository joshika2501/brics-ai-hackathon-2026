from pathlib import Path

import joblib
import pandas as pd
from xgboost import XGBRegressor

from backend.models.evaluation import evaluate_regression


DATASET = Path(
    "data/processed/training_dataset_90d.csv"
)

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

TARGET = "target_pm25_6h"


def train_city_model(df: pd.DataFrame, city: str):

    city_df = (
        df[df["city"] == city]
        .sort_values("time")
        .reset_index(drop=True)
    )

    n = len(city_df)

    train_end = int(n * 0.70)
    validation_end = int(n * 0.85)

    train_df = city_df.iloc[:train_end]

    validation_df = city_df.iloc[
        train_end:validation_end
    ]

    test_df = city_df.iloc[
        validation_end:
    ]

    X_train = train_df[FEATURES]
    y_train = train_df[TARGET]

    X_validation = validation_df[FEATURES]
    y_validation = validation_df[TARGET]

    X_test = test_df[FEATURES]
    y_test = test_df[TARGET]

    model = XGBRegressor(
        n_estimators=300,
        max_depth=5,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        objective="reg:squarederror",
        random_state=42,
    )

    model.fit(
        X_train,
        y_train,
    )

    # Validation prediction
    validation_predictions = model.predict(
        X_validation
    )

    validation_metrics = evaluate_regression(
        y_validation,
        validation_predictions,
    )

    # Final test prediction
    test_predictions = model.predict(
        X_test
    )

    test_metrics = evaluate_regression(
        y_test,
        test_predictions,
    )

    MODEL_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    filename = (
        city.lower()
        .replace(" ", "_")
    )

    model_path = (
        MODEL_DIR
        / f"xgboost_{filename}_90d.joblib"
    )

    joblib.dump(
        model,
        model_path,
    )

    print(f"\n{city}")
    print("-" * len(city))

    print(f"Training rows:   {len(train_df)}")
    print(f"Validation rows: {len(validation_df)}")
    print(f"Test rows:       {len(test_df)}")

    print("\nValidation metrics:")

    for metric, value in validation_metrics.items():
        print(
            f"{metric}: {value:.4f}"
        )

    print("\nTEST metrics:")

    for metric, value in test_metrics.items():
        print(
            f"{metric}: {value:.4f}"
        )

    print(
        f"\nModel saved: {model_path}"
    )

    return {
        "validation": validation_metrics,
        "test": test_metrics,
    }


def main():

    df = pd.read_csv(DATASET)

    cities = sorted(
        df["city"].unique()
    )

    print("Cities found:")

    for city in cities:
        print(f"- {city}")

    results = {}

    for city in cities:

        results[city] = train_city_model(
            df,
            city,
        )

    print("\n")
    print("=" * 70)
    print("FINAL TEST SUMMARY")
    print("=" * 70)

    for city, result in results.items():

        metrics = result["test"]

        print(
            f"{city:15s} "
            f"MAE={metrics['MAE']:.4f}  "
            f"RMSE={metrics['RMSE']:.4f}  "
            f"R2={metrics['R2']:.4f}"
        )


if __name__ == "__main__":
    main()