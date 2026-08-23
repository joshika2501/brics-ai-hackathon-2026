from backend.services.ai_explanation import (
    _build_prompt,
    _fallback_explanation,
)


def sample_prediction():

    return {
        "city": "Delhi",
        "country": "India",

        "forecast": {
            "horizon_hours": 6,
            "current_pm25": 43.2,
            "predicted_pm25": 55.24,
        },

        "risk": {
            "level": "MODERATE",
            "trend": "RISING",
            "absolute_change": 12.04,
            "percentage_change": 27.86,
        },

        "evidence": [
            {
                "feature": "pm2_5",
                "impact": -20.04,
                "contribution": "below_baseline",
            },
            {
                "feature": "pm10",
                "impact": -17.12,
                "contribution": "below_baseline",
            },
        ],

        "decision": {
            "priority": "HIGH",
            "actions": [
                "Increase environmental monitoring."
            ],
        },

        "brics_context": {
            "reference_value": 60.0,
            "reference_period": "24-hour",
            "comparison": "NEAR_REFERENCE",
            "ratio_to_reference": 0.92,
        },
    }


def test_prompt_contains_evidence():

    data = sample_prediction()

    prompt = _build_prompt(data)

    assert "Delhi" in prompt
    assert "55.24" in prompt
    assert "MODERATE" in prompt
    assert "pm2_5" in prompt
    assert "60.0" in prompt


def test_fallback_explanation():

    data = sample_prediction()

    result = _fallback_explanation(
        data,
        reason="test",
    )

    assert result["status"] == "fallback"

    explanation = result["explanation"]

    assert "Delhi" in explanation["headline"]
    assert "55.24" in explanation["headline"]
    assert explanation["recommended_action"]


def test_fallback_does_not_change_prediction():

    data = sample_prediction()

    result = _fallback_explanation(
        data,
        reason="test",
    )

    headline = result["explanation"]["headline"]

    assert "55.24" in headline