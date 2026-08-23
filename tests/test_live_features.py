from unittest.mock import patch, Mock

from backend.services.live_features import (
    get_live_feature_row,
)


def mock_air_quality():
    response = Mock()

    response.raise_for_status.return_value = None

    times = [
        "2026-08-19T12:00",
        "2026-08-19T13:00",
        "2026-08-19T14:00",
        "2026-08-19T15:00",
        "2026-08-19T16:00",
        "2026-08-19T17:00",
        "2026-08-19T18:00",
        "2026-08-19T19:00",
        "2026-08-19T20:00",
        "2026-08-19T21:00",
        "2026-08-19T22:00",
        "2026-08-19T23:00",
    ]

    response.json.return_value = {
        "hourly": {
            "time": times,
            "pm2_5": [
                35.0,
                35.5,
                36.0,
                36.5,
                37.0,
                37.5,
                38.0,
                38.5,
                39.0,
                39.5,
                40.0,
                40.5,
            ],
            "pm10": [
                60.0,
                60.5,
                61.0,
                61.5,
                62.0,
                62.5,
                63.0,
                63.5,
                64.0,
                64.5,
                65.0,
                65.5,
            ],
            "nitrogen_dioxide": [
                20.0,
                20.5,
                21.0,
                21.5,
                22.0,
                22.5,
                23.0,
                23.5,
                24.0,
                24.5,
                25.0,
                25.5,
            ],
        }
    }

    return response


def mock_weather():
    response = Mock()

    response.raise_for_status.return_value = None

    times = [
        "2026-08-19T12:00",
        "2026-08-19T13:00",
        "2026-08-19T14:00",
        "2026-08-19T15:00",
        "2026-08-19T16:00",
        "2026-08-19T17:00",
        "2026-08-19T18:00",
        "2026-08-19T19:00",
        "2026-08-19T20:00",
        "2026-08-19T21:00",
        "2026-08-19T22:00",
        "2026-08-19T23:00",
    ]

    response.json.return_value = {
        "hourly": {
            "time": times,
            "temperature_2m": [
                25.0,
                24.9,
                24.8,
                24.7,
                24.6,
                24.5,
                24.4,
                24.3,
                24.2,
                24.1,
                24.0,
                23.9,
            ],
            "relative_humidity_2m": [
                55.0,
                55.5,
                56.0,
                56.5,
                57.0,
                57.5,
                58.0,
                58.5,
                59.0,
                59.5,
                60.0,
                60.5,
            ],
            "wind_speed_10m": [
                10.0,
                10.2,
                10.4,
                10.6,
                10.8,
                11.0,
                11.2,
                11.4,
                11.6,
                11.8,
                12.0,
                12.2,
            ],
            "wind_direction_10m": [
                180.0,
                182.0,
                184.0,
                186.0,
                188.0,
                190.0,
                192.0,
                194.0,
                196.0,
                198.0,
                200.0,
                202.0,
            ],
            "surface_pressure": [
                1010.0,
                1010.0,
                1009.8,
                1009.8,
                1009.6,
                1009.6,
                1009.4,
                1009.4,
                1009.2,
                1009.2,
                1009.0,
                1009.0,
            ],
            "precipitation": [
                0.0,
                0.0,
                0.0,
                0.0,
                0.0,
                0.0,
                0.0,
                0.0,
                0.0,
                0.0,
                0.0,
                0.0,
            ],
        }
    }

    return response


@patch(
    "backend.services.live_features.requests.get"
)
def test_live_delhi_features(mock_get):

    def mocked_request(url, *args, **kwargs):

        if "air-quality-api" in url:
            return mock_air_quality()

        return mock_weather()

    mock_get.side_effect = mocked_request

    result = get_live_feature_row(
        latitude=28.6139,
        longitude=77.2090,
    )

    assert "timestamp" in result

    assert "current_pm25" in result

    assert result["current_pm25"] >= 0

    assert "features" in result

    features = result["features"]

    required = [
        "pm2_5",
        "pm10",
        "nitrogen_dioxide",
        "pm25_lag_1",
        "pm25_lag_3",
        "pm25_lag_6",
        "pm25_rolling_mean_6h",
        "pm25_rolling_std_6h",
        "no2_change",
        "hour_sin",
        "hour_cos",
        "dow_sin",
        "dow_cos",
        "wind_x",
        "wind_y",
    ]

    for feature in required:
        assert feature in features
        assert features[feature] is not None