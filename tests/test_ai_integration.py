from unittest.mock import patch

from backend.services.prediction import get_live_prediction


def test_prediction_contains_ai_explanation():

    fake_explanation = {
        "status": "generated",
        "model": "gemini-2.5-flash",
        "explanation": {
            "headline": "Air quality requires attention.",
            "situation": "PM2.5 is forecast to rise.",
            "why_it_matters": (
                "The forecast indicates increasing exposure risk."
            ),
            "key_drivers": [
                "PM2.5",
                "PM10",
            ],
            "recommended_action": (
                "Increase environmental monitoring."
            ),
            "confidence_note": (
                "Explanation is based on model evidence."
            ),
        },
    }

    with patch(
        "backend.services.prediction.explain_prediction",
        return_value=fake_explanation,
    ):

        result = get_live_prediction("Delhi")

    assert "ai_explanation" in result

    assert (
        result["ai_explanation"]["status"]
        == "generated"
    )

    assert (
        result["ai_explanation"]["explanation"]["headline"]
        == "Air quality requires attention."
    )

    # Core deterministic pipeline must remain intact.
    assert "forecast" in result
    assert "risk" in result
    assert "evidence" in result
    assert "decision" in result
    assert "brics_context" in result

    # Forecast must still be generated independently
    # of the AI explanation layer.
    assert result["forecast"]["horizon_hours"] == 6
    assert result["forecast"]["predicted_pm25"] is not None