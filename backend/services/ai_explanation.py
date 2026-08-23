import json
import os
import re

from google import genai


MODEL_NAME = "gemini-3.6-flash"


def _build_prompt(prediction_data: dict) -> str:
    evidence_package = {
        "city": prediction_data.get("city"),
        "country": prediction_data.get("country"),
        "forecast": prediction_data.get("forecast", {}),
        "risk": prediction_data.get("risk", {}),
        "evidence": prediction_data.get("evidence", []),
        "decision": prediction_data.get("decision", {}),
        "brics_context": prediction_data.get("brics_context", {}),
    }

    return f"""
You are the environmental intelligence explanation layer
of a decision-support system.

Your job is to explain the supplied model output clearly
to a government, city-management, environmental-monitoring,
or emergency-response decision maker.

IMPORTANT RULES:

1. Use ONLY the information supplied below.
2. Do NOT invent environmental measurements.
3. Do NOT change the predicted PM2.5 value.
4. Do NOT change the risk level.
5. Do NOT create new regulatory limits.
6. Do NOT override the system's recommended priority.
7. Do NOT claim that an hourly forecast is itself a regulatory exceedance.
8. Clearly distinguish model prediction from regulatory reference information.
9. Do not provide medical diagnosis.
10. Keep the explanation concise and actionable.

Return ONLY valid JSON using this exact structure:

{{
    "headline": "short decision-oriented summary",
    "situation": "what is happening",
    "why_it_matters": "why the forecast matters",
    "key_drivers": [
        "driver explanation 1",
        "driver explanation 2"
    ],
    "recommended_action": "most important action",
    "confidence_note": "brief statement about the evidence and forecast limitations"
}}

Do not wrap the JSON in Markdown code fences.

DATA FROM THE SYSTEM:

{json.dumps(evidence_package, indent=2)}
"""


def _extract_json(text: str) -> dict:
    if not text:
        raise ValueError("Gemini returned an empty response.")

    cleaned = text.strip()

    cleaned = re.sub(
        r"^```(?:json)?\s*",
        "",
        cleaned,
        flags=re.IGNORECASE,
    )

    cleaned = re.sub(
        r"\s*```$",
        "",
        cleaned,
    )

    cleaned = cleaned.strip()

    try:
        result = json.loads(cleaned)

        if not isinstance(result, dict):
            raise ValueError(
                "Gemini JSON response is not an object."
            )

        return result

    except json.JSONDecodeError:
        pass

    start = cleaned.find("{")
    end = cleaned.rfind("}")

    if start == -1 or end == -1 or end <= start:
        raise ValueError(
            "Gemini response did not contain a valid JSON object."
        )

    json_text = cleaned[start:end + 1]

    result = json.loads(json_text)

    if not isinstance(result, dict):
        raise ValueError(
            "Extracted Gemini response is not a JSON object."
        )

    return result


def _normalize_explanation(result: dict) -> dict:
    required_fields = [
        "headline",
        "situation",
        "why_it_matters",
        "key_drivers",
        "recommended_action",
        "confidence_note",
    ]

    for field in required_fields:
        if field not in result:
            raise ValueError(
                f"Gemini response missing required field: {field}"
            )

    if not isinstance(result["key_drivers"], list):
        raise ValueError(
            "Gemini key_drivers must be a list."
        )

    return {
        "headline": str(result["headline"]),
        "situation": str(result["situation"]),
        "why_it_matters": str(result["why_it_matters"]),
        "key_drivers": [
            str(item)
            for item in result["key_drivers"]
        ],
        "recommended_action": str(
            result["recommended_action"]
        ),
        "confidence_note": str(
            result["confidence_note"]
        ),
    }


def explain_prediction(prediction_data: dict) -> dict:
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        return _fallback_explanation(
            prediction_data,
            reason="Gemini API key not configured.",
        )

    try:
        client = genai.Client(
            api_key=api_key
        )

        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=_build_prompt(
                prediction_data
            ),
        )

        text = (
            response.text or ""
        ).strip()

        result = _extract_json(text)

        result = _normalize_explanation(
            result
        )

        return {
            "status": "generated",
            "model": MODEL_NAME,
            "explanation": result,
        }

    except Exception as exc:
        return _fallback_explanation(
            prediction_data,
            reason=str(exc),
        )


def _fallback_explanation(
    prediction_data: dict,
    reason: str,
) -> dict:

    city = prediction_data.get(
        "city",
        "the monitored city",
    )

    forecast = prediction_data.get(
        "forecast",
        {},
    )

    risk = prediction_data.get(
        "risk",
        {},
    )

    decision = prediction_data.get(
        "decision",
        {},
    )

    predicted_pm25 = forecast.get(
        "predicted_pm25"
    )

    risk_level = risk.get(
        "level",
        "UNKNOWN",
    )

    trend = risk.get(
        "trend",
        "UNKNOWN",
    )

    priority = decision.get(
        "priority",
        "MONITOR",
    )

    return {
        "status": "fallback",
        "reason": reason,
        "model": None,
        "explanation": {
            "headline": (
                f"{city} is forecast to have "
                f"PM2.5 of approximately "
                f"{predicted_pm25} µg/m³ "
                f"in 6 hours."
            ),

            "situation": (
                f"The forecast indicates a "
                f"{trend.lower()} trend with "
                f"{risk_level.lower()} risk."
            ),

            "why_it_matters": (
                "The forecast should be considered "
                "alongside the current environmental "
                "conditions and model evidence."
            ),

            "key_drivers": [
                item.get("feature")
                for item in prediction_data.get(
                    "evidence",
                    [],
                )[:3]
            ],

            "recommended_action": (
                f"System priority: {priority}."
            ),

            "confidence_note": (
                "This explanation is generated "
                "from the deterministic system output. "
                "It is not a regulatory determination."
            ),
        },
    }
