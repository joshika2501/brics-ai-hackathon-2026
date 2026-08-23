from fastapi.testclient import TestClient
from unittest.mock import patch, Mock

from backend.app import app


client = TestClient(app)


def mock_air_quality():
    response = Mock()

    response.raise_for_status.return_value = None

    response.json.return_value = {
        "hourly": {
            "time": ["2026-08-19T23:00"],
            "pm2_5": [40.0],
            "pm10": [70.0],
            "nitrogen_dioxide": [20.0],
        }
    }

    return response


def mock_weather():
    response = Mock()

    response.raise_for_status.return_value = None

    response.json.return_value = {
        "hourly": {
            "time": ["2026-08-19T23:00"],
            "temperature_2m": [25.0],
            "relative_humidity_2m": [60.0],
            "wind_speed_10m": [10.0],
            "wind_direction_10m": [180.0],
            "surface_pressure": [1010.0],
            "precipitation": [0.0],
        }
    }

    return response


@patch(
    "backend.services.air_quality.requests.get",
    side_effect=lambda *args, **kwargs: mock_air_quality(),
)
@patch(
    "backend.services.weather.requests.get",
    side_effect=lambda *args, **kwargs: mock_weather(),
)
def test_delhi_environment(mock_weather_get, mock_air_quality_get):

    response = client.get(
        "/environment/current",
        params={
            "country": "India",
            "city": "Delhi",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["data"]["location"]["country"] == "India"
    assert data["data"]["location"]["city"] == "Delhi"
    assert "pm25" in data["data"]["air_quality"]
    assert "temperature" in data["data"]["weather"]


@patch(
    "backend.services.air_quality.requests.get",
    side_effect=lambda *args, **kwargs: mock_air_quality(),
)
@patch(
    "backend.services.weather.requests.get",
    side_effect=lambda *args, **kwargs: mock_weather(),
)
def test_sao_paulo_environment(mock_weather_get, mock_air_quality_get):

    response = client.get(
        "/environment/current",
        params={
            "country": "Brazil",
            "city": "Sao Paulo",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["data"]["location"]["country"] == "Brazil"
    assert data["data"]["location"]["city"] == "Sao Paulo"


@patch(
    "backend.services.air_quality.requests.get",
    side_effect=lambda *args, **kwargs: mock_air_quality(),
)
@patch(
    "backend.services.weather.requests.get",
    side_effect=lambda *args, **kwargs: mock_weather(),
)
def test_johannesburg_environment(mock_weather_get, mock_air_quality_get):

    response = client.get(
        "/environment/current",
        params={
            "country": "South Africa",
            "city": "Johannesburg",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["data"]["location"]["country"] == "South Africa"
    assert data["data"]["location"]["city"] == "Johannesburg"