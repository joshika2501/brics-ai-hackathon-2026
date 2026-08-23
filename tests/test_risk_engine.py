from backend.risk_engine import (
    classify_pm25,
    calculate_trend,
    generate_risk_assessment,
)


def test_risk_levels():

    assert classify_pm25(20) == "LOW"
    assert classify_pm25(45) == "MODERATE"
    assert classify_pm25(75) == "HIGH"
    assert classify_pm25(105) == "VERY HIGH"
    assert classify_pm25(150) == "CRITICAL"


def test_rising_trend():

    result = calculate_trend(
        current_pm25=50,
        predicted_pm25=70,
    )

    assert result["direction"] == "RISING"


def test_falling_trend():

    result = calculate_trend(
        current_pm25=100,
        predicted_pm25=70,
    )

    assert result["direction"] == "FALLING"


def test_complete_assessment():

    result = generate_risk_assessment(
        current_pm25=50,
        predicted_pm25=80,
    )

    assert result["risk_level"] == "HIGH"
    assert result["trend"]["direction"] == "RISING"