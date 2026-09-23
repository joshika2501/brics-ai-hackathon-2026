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


def _clamp(
    value: float,
    minimum: float = 0.0,
    maximum: float = 100.0,
) -> float:
    return max(minimum, min(maximum, value))


def _sensor_evidence_score(report: Dict[str, Any]) -> float:
    """
    Convert citizen sensor readings into an evidence score.

    This is an evidence-strength heuristic, not a regulatory
    classification.
    """

    sensor = report.get("sensor") or {}

    pm25 = sensor.get("pm25")
    pm10 = sensor.get("pm10")

    scores = []

    if pm25 is not None:
        try:
            pm25_score = _clamp((float(pm25) / 250.0) * 100.0)
            scores.append(pm25_score)
        except (TypeError, ValueError):
            pass

    if pm10 is not None:
        try:
            pm10_score = _clamp((float(pm10) / 350.0) * 100.0)
            scores.append(pm10_score)
        except (TypeError, ValueError):
            pass

    if not scores:
        return 0.0

    return sum(scores) / len(scores)


def _event_evidence_score(report: Dict[str, Any]) -> float:
    event_type = str(
        report.get("event_type", "UNKNOWN")
    ).strip().upper()

    return EVENT_WEIGHTS.get(
        event_type,
        EVENT_WEIGHTS["UNKNOWN"],
    ) * 100.0


def _visual_evidence_score(report: Dict[str, Any]) -> float:
    """
    Convert Gemini Vision evidence into an evidence-strength score.

    The score uses model confidence together with the environmental
    event type observed in the image.

    This is an evidence-fusion heuristic, not ground truth,
    causal attribution, or regulatory classification.
    """

    ai_analysis = report.get("ai_analysis") or {}

    if ai_analysis.get("status") != "generated":
        return 0.0

    visual_event = str(
        ai_analysis.get("event_type", "UNKNOWN")
    ).strip().upper()

    confidence = ai_analysis.get("confidence", 0.0)

    try:
        confidence = _clamp(
            float(confidence),
            0.0,
            1.0,
        )
    except (TypeError, ValueError):
        return 0.0

    event_weight = EVENT_WEIGHTS.get(
        visual_event,
        EVENT_WEIGHTS["UNKNOWN"],
    )

    return _clamp(
        confidence * event_weight * 100.0
    )


def _atmospheric_evidence_score(
    atmospheric_evidence: Dict[str, Any] | None,
) -> float:
    """
    Convert atmospheric aerosol evidence into a bounded
    evidence-strength score.

    Atmospheric evidence is intentionally bounded to 10 points
    so contextual atmospheric data cannot dominate the ML model.

    This is an evidence-fusion heuristic, not causal attribution
    or a regulatory classification.
    """

    if not atmospheric_evidence:
        return 0.0

    if atmospheric_evidence.get("status") != "available":
        return 0.0

    evidence = atmospheric_evidence.get("evidence") or {}

    aerosol_signal = str(
        atmospheric_evidence.get(
            "aerosol_signal",
            "UNKNOWN",
        )
    ).strip().upper()

    try:
        confidence = _clamp(
            float(
                atmospheric_evidence.get(
                    "confidence",
                    0.0,
                )
            ),
            0.0,
            1.0,
        )
    except (TypeError, ValueError):
        confidence = 0.0

    signal_weights = {
        "LOW": 0.25,
        "MODERATE": 0.60,
        "ELEVATED": 1.00,
        "UNKNOWN": 0.0,
    }

    signal_strength = signal_weights.get(
        aerosol_signal,
        0.0,
    )

    has_observation = any(
        evidence.get(key) is not None
        for key in (
            "aerosol_optical_depth",
            "pm25_context",
            "pm10_context",
        )
    )

    if not has_observation:
        return 0.0

    return _clamp(
        signal_strength * confidence * 10.0,
        0.0,
        10.0,
    )


def _citizen_evidence_score(
    report: Dict[str, Any],
) -> float:
    """
    Combine citizen sensor, citizen event, and visual AI evidence.

    Base citizen evidence:
        60% sensor evidence
        40% citizen event evidence

    If Gemini Vision evidence is available:
        80% base citizen evidence
        20% visual evidence

    The visual component is intentionally bounded so one
    photograph cannot dominate the complete evidence signal.
    """

    sensor_score = _sensor_evidence_score(report)
    event_score = _event_evidence_score(report)

    base_score = (
        0.60 * sensor_score
        + 0.40 * event_score
    )

    visual_score = _visual_evidence_score(report)

    if visual_score <= 0.0:
        return _clamp(base_score)

    return _clamp(
        0.80 * base_score
        + 0.20 * visual_score
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
    atmospheric_evidence: Dict[str, Any] | None = None,
) -> Dict[str, Any]:
    """
    Fuse model-generated hotspot intelligence with:

    - citizen observations
    - citizen sensor readings
    - Gemini Vision evidence
    - atmospheric aerosol evidence

    The fusion is an evidence-combination heuristic.
    It does not claim causal source attribution or regulatory
    compliance.
    """

    model_hotspots = prediction.get("hotspots") or []

    fused_hotspots: List[Dict[str, Any]] = []

    matched_report_ids = set()

    for hotspot in model_hotspots:
        hotspot_lat = float(
            hotspot.get("latitude", 0.0)
        )

        hotspot_lon = float(
            hotspot.get("longitude", 0.0)
        )

        nearby_reports = []

        for report in citizen_reports:
            try:
                report_lat = float(
                    report["latitude"]
                )

                report_lon = float(
                    report["longitude"]
                )

            except (
                KeyError,
                TypeError,
                ValueError,
            ):
                continue

            distance_km = haversine_km(
                hotspot_lat,
                hotspot_lon,
                report_lat,
                report_lon,
            )

            if distance_km <= 5.0:
                evidence_score = _citizen_evidence_score(
                    report
                )

                ai_analysis = (
                    report.get("ai_analysis") or {}
                )

                nearby_reports.append(
                    {
                        "report_id": report.get(
                            "report_id"
                        ),
                        "event_type": report.get(
                            "event_type"
                        ),
                        "distance_km": round(
                            distance_km,
                            3,
                        ),
                        "evidence_score": round(
                            evidence_score,
                            2,
                        ),
                        "description": report.get(
                            "description",
                            "",
                        ),
                        "visual_ai": {
                            "status": ai_analysis.get(
                                "status"
                            ),
                            "model": ai_analysis.get(
                                "model"
                            ),
                            "event_type": ai_analysis.get(
                                "event_type",
                                "UNKNOWN",
                            ),
                            "confidence": ai_analysis.get(
                                "confidence",
                                0.0,
                            ),
                            "visual_evidence": ai_analysis.get(
                                "visual_evidence",
                                [],
                            ),
                            "potential_environmental_signal": (
                                ai_analysis.get(
                                    "potential_environmental_signal",
                                    "",
                                )
                            ),
                        },
                    }
                )

                if report.get("report_id"):
                    matched_report_ids.add(
                        report["report_id"]
                    )

        model_score = float(
            hotspot.get(
                "hotspot_score",
                0.0,
            )
        )

        atmospheric_score = (
            _atmospheric_evidence_score(
                atmospheric_evidence
            )
        )

        if nearby_reports:
            strongest_citizen_score = max(
                item["evidence_score"]
                for item in nearby_reports
            )
        else:
            strongest_citizen_score = 0.0

        if atmospheric_score > 0.0:
            # Multi-source fusion:
            # 70% ML model
            # 20% citizen evidence
            # 10% atmospheric evidence

            citizen_support = min(
                20.0,
                strongest_citizen_score * 0.20,
            )

            fused_score = _clamp(
                0.70 * model_score
                + citizen_support
                + atmospheric_score
            )

            fusion_method = (
                "70% ML hotspot score + "
                "20% citizen evidence + "
                "10% atmospheric evidence"
            )

        elif nearby_reports:
            # Preserve the original model/citizen
            # fusion behavior when atmospheric
            # evidence is unavailable.

            citizen_support = min(
                25.0,
                strongest_citizen_score * 0.25,
            )

            fused_score = _clamp(
                0.75 * model_score
                + citizen_support
            )

            fusion_method = (
                "75% model hotspot score + "
                "citizen evidence support"
            )

        else:
            # No citizen or atmospheric evidence.
            fused_score = _clamp(
                model_score * 0.90
            )

            fusion_method = (
                "90% model hotspot score "
                "(no citizen or atmospheric evidence)"
            )

        atmospheric_payload = {
            "status": (
                atmospheric_evidence.get(
                    "status"
                )
                if atmospheric_evidence
                else "unavailable"
            ),
            "source": (
                atmospheric_evidence.get(
                    "source"
                )
                if atmospheric_evidence
                else None
            ),
            "aerosol_signal": (
                atmospheric_evidence.get(
                    "aerosol_signal"
                )
                if atmospheric_evidence
                else "UNKNOWN"
            ),
            "confidence": (
                atmospheric_evidence.get(
                    "confidence",
                    0.0,
                )
                if atmospheric_evidence
                else 0.0
            ),
            "evidence": (
                atmospheric_evidence.get(
                    "evidence",
                    {},
                )
                if atmospheric_evidence
                else {}
            ),
        }

        fused_hotspots.append(
            {
                **hotspot,

                "model_hotspot_score": round(
                    model_score,
                    2,
                ),

                "citizen_evidence_score": round(
                    strongest_citizen_score,
                    2,
                ),

                "citizen_reports_nearby": len(
                    nearby_reports
                ),

                "atmospheric_evidence_score": round(
                    atmospheric_score,
                    2,
                ),

                "atmospheric_evidence": (
                    atmospheric_payload
                ),

                "fused_hotspot_score": round(
                    fused_score,
                    2,
                ),

                "fused_level": _fused_level(
                    fused_score
                ),

                "citizen_evidence": nearby_reports,

                "fusion_method": fusion_method,
            }
        )

    # Reports that did not match an existing
    # model hotspot are retained as citizen-originated
    # signals.

    unmatched_reports = []

    for report in citizen_reports:
        report_id = report.get(
            "report_id"
        )

        if report_id in matched_report_ids:
            continue

        evidence_score = _citizen_evidence_score(
            report
        )

        unmatched_reports.append(
            {
                "report_id": report_id,
                "city": report.get("city"),
                "latitude": report.get("latitude"),
                "longitude": report.get("longitude"),
                "event_type": report.get(
                    "event_type"
                ),
                "description": report.get(
                    "description",
                    "",
                ),
                "citizen_evidence_score": round(
                    evidence_score,
                    2,
                ),
                "citizen_evidence_level": (
                    _citizen_level(
                        evidence_score
                    )
                ),
                "source": "citizen_observation",
            }
        )

    fused_hotspots.sort(
        key=lambda item: item[
            "fused_hotspot_score"
        ],
        reverse=True,
    )

    atmospheric_summary = {
        "status": (
            atmospheric_evidence.get(
                "status"
            )
            if atmospheric_evidence
            else "unavailable"
        ),
        "source": (
            atmospheric_evidence.get(
                "source"
            )
            if atmospheric_evidence
            else None
        ),
        "aerosol_signal": (
            atmospheric_evidence.get(
                "aerosol_signal"
            )
            if atmospheric_evidence
            else "UNKNOWN"
        ),
        "confidence": (
            atmospheric_evidence.get(
                "confidence",
                0.0,
            )
            if atmospheric_evidence
            else 0.0
        ),
    }

    return {
        "city": prediction.get("city"),

        "forecast_horizon_hours": (
            prediction.get(
                "forecast_horizon_hours"
            )
        ),

        "model_prediction": {
            "current_pm25": prediction.get(
                "current_pm25"
            ),
            "predicted_pm25": prediction.get(
                "predicted_pm25"
            ),
            "forecast_horizon_hours": prediction.get(
                "forecast_horizon_hours"
            ),
            "risk_level": prediction.get(
                "risk_level"
            ),
            "trend": prediction.get(
                "trend"
            ),
            "anomaly": prediction.get(
                "anomaly"
            ),
        },

        "hotspots": fused_hotspots,

        "unmatched_citizen_signals": (
            unmatched_reports
        ),

        "citizen_report_count": len(
            citizen_reports
        ),

        "matched_citizen_report_count": len(
            matched_report_ids
        ),

        "fusion_summary": {
            "model_hotspot_count": len(
                model_hotspots
            ),

            "fused_hotspot_count": len(
                fused_hotspots
            ),

            "unmatched_citizen_signal_count": len(
                unmatched_reports
            ),

            "matching_radius_km": 5.0,

            "atmospheric_evidence": (
                atmospheric_summary
            ),

            "evidence_sources": [
                "ML hotspot prediction",
                "Citizen observations",
                "Gemini Vision analysis",
                "Atmospheric aerosol evidence",
            ],

            "interpretation": (
                "Model predictions, citizen observations, "
                "visual AI evidence, and atmospheric observations "
                "are combined when available to strengthen "
                "localized environmental signals. This is an "
                "evidence-fusion heuristic and not causal source "
                "attribution or a regulatory determination."
            ),
        },
    }