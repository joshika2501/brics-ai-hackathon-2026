from typing import Dict


def classify_pm25(pm25: float) -> str:
    """
    Prototype PM2.5 risk classification.

    These thresholds are intended for the hackathon
    decision-support prototype and should be configurable
    for deployment under the target country's official
    air-quality standards.
    """

    if pm25 <= 30:
        return "LOW"

    if pm25 <= 60:
        return "MODERATE"

    if pm25 <= 90:
        return "HIGH"

    if pm25 <= 120:
        return "VERY HIGH"

    return "CRITICAL"


def calculate_trend(
    current_pm25: float,
    predicted_pm25: float,
) -> Dict:

    change = predicted_pm25 - current_pm25

    if current_pm25 == 0:
        percentage_change = 0.0
    else:
        percentage_change = (
            change / current_pm25
        ) * 100

    if percentage_change >= 15:
        direction = "RISING"

    elif percentage_change <= -15:
        direction = "FALLING"

    else:
        direction = "STABLE"

    return {
        "direction": direction,
        "absolute_change": round(change, 2),
        "percentage_change": round(
            percentage_change,
            2,
        ),
    }


def generate_risk_assessment(
    current_pm25: float,
    predicted_pm25: float,
) -> Dict:

    risk = classify_pm25(
        predicted_pm25
    )

    trend = calculate_trend(
        current_pm25,
        predicted_pm25,
    )

    return {
        "current_pm25": round(
            current_pm25,
            2,
        ),
        "predicted_pm25": round(
            predicted_pm25,
            2,
        ),
        "risk_level": risk,
        "trend": trend,
    }