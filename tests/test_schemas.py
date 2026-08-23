import json
from pathlib import Path

from backend.schemas.environmental import EnvironmentalObservation


def test_sample_observation():
    path = Path("data/sample/observation.json")

    with path.open("r", encoding="utf-8") as file:
        data = json.load(file)

    observation = EnvironmentalObservation(**data)

    assert observation.location.city == "Delhi"
    assert observation.air_quality.pm25 == 118.4
    assert observation.weather.wind_speed == 2.1