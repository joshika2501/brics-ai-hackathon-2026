from pathlib import Path
import math
import joblib

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

SUPPORTED_CITIES = {
    "Delhi",
    "Johannesburg",
    "Sao Paulo",
}

# Only expose environmental variables that are meaningful
# for a user-facing what-if scenario.
ALLOWED_CHANGES = {
    "pm2_5",
    "pm10",
    "nitrogen_dioxide",
    "temperature_2m",
    "relative_humidity_2m",
    "wind_speed_10m",
    "wind_direction_10m",
    "surface_pressure",
    "precipitation",
}


def _load_model(city: str):
    model_path = (
        MODEL_DIR
        / f"xgboost_{city.lower().replace(' ', '_')}_90d.joblib"
    )

    if not model_path.exists():
        raise FileNotFoundError(
            f"Model not found for {city}: {model_path}"
        )

    return joblib.load(model_path)


def _validate_changes(changes):
    if not isinstance(changes, dict):
        raise ValueError("changes must be a dictionary.")

    invalid = set(changes) - ALLOWED_CHANGES

    if invalid:
        raise ValueError(
            f"Unsupported scenario features: {sorted(invalid)}"
        )

    for feature, value in changes.items():
        try:
            numeric_value = float(value)
        except (TypeError, ValueError):
            raise ValueError(
                f"Scenario value for '{feature}' must be numeric."
            )

        if not math.isfinite(numeric_value):
            raise ValueError(
                f"Scenario value for '{feature}' must be finite."
            )

    # PM2.5
    if "pm2_5" in changes:
        if float(changes["pm2_5"]) < 0:
            raise ValueError(
                "pm2_5 cannot be negative."
            )

    # PM10
    if "pm10" in changes:
        if float(changes["pm10"]) < 0:
            raise ValueError(
                "pm10 cannot be negative."
            )

    # NO2
    if "nitrogen_dioxide" in changes:
        if float(changes["nitrogen_dioxide"]) < 0:
            raise ValueError(
                "nitrogen_dioxide cannot be negative."
            )

    # Wind speed
    if "wind_speed_10m" in changes:
        if float(changes["wind_speed_10m"]) < 0:
            raise ValueError(
                "wind_speed_10m cannot be negative."
            )

    # Relative humidity
    if "relative_humidity_2m" in changes:
        humidity = float(changes["relative_humidity_2m"])

        if not 0 <= humidity <= 100:
            raise ValueError(
                "relative_humidity_2m must be between 0 and 100."
            )

    # Wind direction
    if "wind_direction_10m" in changes:
        direction = float(changes["wind_direction_10m"])

        if not 0 <= direction <= 360:
            raise ValueError(
                "wind_direction_10m must be between 0 and 360 degrees."
            )

    # Precipitation
    if "precipitation" in changes:
        if float(changes["precipitation"]) < 0:
            raise ValueError(
                "precipitation cannot be negative."
            )


def _recalculate_dependent_features(
    scenario: dict,
    baseline: dict,
    changes: dict,
):
    """
    Recalculate deterministic derived features.

    Wind:
        wind_speed_10m + wind_direction_10m
        -> wind_x + wind_y

    NO2:
        nitrogen_dioxide
        -> no2_change

    PM2.5:
        Historical lag and rolling features are intentionally
        retained from the observed baseline. A single-point
        scenario does not provide enough information to
        reconstruct a future time series.
    """

    # -----------------------------------------
    # WIND COMPONENTS
    # -----------------------------------------

    if (
        "wind_speed_10m" in changes
        or "wind_direction_10m" in changes
    ):
        speed = float(scenario["wind_speed_10m"])
        direction = float(scenario["wind_direction_10m"])

        radians = math.radians(direction)

        scenario["wind_x"] = (
            speed * math.cos(radians)
        )

        scenario["wind_y"] = (
            speed * math.sin(radians)
        )

    # -----------------------------------------
    # NO2 CHANGE
    # -----------------------------------------

    if "nitrogen_dioxide" in changes:
        baseline_no2 = float(
            baseline["nitrogen_dioxide"]
        )

        scenario_no2 = float(
            scenario["nitrogen_dioxide"]
        )

        scenario["no2_change"] = (
            scenario_no2 - baseline_no2
        )

    return scenario


def simulate_scenario(
    city: str,
    baseline_features: dict,
    changes: dict,
):
    """
    Run a model-based environmental what-if simulation.

    Parameters
    ----------
    city:
        Supported city name.

    baseline_features:
        Current live feature vector.

    changes:
        Environmental variables modified by the scenario.

    Returns
    -------
    dict
        Baseline prediction, scenario prediction,
        impact, and metadata.

    Important:
        This is a model-based sensitivity simulation.
        It is NOT a causal estimate.
    """

    # -----------------------------------------
    # CITY VALIDATION
    # -----------------------------------------

    if city not in SUPPORTED_CITIES:
        raise ValueError(
            f"Unsupported city '{city}'. "
            f"Supported cities: "
            f"{sorted(SUPPORTED_CITIES)}"
        )

    # -----------------------------------------
    # SCENARIO VALIDATION
    # -----------------------------------------

    _validate_changes(changes)

    # -----------------------------------------
    # BASELINE FEATURE VALIDATION
    # -----------------------------------------

    missing = [
        feature
        for feature in FEATURES
        if feature not in baseline_features
    ]

    if missing:
        raise ValueError(
            "Baseline features missing required fields: "
            f"{missing}"
        )

    # -----------------------------------------
    # LOAD MODEL
    # -----------------------------------------

    model = _load_model(city)

    # -----------------------------------------
    # CREATE BASELINE VECTOR
    # -----------------------------------------

    baseline = {
        feature: float(
            baseline_features[feature]
        )
        for feature in FEATURES
    }

    # -----------------------------------------
    # CREATE SCENARIO VECTOR
    # -----------------------------------------

    scenario = baseline.copy()

    for feature, value in changes.items():
        scenario[feature] = float(value)

    # -----------------------------------------
    # RECALCULATE DERIVED FEATURES
    # -----------------------------------------

    scenario = _recalculate_dependent_features(
        scenario=scenario,
        baseline=baseline,
        changes=changes,
    )

    # -----------------------------------------
    # BASELINE PREDICTION
    # -----------------------------------------

    baseline_prediction = float(
        model.predict(
            [
                [
                    baseline[feature]
                    for feature in FEATURES
                ]
            ]
        )[0]
    )

    # -----------------------------------------
    # SCENARIO PREDICTION
    # -----------------------------------------

    scenario_prediction = float(
        model.predict(
            [
                [
                    scenario[feature]
                    for feature in FEATURES
                ]
            ]
        )[0]
    )

    # -----------------------------------------
    # NON-NEGATIVE PM2.5
    # -----------------------------------------

    baseline_prediction = max(
        0.0,
        baseline_prediction,
    )

    scenario_prediction = max(
        0.0,
        scenario_prediction,
    )

    # -----------------------------------------
    # IMPACT
    # -----------------------------------------

    absolute_change = (
        scenario_prediction
        - baseline_prediction
    )

    if baseline_prediction == 0:
        percentage_change = 0.0
    else:
        percentage_change = (
            absolute_change
            / baseline_prediction
        ) * 100

    # -----------------------------------------
    # DIRECTION
    # -----------------------------------------

    if absolute_change > 0.01:
        direction = "INCREASE"

    elif absolute_change < -0.01:
        direction = "DECREASE"

    else:
        direction = "UNCHANGED"

    # -----------------------------------------
    # DERIVED FEATURE REPORT
    # -----------------------------------------

    derived_features_recalculated = []

    if (
        "wind_speed_10m" in changes
        or "wind_direction_10m" in changes
    ):
        derived_features_recalculated.extend(
            [
                "wind_x",
                "wind_y",
            ]
        )

    if "nitrogen_dioxide" in changes:
        derived_features_recalculated.append(
            "no2_change"
        )

    # -----------------------------------------
    # FINAL RESPONSE
    # -----------------------------------------

    return {
        "city": city,

        "baseline_prediction": round(
            baseline_prediction,
            2,
        ),

        "scenario_prediction": round(
            scenario_prediction,
            2,
        ),

        "absolute_change": round(
            absolute_change,
            2,
        ),

        "percentage_change": round(
            percentage_change,
            2,
        ),

        "direction": direction,

        "changed_features": {
            key: round(
                float(value),
                4,
            )
            for key, value in changes.items()
        },

        "derived_features_recalculated":
            derived_features_recalculated,

        "interpretation": (
            "Model-based what-if simulation. "
            "The result represents how the trained "
            "XGBoost model responds to the modified "
            "feature vector; it is not a causal estimate. "
            "Observed PM2.5 lag and rolling features "
            "are retained because a single-point scenario "
            "does not reconstruct a future time series."
        ),
    }