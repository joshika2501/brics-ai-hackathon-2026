from backend.services.air_quality import get_air_quality
from backend.services.weather import get_weather


DELHI_LAT = 28.6139
DELHI_LON = 77.2090


def test_air_quality():
    data = get_air_quality(DELHI_LAT, DELHI_LON)

    assert "timestamp" in data
    assert "pm25" in data
    assert "pm10" in data
    assert "no2" in data

    print("\nAir Quality:")
    print(data)


def test_weather():
    data = get_weather(DELHI_LAT, DELHI_LON)

    assert "timestamp" in data
    assert "temperature" in data
    assert "humidity" in data
    assert "wind_speed" in data

    print("\nWeather:")
    print(data)