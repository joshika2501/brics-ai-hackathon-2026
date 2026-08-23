from backend.services.prediction import (
    get_prediction,
)


def test_delhi_prediction():

    result = get_prediction(
        "Delhi"
    )

    assert result["city"] == "Delhi"

    assert (
        result["forecast_horizon_hours"]
        == 6
    )

    assert result["current_pm25"] >= 0

    assert result["predicted_pm25"] >= 0

    assert result["risk_level"] in [
        "LOW",
        "MODERATE",
        "HIGH",
        "VERY HIGH",
        "CRITICAL",
    ]

    assert result["trend"]["direction"] in [
        "RISING",
        "FALLING",
        "STABLE",
    ]

    assert len(result["drivers"]) == 5