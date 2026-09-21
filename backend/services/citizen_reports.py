from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import uuid4


_REPORTS: List[Dict[str, Any]] = []


ALLOWED_EVENT_TYPES = {
    "SMOKE",
    "DUST",
    "BURNING",
    "INDUSTRIAL_EMISSION",
    "HAZE",
    "UNKNOWN",
}


def create_report(
    city: str,
    latitude: float,
    longitude: float,
    event_type: str = "UNKNOWN",
    description: str = "",
    pm25: Optional[float] = None,
    pm10: Optional[float] = None,
    sensor_source: Optional[str] = None,
    photo_reference: Optional[str] = None,
    ai_analysis: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:

    city = city.strip()

    if not city:
        raise ValueError("City is required.")

    if not (-90 <= latitude <= 90):
        raise ValueError("Latitude must be between -90 and 90.")

    if not (-180 <= longitude <= 180):
        raise ValueError("Longitude must be between -180 and 180.")

    event_type = event_type.strip().upper()

    if event_type not in ALLOWED_EVENT_TYPES:
        raise ValueError(
            f"Invalid event_type. Allowed values: {sorted(ALLOWED_EVENT_TYPES)}"
        )

    if pm25 is not None and pm25 < 0:
        raise ValueError("PM2.5 cannot be negative.")

    if pm10 is not None and pm10 < 0:
        raise ValueError("PM10 cannot be negative.")

    report = {
        "report_id": str(uuid4()),
        "city": city,
        "latitude": round(latitude, 6),
        "longitude": round(longitude, 6),
        "event_type": event_type,
        "description": description.strip(),
        "sensor": {
            "pm25": round(pm25, 2) if pm25 is not None else None,
            "pm10": round(pm10, 2) if pm10 is not None else None,
            "source": sensor_source,
        },
        "photo_reference": photo_reference,
        "ai_analysis": ai_analysis,
        "status": "REPORTED",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    _REPORTS.append(report)

    return report


def get_reports(city: Optional[str] = None) -> List[Dict[str, Any]]:
    if city is None:
        return list(_REPORTS)

    city_normalized = city.strip().lower()

    return [
        report
        for report in _REPORTS
        if report["city"].lower() == city_normalized
    ]


def get_report(report_id: str) -> Optional[Dict[str, Any]]:
    for report in _REPORTS:
        if report["report_id"] == report_id:
            return report

    return None


def clear_reports() -> None:
    _REPORTS.clear()
