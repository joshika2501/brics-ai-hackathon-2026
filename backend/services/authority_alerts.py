from datetime import datetime, timezone
from typing import Any, Dict, List


def _clamp(
    value: float,
    minimum: float = 0.0,
    maximum: float = 100.0,
) -> float:
    return max(minimum, min(maximum, value))


def _priority_from_score(score: float) -> str:
    if score >= 80:
        return "CRITICAL"

    if score >= 65:
        return "HIGH"

    if score >= 45:
        return "MODERATE"

    return "LOW"


def _recommended_action(
    priority: str,
    hotspot: Dict[str, Any],
) -> str:

    zone_type = str(
        hotspot.get("zone_type", "unknown")
    ).lower()

    event_types = {
        str(item.get("event_type", "")).upper()
        for item in hotspot.get("citizen_evidence", [])
    }

    if priority == "CRITICAL":
        return (
            "Immediate field verification and coordinated "
            "inspection of the localized pollution signal."
        )

    if priority == "HIGH":
        if "BURNING" in event_types:
            return (
                "Prioritize field verification of the reported "
                "burning signal and inspect the surrounding area."
            )

        if "INDUSTRIAL_EMISSION" in event_types:
            return (
                "Prioritize inspection of the industrial zone "
                "and verify the reported emission signal."
            )

        if "SMOKE" in event_types:
            return (
                "Prioritize field verification of the reported "
                "smoke signal and inspect nearby sources."
            )

        if zone_type == "industrial":
            return (
                "Prioritize inspection of the industrial zone "
                "and verify the localized pollution signal."
            )

        return (
            "Prioritize field verification of the localized "
            "pollution signal."
        )

    if priority == "MODERATE":
        return (
            "Increase local monitoring and verify the signal "
            "if supporting observations persist."
        )

    return (
        "Continue routine monitoring and reassess if new "
        "citizen or environmental evidence appears."
    )


def _build_evidence(
    hotspot: Dict[str, Any],
    prediction: Dict[str, Any],
) -> List[Dict[str, Any]]:

    evidence: List[Dict[str, Any]] = []

    model_score = hotspot.get("model_hotspot_score")

    if model_score is not None:
        evidence.append(
            {
                "type": "MODEL_HOTSPOT",
                "value": model_score,
                "description": (
                    "Model-generated localized hotspot score."
                ),
            }
        )

    citizen_score = hotspot.get("citizen_evidence_score")

    if citizen_score is not None and citizen_score > 0:
        evidence.append(
            {
                "type": "CITIZEN_EVIDENCE",
                "value": citizen_score,
                "description": (
                    "Evidence strength from geographically "
                    "proximate citizen observations."
                ),
            }
        )

    nearby_count = hotspot.get("citizen_reports_nearby", 0)

    if nearby_count:
        evidence.append(
            {
                "type": "CITIZEN_REPORTS",
                "value": nearby_count,
                "description": (
                    "Number of citizen reports within the "
                    "hotspot matching radius."
                ),
            }
        )

    anomaly = prediction.get("anomaly") or {}

    anomaly_score = anomaly.get("score")

    if anomaly_score is not None:
        evidence.append(
            {
                "type": "ANOMALY_SIGNAL",
                "value": anomaly_score,
                "description": (
                    "Historical environmental anomaly score."
                ),
            }
        )

    trend = prediction.get("trend") or {}

    if trend.get("direction"):
        evidence.append(
            {
                "type": "FORECAST_TREND",
                "value": trend.get("direction"),
                "description": (
                    "Direction of the model forecast over the "
                    "forecast horizon."
                ),
            }
        )

    for citizen_item in hotspot.get(
        "citizen_evidence",
        [],
    ):
        event_type = citizen_item.get("event_type")

        if event_type:
            evidence.append(
                {
                    "type": "CITIZEN_EVENT",
                    "value": event_type,
                    "description": (
                        "Citizen-reported environmental event."
                    ),
                }
            )

    return evidence


def generate_authority_alerts(
    fusion_result: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Convert hotspot-fusion evidence into structured authority alerts.

    The output is an operational prioritization layer. It does not
    establish causality, regulatory violations, or confirmed sources.
    """

    prediction = (
        fusion_result.get("model_prediction")
        or {}
    )

    hotspots = fusion_result.get("hotspots") or []

    alerts: List[Dict[str, Any]] = []

    for hotspot in hotspots:
        fused_score = float(
            hotspot.get(
                "fused_hotspot_score",
                0.0,
            )
        )

        priority = _priority_from_score(
            fused_score
        )

        evidence = _build_evidence(
            hotspot=hotspot,
            prediction=prediction,
        )

        citizen_events = [
            item.get("event_type")
            for item in hotspot.get(
                "citizen_evidence",
                []
            )
            if item.get("event_type")
        ]

        alert = {
            "alert_id": (
                f"ENV-{hotspot.get('id', 'UNKNOWN')}-"
                f"{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"
            ),
            "alert_type": "LOCALIZED_POLLUTION_SIGNAL",
            "priority": priority,
            "status": "OPEN",
            "city": fusion_result.get("city"),
            "location": {
                "name": hotspot.get("name"),
                "latitude": hotspot.get("latitude"),
                "longitude": hotspot.get("longitude"),
                "zone_type": hotspot.get("zone_type"),
            },
            "fused_score": round(
                fused_score,
                2,
            ),
            "model_hotspot_score": hotspot.get(
                "model_hotspot_score"
            ),
            "citizen_evidence_score": hotspot.get(
                "citizen_evidence_score"
            ),
            "citizen_reports_nearby": hotspot.get(
                "citizen_reports_nearby",
                0,
            ),
            "citizen_event_types": citizen_events,
            "evidence": evidence,
            "recommended_action": _recommended_action(
                priority=priority,
                hotspot=hotspot,
            ),
            "forecast": {
                "current_pm25": prediction.get(
                    "current_pm25"
                ),
                "predicted_pm25": prediction.get(
                    "predicted_pm25"
                ),
                "forecast_horizon_hours": prediction.get(
                    "forecast_horizon_hours",
                    (prediction.get("forecast") or {}).get("horizon_hours")
                ),
                "risk_level": prediction.get(
                    "risk_level"
                ),
                "trend": prediction.get(
                    "trend"
                ),
            },
            "created_at": datetime.now(
                timezone.utc
            ).isoformat(),
            "interpretation": (
                "This alert prioritizes a localized environmental "
                "signal using model and citizen evidence. It is "
                "not a determination of regulatory violation or "
                "confirmed pollution source."
            ),
        }

        alerts.append(alert)

    priority_order = {
        "CRITICAL": 0,
        "HIGH": 1,
        "MODERATE": 2,
        "LOW": 3,
    }

    alerts.sort(
        key=lambda item: (
            priority_order.get(
                item["priority"],
                99,
            ),
            -item["fused_score"],
        )
    )

    priority_counts = {
        "CRITICAL": 0,
        "HIGH": 0,
        "MODERATE": 0,
        "LOW": 0,
    }

    for alert in alerts:
        priority_counts[
            alert["priority"]
        ] += 1

    return {
        "city": fusion_result.get("city"),
        "alerts": alerts,
        "summary": {
            "total_alerts": len(alerts),
            "priority_counts": priority_counts,
            "open_alerts": len(alerts),
            "alert_type": "LOCALIZED_POLLUTION_SIGNAL",
            "interpretation": (
                "Alerts are generated from model hotspot evidence "
                "and nearby citizen observations to support "
                "operational prioritization."
            ),
        },
    }

