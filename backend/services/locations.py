import json
from pathlib import Path


LOCATIONS_FILE = Path("data/sample/locations.json")


def get_location(country: str, city: str):
    with LOCATIONS_FILE.open("r", encoding="utf-8") as file:
        locations = json.load(file)

    countries = locations.get(country)

    if not countries:
        raise ValueError(f"Country not supported: {country}")

    for location in countries:
        if location["city"].lower() == city.lower():
            return location

    raise ValueError(
        f"City '{city}' not found in country '{country}'"
    )