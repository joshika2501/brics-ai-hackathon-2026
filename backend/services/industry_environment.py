import math
import os
from typing import Any
from urllib.parse import urlencode
from urllib.request import Request, urlopen


RESOURCE_ID = "3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69"
DATA_GOV_URL = f"https://api.data.gov.in/resource/{RESOURCE_ID}"

CITY_MAP = {
    "delhi": ("Delhi", "Delhi"),
    "new delhi": ("Delhi", "Delhi"),
    "bhubaneswar": ("Odisha", "Bhubaneswar"),
}

UNITS = {
    "PM2.5": "µg/m³",
    "PM10": "µg/m³",
    "NO2": "µg/m³",
    "SO2": "µg/m³",
    "CO": "mg/m³",
    "O3": "µg/m³",
}

CPCB_REFERENCE = {
    "PM2.5": 60.0,
    "PM10": 100.0,
    "NO2": 80.0,
    "SO2": 80.0,
    "CO": 2.0,
    "O3": 100.0,
}


def _number(value: Any):
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _distance_km(lat1, lon1, lat2, lon2):
    radius = 6371.0
    p1 = math.radians(lat1)
    p2 = math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)

    a = (
        math.sin(dp / 2) ** 2
        + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    )

    return radius * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _pollutant(value):
    if not value:
        return None

    value = str(value).strip().upper().replace(" ", "")

    aliases = {
        "PM25": "PM2.5",
        "PM2.5": "PM2.5",
        "PM10": "PM10",
        "NO2": "NO2",
        "SO2": "SO2",
        "CO": "CO",
        "O3": "O3",
    }

    return aliases.get(value)


def _base_response(status, reason, city, lat, lng, industry_name):
    return {
        "status": status,
        "reason": reason,
        "industry": {
            "name": industry_name,
            "latitude": lat,
            "longitude": lng,
            "city": city,
        },
        "ambient_sensor": {
            "status": status,
            "source": "CPCB / data.gov.in",
        },
        "facility_monitoring": {
            "status": "FACILITY_DATA_NOT_PUBLIC",
            "source": "CPCB OCEMS",
            "note": (
                "Ambient monitoring data is not facility stack or effluent "
                "measurement data."
            ),
        },
        "waste": {
            "status": "FACILITY_DATA_NOT_PUBLIC",
            "measured_toxins": [],
            "potential_streams": [],
            "potential_contaminants": [],
            "note": (
                "No untreated discharge is inferred from an industry name "
                "or location alone."
            ),
        },
    }


def get_industry_environment(
    city: str,
    lat: float,
    lng: float,
    industry_name: str = "",
):
    city_key = city.strip().lower()

    if city_key not in CITY_MAP:
        return _base_response(
            "UNAVAILABLE",
            "No configured CPCB public-data mapping for this city.",
            city,
            lat,
            lng,
            industry_name,
        )

    api_key = os.getenv("DATA_GOV_API_KEY")

    if not api_key:
        return _base_response(
            "UNAVAILABLE",
            "DATA_GOV_API_KEY is not configured.",
            city,
            lat,
            lng,
            industry_name,
        )

    state, mapped_city = CITY_MAP[city_key]

    params = urlencode(
        {
            "api-key": api_key,
            "format": "json",
            "filters[state]": state,
            "filters[city]": mapped_city,
            "limit": 100,
        }
    )

    try:
        request = Request(
            f"{DATA_GOV_URL}?{params}",
            headers={"User-Agent": "BRICS-Environmental-Intelligence/1.0"},
        )

        with urlopen(request, timeout=12) as response:
            import json
            payload = json.loads(response.read().decode("utf-8"))

    except Exception as exc:
        return _base_response(
            "UNAVAILABLE",
            f"Public sensor source unavailable: {type(exc).__name__}.",
            city,
            lat,
            lng,
            industry_name,
        )

    records = payload.get("records", [])

    if not records:
        return _base_response(
            "NO_PUBLIC_READING",
            "No public monitoring records were returned for this city.",
            city,
            lat,
            lng,
            industry_name,
        )

    stations = {}

    for record in records:
        station = str(record.get("station") or "Unknown station").strip()

        station_lat = _number(record.get("latitude"))
        station_lng = _number(record.get("longitude"))

        pollutant = _pollutant(record.get("pollutant_id"))

        value = _number(
            record.get("pollutant_avg")
            or record.get("avg")
            or record.get("value")
        )

        if (
            station_lat is None
            or station_lng is None
            or pollutant is None
            or value is None
        ):
            continue

        key = (station, station_lat, station_lng)

        if key not in stations:
            stations[key] = {
                "station": station,
                "latitude": station_lat,
                "longitude": station_lng,
                "last_update": record.get("last_update"),
                "pollutants": {},
            }

        stations[key]["pollutants"][pollutant] = {
            "value": value,
            "unit": UNITS[pollutant],
            "cpcb_reference": CPCB_REFERENCE.get(pollutant),
            "comparison": (
                "ABOVE_REFERENCE"
                if CPCB_REFERENCE.get(pollutant) is not None
                and value > CPCB_REFERENCE[pollutant]
                else "WITHIN_REFERENCE"
            ),
        }

    if not stations:
        return _base_response(
            "NO_GEOCODED_SENSOR",
            "Records were returned but usable geocoded sensor readings were not found.",
            city,
            lat,
            lng,
            industry_name,
        )

    nearest = min(
        stations.values(),
        key=lambda s: _distance_km(
            lat,
            lng,
            s["latitude"],
            s["longitude"],
        ),
    )

    distance = _distance_km(
        lat,
        lng,
        nearest["latitude"],
        nearest["longitude"],
    )

    result = _base_response(
        "LIVE_PUBLIC",
        "Nearest public CPCB monitoring station found.",
        city,
        lat,
        lng,
        industry_name,
    )

    result["ambient_sensor"] = {
        "status": "LIVE_PUBLIC",
        "source": "CPCB / data.gov.in",
        "station": nearest["station"],
        "station_latitude": nearest["latitude"],
        "station_longitude": nearest["longitude"],
        "distance_km": round(distance, 3),
        "last_update": nearest["last_update"],
        "pollutants": nearest["pollutants"],
    }

    return result