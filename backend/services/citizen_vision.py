import base64
import json
import os
import random
import time
from typing import Any, Dict, Optional

from dotenv import load_dotenv
from google import genai
from google.genai import types


load_dotenv(override=True)


VISION_MODEL = "gemini-3.6-flash"


def _get_client() -> Optional[genai.Client]:
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        return None

    return genai.Client(api_key=api_key)


def _fallback_analysis(
    description: str = "",
) -> Dict[str, Any]:
    """
    Deterministic fallback used when Gemini is unavailable.

    This does not claim visual detection because no image analysis
    has been performed.
    """

    return {
        "status": "fallback",
        "model": None,
        "visual_analysis": {
            "event_type": "UNKNOWN",
            "visual_evidence": [],
            "confidence": 0.0,
            "description": (
                "Gemini Vision analysis was unavailable. "
                "No visual conclusion was generated."
            ),
        },
        "input_description": description,
    }


def analyze_environmental_photo(
    image_bytes: bytes,
    mime_type: str = "image/jpeg",
    description: str = "",
) -> Dict[str, Any]:
    """
    Analyze a citizen-submitted environmental image using Gemini Vision.

    The model is instructed to identify visible environmental signals
    without claiming confirmed pollution sources or regulatory violations.
    """

    if not image_bytes:
        raise ValueError("Image data is required.")

    client = _get_client()

    if client is None:
        return _fallback_analysis(
            description=description,
        )

    encoded_image = base64.b64encode(
        image_bytes
    ).decode("utf-8")

    prompt = f"""
You are an environmental observation assistant.

Analyze this citizen-submitted environmental photograph.

The purpose is to identify visible environmental signals that may
help an air-quality monitoring system prioritize observations.

User description:
{description or "No description provided."}

Return ONLY valid JSON with this exact structure:

{{
  "event_type": "SMOKE | DUST | BURNING | INDUSTRIAL_EMISSION | HAZE | UNKNOWN",
  "visual_evidence": [
    "short observable feature"
  ],
  "confidence": 0.0,
  "scene_summary": "short factual description",
  "potential_environmental_signal": "short factual interpretation"
}}

Rules:

1. Describe only what is visually observable.
2. Do not invent measurements.
3. Do not claim a specific pollution source is confirmed.
4. Do not claim a regulatory violation.
5. Do not provide medical advice.
6. If the image is unclear, use UNKNOWN.
7. Confidence must be between 0 and 1.
8. Keep visual_evidence concise.
"""

    try:
        response = None
        max_attempts = 3

        for attempt in range(max_attempts):
            try:
                response = client.models.generate_content(
                    model=VISION_MODEL,
                    contents=[
                        types.Part.from_bytes(
                            data=image_bytes,
                            mime_type=mime_type,
                        ),
                        prompt,
                    ],
                )

                break

            except Exception as exc:
                error_text = str(exc).lower()

                is_retryable = any(
                    marker in error_text
                    for marker in (
                        "503",
                        "unavailable",
                        "high demand",
                        "429",
                        "resource_exhausted",
                    )
                )

                if (
                    not is_retryable
                    or attempt == max_attempts - 1
                ):
                    raise

                delay = min(
                    (2 ** attempt) + random.uniform(0, 0.5),
                    5,
                )

                print(
                    "Gemini temporarily unavailable. "
                    f"Retrying in {delay:.1f}s "
                    f"(attempt {attempt + 2}/{max_attempts})."
                )

                time.sleep(delay)

        text = getattr(
            response,
            "text",
            "",
        )

        if not text:
            return _fallback_analysis(
                description=description,
            )

        cleaned = text.strip()

        if cleaned.startswith("```"):
            cleaned = cleaned.replace(
                "```json",
                "",
            ).replace(
                "```",
                "",
            ).strip()

        parsed = json.loads(cleaned)

        event_type = str(
            parsed.get(
                "event_type",
                "UNKNOWN",
            )
        ).upper()

        allowed_events = {
            "SMOKE",
            "DUST",
            "BURNING",
            "INDUSTRIAL_EMISSION",
            "HAZE",
            "UNKNOWN",
        }

        if event_type not in allowed_events:
            event_type = "UNKNOWN"

        confidence = float(
            parsed.get(
                "confidence",
                0.0,
            )
        )

        confidence = max(
            0.0,
            min(1.0, confidence),
        )

        visual_evidence = parsed.get(
            "visual_evidence",
            [],
        )

        if not isinstance(
            visual_evidence,
            list,
        ):
            visual_evidence = []

        return {
            "status": "generated",
            "model": VISION_MODEL,
            "visual_analysis": {
                "event_type": event_type,
                "visual_evidence": [
                    str(item)
                    for item in visual_evidence[:5]
                ],
                "confidence": round(
                    confidence,
                    3,
                ),
                "scene_summary": str(
                    parsed.get(
                        "scene_summary",
                        "",
                    )
                ),
                "potential_environmental_signal": str(
                    parsed.get(
                        "potential_environmental_signal",
                        "",
                    )
                ),
            },
            "input_description": description,
        }

    except Exception as exc:
        return {
            **_fallback_analysis(
                description=description,
            ),
            "error": str(exc),
        }