from backend.services.hotspots import generate_hotspots
from pathlib import Path

import joblib
import pandas as pd
import shap

from backend.decision_engine import build_decision
from backend.risk_engine import generate_risk_assessment
from backend.services.ai_explanation import explain_prediction
from backend.services.brics_profiles import (
    compare_forecast_to_reference,
    get_brics_profile,
)
from backend.services.live_features import get_live_feature_row


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


CITY_COORDINATES = {
    "Delhi": {
        "country": "India",
        "latitude": 28.6139,
        "longitude": 77.2090,
    },
    "Johannesburg": {
        "country": "South Africa",
        "latitude": -26.2041,
        "longitude": 28.0473,
    },
    "Sao Paulo": {
        "country": "Brazil",
        "latitude": -23.5505,
        "longitude": -46.6333,
    },
}


def load_model(city: str):
    filename = city.lower().replace(" ", "_")

    model_path = (
        MODEL_DIR
        / f"xgboost_{filename}_90d.joblib"
    )

    if not model_path.exists():
        raise FileNotFoundError(
            f"Model not found: {model_path}"
        )

    return joblib.load(model_path)


def get_live_prediction(city: str):

    # ---------------------------------------------------------
    # Validate city
    # ---------------------------------------------------------

    if city not in CITY_COORDINATES:
        raise ValueError(
            f"Unsupported city: {city}"
        )

    coordinates = CITY_COORDINATES[city]

    # ---------------------------------------------------------
    # Get live environmental features
    # ---------------------------------------------------------

    live_data = get_live_feature_row(
        latitude=coordinates["latitude"],
        longitude=coordinates["longitude"],
    )

    # ---------------------------------------------------------
    # Load trained city-specific model
    # ---------------------------------------------------------

    model = load_model(city)

    feature_values = live_data["features"]

    observation = pd.DataFrame(
        [
            [
                feature_values[feature]
                for feature in FEATURES
            ]
        ],
        columns=FEATURES,
    )

    # ---------------------------------------------------------
    # 6-hour PM2.5 prediction
    # ---------------------------------------------------------

    prediction = float(
        model.predict(observation)[0]
    )

    current_pm25 = float(
        live_data["current_pm25"]
    )

    # ---------------------------------------------------------
    # Risk assessment
    # ---------------------------------------------------------

    risk = generate_risk_assessment(
        current_pm25=current_pm25,
        predicted_pm25=prediction,
    )

    # ---------------------------------------------------------
    # SHAP explainability
    # ---------------------------------------------------------

    explainer = shap.TreeExplainer(model)

    shap_result = explainer(
        observation
    )

    shap_values = shap_result.values[0]

    explanations = []

    for feature, value in zip(
        FEATURES,
        shap_values,
    ):
        impact = float(value)

        if impact > 0:
            contribution = "above_baseline"
        elif impact < 0:
            contribution = "below_baseline"
        else:
            contribution = "neutral"

        explanations.append(
            {
                "feature": feature,
                "impact": round(
                    impact,
                    4,
                ),
                "contribution": contribution,
            }
        )

    explanations.sort(
        key=lambda item: abs(
            item["impact"]
        ),
        reverse=True,
    )

    top_evidence = explanations[:5]

    # ---------------------------------------------------------
    # Decision engine
    # ---------------------------------------------------------

    decision = build_decision(
        risk_level=risk["risk_level"],
        trend_direction=risk["trend"]["direction"],
        percentage_change=risk["trend"]["percentage_change"],
    )

    # ---------------------------------------------------------
    # BRICS context
    # ---------------------------------------------------------

    brics_profile = get_brics_profile(
        coordinates["country"]
    )

    brics_context = compare_forecast_to_reference(
        predicted_pm25=prediction,
        country=coordinates["country"],
    )

    # ---------------------------------------------------------
    # Hyperlocal hotspot intelligence
    # ---------------------------------------------------------

    hotspots = generate_hotspots(
        city=city,
        current_pm25=current_pm25,
        predicted_pm25=prediction,
        risk_level=risk["risk_level"],
        trend_direction=risk["trend"]["direction"],
        drivers=top_evidence,
    )

    # ---------------------------------------------------------
    # Deterministic intelligence result
    # ---------------------------------------------------------

    result = {
        "city": city,
        "country": coordinates["country"],
        "forecast_horizon_hours": 6,
        "timestamp": live_data["timestamp"],
        "current_pm25": round(
            current_pm25,
            2,
        ),
        "predicted_pm25": round(
            prediction,
            2,
        ),
        "risk_level": risk["risk_level"],
        "trend": risk["trend"],
        "drivers": top_evidence,

        "forecast": {
            "horizon_hours": 6,
            "current_pm25": round(
                current_pm25,
                2,
            ),
            "predicted_pm25": round(
                prediction,
                2,
            ),
        },

        "risk": {
            "level": risk["risk_level"],
            "trend": risk["trend"]["direction"],
            "absolute_change": risk["trend"]["absolute_change"],
            "percentage_change": risk["trend"]["percentage_change"],
        },

        "evidence": top_evidence,

        "hotspots": hotspots,

        "decision": decision,

        "brics_context": {
            "regulatory_reference": brics_profile[
                "regulatory_reference"
            ],
            "reference_value": brics_context[
                "reference_value"
            ],
            "reference_period": brics_context[
                "reference_period"
            ],
            "comparison": brics_context[
                "comparison"
            ],
            "ratio_to_reference": brics_context[
                "ratio_to_reference"
            ],
            "note": brics_context[
                "note"
            ],
        },

        "data_source": "Open-Meteo",
    }

    # ---------------------------------------------------------
    # Evidence-grounded Gemini explanation
    # ---------------------------------------------------------

    ai_explanation = explain_prediction(
        result
    )

    result["ai_explanation"] = (
        ai_explanation
    )

    return result


def get_prediction(city: str):
    """
    Backward-compatible wrapper.
    """

    return get_live_prediction(city)