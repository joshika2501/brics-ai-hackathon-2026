from backend.services.brics_profiles import (
    get_brics_profile,
    compare_forecast_to_reference,
)


def test_india_profile():

    profile = get_brics_profile("India")

    assert profile["country"] == "India"
    assert profile["pm25_24h_reference"] == 60.0


def test_brazil_profile():

    profile = get_brics_profile("Brazil")

    assert profile["country"] == "Brazil"
    assert profile["pm25_24h_reference"] == 50.0


def test_south_africa_profile():

    profile = get_brics_profile("South Africa")

    assert profile["country"] == "South Africa"
    assert profile["pm25_24h_reference"] == 40.0


def test_forecast_comparison():

    result = compare_forecast_to_reference(
        predicted_pm25=90.0,
        country="India",
    )

    assert result["comparison"] == "WELL_ABOVE_REFERENCE"
    assert result["reference_value"] == 60.0
    assert result["ratio_to_reference"] == 1.5


def test_below_reference():

    result = compare_forecast_to_reference(
        predicted_pm25=30.0,
        country="India",
    )

    assert result["comparison"] == "BELOW_REFERENCE"