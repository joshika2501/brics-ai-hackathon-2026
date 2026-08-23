from backend.services.evidence import (
    normalize_drivers,
)


def test_normalize_drivers():

    drivers = [
        {
            "feature": "pm2_5",
            "impact": 10.5,
            "direction": "increases_risk",
        },
        {
            "feature": "wind_x",
            "impact": -4.2,
            "direction": "reduces_risk",
        },
    ]

    result = normalize_drivers(
        drivers,
        "RISING",
    )

    assert len(result) == 2

    assert (
        result[0]["contribution"]
        == "above_baseline"
    )

    assert (
        result[1]["contribution"]
        == "below_baseline"
    )

    assert (
        result[0]["forecast_direction"]
        == "RISING"
    )