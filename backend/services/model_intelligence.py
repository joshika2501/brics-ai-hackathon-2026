from functools import lru_cache
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from backend.models.evaluation import evaluate_regression


DATASET = Path(
    "data/processed/training_dataset_90d.csv"
)

MODEL_DIR = Path(
    "models/trained"
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


def _model_path(city: str) -> Path:
    filename = (
        city.lower()
        .replace(" ", "_")
    )

    return (
        MODEL_DIR
        / f"xgboost_{filename}_90d.joblib"
    )


@lru_cache(maxsize=1)
def _load_dataset() -> pd.DataFrame:
    """
    Load the 90-day dataset once and cache it.
    """

    df = pd.read_csv(DATASET)

    df["time"] = pd.to_datetime(
        df["time"]
    )

    return df


@lru_cache(maxsize=3)
def _load_model(city: str):
    """
    Load each city-specific model once and cache it.
    """

    model_path = _model_path(city)

    if not model_path.exists():
        raise FileNotFoundError(
            f"Model not found: {model_path}"
        )

    return joblib.load(
        model_path
    )


@lru_cache(maxsize=3)
def _get_city_test_data(
    city: str,
) -> pd.DataFrame:
    """
    Return the chronological final 15%
    of the city's data as the test period.
    """

    df = _load_dataset()

    city_df = (
        df[df["city"] == city]
        .sort_values("time")
        .reset_index(drop=True)
    )

    n = len(city_df)

    validation_end = int(
        n * 0.85
    )

    return city_df.iloc[
        validation_end:
    ].copy()


@lru_cache(maxsize=3)
def _get_calibration(
    city: str,
) -> dict:
    """
    Calculate model performance and historical
    error calibration once per city.
    """

    test_df = _get_city_test_data(
        city
    )

    model = _load_model(
        city
    )

    X_test = test_df[
        FEATURES
    ]

    y_true = test_df[
        "target_pm25_6h"
    ].values

    predictions = model.predict(
        X_test
    )

    model_metrics = evaluate_regression(
        y_true,
        predictions,
    )

    baseline_predictions = (
        test_df["pm2_5"].values
    )

    baseline_metrics = evaluate_regression(
        y_true,
        baseline_predictions,
    )

    residuals = (
        y_true - predictions
    )

    absolute_errors = np.abs(
        residuals
    )

    mae = float(
        np.mean(absolute_errors)
    )

    p90_error = float(
        np.percentile(
            absolute_errors,
            90,
        )
    )

    baseline_mae = (
        baseline_metrics["MAE"]
    )

    model_mae = (
        model_metrics["MAE"]
    )

    if baseline_mae > 0:
        improvement = (
            (baseline_mae - model_mae)
            / baseline_mae
        ) * 100
    else:
        improvement = 0.0

    return {
        "model": "xgboost_90d",

        "test": {
            "MAE": round(
                model_metrics["MAE"],
                4,
            ),
            "RMSE": round(
                model_metrics["RMSE"],
                4,
            ),
            "R2": round(
                model_metrics["R2"],
                4,
            ),
        },

        "persistence_baseline": {
            "MAE": round(
                baseline_metrics["MAE"],
                4,
            ),
            "RMSE": round(
                baseline_metrics["RMSE"],
                4,
            ),
            "R2": round(
                baseline_metrics["R2"],
                4,
            ),
        },

        "mae_improvement_percent": round(
            improvement,
            2,
        ),

        "uncertainty_calibration": {
            "mean_absolute_error": round(
                mae,
                2,
            ),
            "p90_absolute_error": round(
                p90_error,
                2,
            ),
        },
    }


def get_model_quality(
    city: str,
) -> dict:
    """
    Return cached model-quality information.
    """

    calibration = _get_calibration(
        city
    )

    return {
        "model": calibration[
            "model"
        ],

        "test": calibration[
            "test"
        ],

        "persistence_baseline": (
            calibration[
                "persistence_baseline"
            ]
        ),

        "mae_improvement_percent": (
            calibration[
                "mae_improvement_percent"
            ]
        ),
    }


def get_empirical_uncertainty(
    city: str,
    prediction: float,
) -> dict:
    """
    Estimate uncertainty using the historical
    absolute-error distribution of the city's
    test period.

    This is an empirical error band and is not
    a formal statistical prediction interval.
    """

    calibration = _get_calibration(
        city
    )

    uncertainty_calibration = (
        calibration[
            "uncertainty_calibration"
        ]
    )

    mae = (
        uncertainty_calibration[
            "mean_absolute_error"
        ]
    )

    p90_error = (
        uncertainty_calibration[
            "p90_absolute_error"
        ]
    )

    lower = max(
        0.0,
        float(prediction) - p90_error,
    )

    upper = (
        float(prediction) + p90_error
    )

    return {
        "point_prediction": round(
            float(prediction),
            2,
        ),

        "mean_absolute_error": round(
            mae,
            2,
        ),

        "p90_absolute_error": round(
            p90_error,
            2,
        ),

        "lower_bound": round(
            lower,
            2,
        ),

        "upper_bound": round(
            upper,
            2,
        ),

        "interval_type": (
            "empirical_90_percent_error_band"
        ),

        "interpretation": (
            "Historical test-set absolute "
            "error percentile used as an "
            "empirical uncertainty estimate; "
            "not a statistical guarantee."
        ),
    }