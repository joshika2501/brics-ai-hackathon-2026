from math import radians, sin, cos, sqrt, atan2
from typing import Any, Dict, List


EVENT_WEIGHTS = {
    "SMOKE": 1.00,
    "BURNING": 1.00,
    "INDUSTRIAL_EMISSION": 1.00,
    "DUST": 0.75,
    "HAZE": 0.70,
    "UNKNOWN": 0.40,
}


def haversine_km(
    lat1: float,
    lon1: float,
    lat2: float,
    lon2: float,
) -> float:
    """
    Calculate great-circle distance between two coordinates.
    """

    earth_radius_km = 6371.0

    lat1_rad = radians(lat1)
    lat2_rad = radians(lat2)

    delta_lat = radians(lat2 - lat1)
    delta_lon = radians(lon2 - lon1)

    a = (
        sin(delta_lat / 2) ** 2
        + cos(lat1_rad)
        * cos(lat2_rad)
        * sin(delta_lon / 2) ** 2
    )

    c = 2 * atan2(sqrt(a), sqrt(1 - a))

    return earth_radius_km * c


def _clamp(value: float, minimum: float = 0.0, maximum: float = 100.0) -> float:
    return max(minimum, min(maximum, value))


def _sensor_evidence_score(report: Dict[str, Any]) -> float:
    """
    Convert citizen sensor readings into an evidence score.

    This is an evidence-strength heuristic, not a regulatory classification.
    """

    sensor = report.get("sensor") or {}

    pm25 = sensor.get("pm25")
    pm10 = sensor.get("pm10")

    scores = []

    if pm25 is not None:
        pm25_score = _clamp((float(pm25) / 250.0) * 100.0)
        scores.append(pm25_score)

    if pm10 is not None:
        pm10_score = _clamp((float(pm10) / 350.0) * 100.0)
        scores.append(pm10_score)

    if not scores:
        return 0.0

    return sum(scores) / len(scores)


def _event_evidence_score(report: Dict[str, Any]) -> float:
    event_type = str(
        report.get("event_type", "UNKNOWN")
    ).strip().upper()

    return EVENT_WEIGHTS.get(event_type, EVENT_WEIGHTS["UNKNOWN"]) * 100.0


def _citizen_evidence_score(report: Dict[str, Any]) -> float:
    """
    Combine event and sensor evidence.

    60% sensor evidence
    40% event evidence
    """

    sensor_score = _sensor_evidence_score(report)
    event_score = _event_evidence_score(report)

    return _clamp(
        0.60 * sensor_score
        + 0.40 * event_score
    )


def _citizen_level(score: float) -> str:
    if score >= 75:
        return "HIGH"

    if score >= 50:
        return "MODERATE"

    if score >= 25:
        return "LOW"

    return "MINIMAL"


def _fused_level(score: float) -> str:
    if score >= 80:
        return "CRITICAL"

    if score >= 65:
        return "HIGH"

    if score >= 45:
        return "MODERATE"

    return "LOW"


def fuse_hotspots(
    prediction: Dict[str, Any],
    citizen_reports: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Fuse model-generated hotspot intelligence with citizen observations.

    The fusion is an evidence-combination heuristic. It does not claim
    causal source attribution or regulatory compliance.
    """

    model_hotspots = prediction.get("hotspots") or []

    fused_hotspots: List[Dict[str, Any]] = []

    matched_report_ids = set()

    for hotspot in model_hotspots:
        hotspot_lat = float(hotspot.get("latitude", 0.0))
        hotspot_lon = float(hotspot.get("longitude", 0.0))

        nearby_reports = []

        for report in citizen_reports:
            try:
                report_lat = float(report["latitude"])
                report_lon = float(report["longitude"])
            except (KeyError, TypeError, ValueError):
                continue

            distance_km = haversine_km(
                hotspot_lat,
                hotspot_lon,
                report_lat,
                report_lon,
            )

            if distance_km <= 5.0:
                evidence_score = _citizen_evidence_score(report)

                nearby_reports.append(
                    {
                        "report_id": report.get("report_id"),
                        "event_type": report.get("event_type"),
                        "distance_km": round(distance_km, 3),
                        "evidence_score": round(evidence_score, 2),
                        "description": report.get("description", ""),
                    }
                )

                if report.get("report_id"):
                    matched_report_ids.add(report["report_id"])

        model_score = float(
            hotspot.get("hotspot_score", 0.0)
        )

        if nearby_reports:
            strongest_citizen_score = max(
                item["evidence_score"]
                for item in nearby_reports
            )

            citizen_support = min(
                25.0,
                strongest_citizen_score * 0.25,
            )

            fused_score = _clamp(
                0.75 * model_score
                + citizen_support
            )
        else:
            strongest_citizen_score = 0.0
            fused_score = _clamp(
                model_score * 0.90
            )

        fused_hotspots.append(
            {
                **hotspot,
                "model_hotspot_score": round(model_score, 2),
                "citizen_evidence_score": round(
                    strongest_citizen_score,
                    2,
                ),
                "citizen_reports_nearby": len(nearby_reports),
                "fused_hotspot_score": round(
                    fused_score,
                    2,
                ),
                "fused_level": _fused_level(fused_score),
                "citizen_evidence": nearby_reports,
                "fusion_method": (
                    "75% model hotspot score + "
                    "citizen evidence support"
                ),
            }
        )

    # Reports that did not match an existing model hotspot
    # are retained as citizen-originated signals.
    unmatched_reports = []

    for report in citizen_reports:
        report_id = report.get("report_id")

        if report_id in matched_report_ids:
            continue

        evidence_score = _citizen_evidence_score(report)

        unmatched_reports.append(
            {
                "report_id": report_id,
                "city": report.get("city"),
                "latitude": report.get("latitude"),
                "longitude": report.get("longitude"),
                "event_type": report.get("event_type"),
                "description": report.get("description", ""),
                "citizen_evidence_score": round(
                    evidence_score,
                    2,
                ),
                "citizen_evidence_level": _citizen_level(
                    evidence_score
                ),
                "source": "citizen_observation",
            }
        )

    fused_hotspots.sort(
        key=lambda item: item["fused_hotspot_score"],
        reverse=True,
    )

    return {
        "city": prediction.get("city"),
        "forecast_horizon_hours": prediction.get(
            "forecast_horizon_hours"
        ),
        "model_prediction": {
            "current_pm25": prediction.get("current_pm25"),
            "predicted_pm25": prediction.get("predicted_pm25"),
            "risk_level": prediction.get("risk_level"),
            "trend": prediction.get("trend"),
            "anomaly": prediction.get("anomaly"),
        },
        "hotspots": fused_hotspots,
        "unmatched_citizen_signals": unmatched_reports,
        "citizen_report_count": len(citizen_reports),
        "matched_citizen_report_count": len(matched_report_ids),
        "fusion_summary": {
            "model_hotspot_count": len(model_hotspots),
            "fused_hotspot_count": len(fused_hotspots),
            "unmatched_citizen_signal_count": len(
                unmatched_reports
            ),
            "matching_radius_km": 5.0,
            "interpretation": (
                "Citizen observations are combined with model-generated "
                "hotspot evidence to strengthen localized environmental "
                "signals. This is an evidence-fusion heuristic and not "
                "causal source attribution or a regulatory determination."
            ),
        },
    }
