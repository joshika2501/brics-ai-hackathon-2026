"""
Satellite environmental intelligence service.

This module retrieves publicly available remote-sensing evidence
for a requested city/location.

The service is intentionally evidence-oriented:
- it never invents satellite observations
- unavailable data is represented explicitly
- satellite evidence is kept separate from causal attribution
"""

from datetime import datetime, timezone
from typing import Any, Dict, Optional

import requests


# -------------------------------------------------------------------
# Configuration
# -------------------------------------------------------------------

OPEN_METEO_AIR_QUALITY_URL = (
    "https://air-quality-api.open-meteo.com/v1/air-quality"
)

REQUEST_TIMEOUT_SECONDS = 12


# -------------------------------------------------------------------
# Helpers
# -------------------------------------------------------------------

def _safe_float(value: Any) -> Optional[float]:
    try:
        if value is None:
            return None
        return float(value)
    except (TypeError, ValueError):
        return None


def _clamp(
    value: float,
    minimum: float = 0.0,
    maximum: float = 100.0,
) -> float:
    return max(minimum, min(maximum, value))


def _availability_status(
    values: Dict[str, Any],
) -> str:
    available = [
        value
        for value in values.values()
        if value is not None
    ]

    if not available:
        return "unavailable"

    if len(available) < len(values):
        return "partial"

    return "available"


# -------------------------------------------------------------------
# Satellite / remote-sensing evidence
# -------------------------------------------------------------------

def get_satellite_evidence(
    latitude: float,
    longitude: float,
    city: str,
) -> Dict[str, Any]:
    """
    Retrieve remote-sensing-related atmospheric evidence.

    The current implementation uses a public atmospheric
    remote-sensing-compatible data source to provide an
    externally observed aerosol-related signal.

    This is NOT presented as direct satellite imagery
    classification.

    Returns explicit availability when the upstream source
    cannot be reached.
    """

    timestamp = datetime.now(timezone.utc).isoformat()

    params = {
        "latitude": latitude,
        "longitude": longitude,
        "hourly": (
            "pm2_5,"
            "pm10,"
            "aerosol_optical_depth"
        ),
        "forecast_days": 1,
        "timezone": "UTC",
    }

    try:
        response = requests.get(
            OPEN_METEO_AIR_QUALITY_URL,
            params=params,
            timeout=REQUEST_TIMEOUT_SECONDS,
        )

        response.raise_for_status()

        payload = response.json()

    except Exception as exc:
        return {
            "status": "unavailable",
            "city": city,
            "latitude": latitude,
            "longitude": longitude,
            "source": "Open-Meteo atmospheric data",
            "observation_time": timestamp,
            "evidence": {
                "aerosol_optical_depth": None,
                "pm25_context": None,
                "pm10_context": None,
            },
            "confidence": 0.0,
            "reason": (
                "Remote atmospheric observation could not "
                "be retrieved."
            ),
            "error_type": type(exc).__name__,
        }

    hourly = payload.get("hourly") or {}

    aerosol_values = hourly.get(
        "aerosol_optical_depth"
    ) or []

    pm25_values = hourly.get(
        "pm2_5"
    ) or []

    pm10_values = hourly.get(
        "pm10"
    ) or []

    def latest(values):
        for value in reversed(values):
            numeric = _safe_float(value)
            if numeric is not None:
                return numeric
        return None

    aerosol = latest(aerosol_values)
    pm25 = latest(pm25_values)
    pm10 = latest(pm10_values)

    evidence = {
        "aerosol_optical_depth": aerosol,
        "pm25_context": pm25,
        "pm10_context": pm10,
    }

    status = _availability_status(evidence)

    # ---------------------------------------------------------------
    # Evidence strength
    # ---------------------------------------------------------------

    confidence = 0.0

    if aerosol is not None:
        confidence += 0.60

    if pm25 is not None:
        confidence += 0.20

    if pm10 is not None:
        confidence += 0.20

    confidence = _clamp(confidence, 0.0, 1.0)

    # ---------------------------------------------------------------
    # Interpret aerosol signal conservatively
    # ---------------------------------------------------------------

    aerosol_signal = "UNKNOWN"

    if aerosol is not None:
        if aerosol >= 1.0:
            aerosol_signal = "ELEVATED"
        elif aerosol >= 0.5:
            aerosol_signal = "MODERATE"
        else:
            aerosol_signal = "LOW"

    return {
        "status": status,
        "city": city,
        "latitude": latitude,
        "longitude": longitude,
        "source": "Open-Meteo atmospheric data",
        "observation_time": timestamp,
        "evidence": evidence,
        "aerosol_signal": aerosol_signal,
        "confidence": round(confidence, 2),
        "interpretation": (
            "Atmospheric aerosol-related evidence is provided "
            "as contextual environmental evidence. It does not "
            "establish a pollution source or regulatory violation."
        ),
    }