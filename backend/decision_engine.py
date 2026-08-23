from typing import Dict, List


def determine_priority(
    risk_level: str,
    trend_direction: str,
    percentage_change: float,
) -> str:
    """
    Determine operational priority from forecast risk
    and short-term trend.
    """

    if risk_level == "CRITICAL":
        return "IMMEDIATE"

    if (
        risk_level == "VERY HIGH"
        and trend_direction == "RISING"
    ):
        return "IMMEDIATE"

    if (
        risk_level == "HIGH"
        and trend_direction == "RISING"
    ):
        return "HIGH"

    if (
        risk_level == "HIGH"
        or abs(percentage_change) >= 25
    ):
        return "HIGH"

    if risk_level == "MODERATE":
        return "WATCH"

    return "ROUTINE"


def generate_actions(
    risk_level: str,
    trend_direction: str,
    priority: str,
) -> List[str]:
    """
    Generate deterministic decision-support actions.

    These are advisory prototype actions and should be
    aligned with official local response protocols before
    real-world deployment.
    """

    if priority == "IMMEDIATE":

        return [
            "Issue an early environmental warning.",
            "Increase monitoring frequency.",
            "Prioritize protection of vulnerable populations.",
        ]

    if priority == "HIGH":

        return [
            "Increase environmental monitoring.",
            "Prepare an early warning communication.",
            "Advise vulnerable populations to take precautions.",
        ]

    if risk_level == "MODERATE":

        if trend_direction == "RISING":
            return [
                "Continue close monitoring.",
                "Prepare an early warning if deterioration continues.",
            ]

        return [
            "Continue routine monitoring.",
            "Track the six-hour forecast for changes.",
        ]

    return [
        "Continue routine environmental monitoring.",
    ]


def identify_vulnerable_groups(
    risk_level: str,
) -> List[str]:
    """
    Identify groups that may require additional attention.

    This is a generic decision-support list and is not
    medical advice.
    """

    if risk_level in [
        "HIGH",
        "VERY HIGH",
        "CRITICAL",
    ]:

        return [
            "People with respiratory conditions",
            "Children",
            "Older adults",
            "People with cardiovascular conditions",
            "Outdoor workers",
        ]

    if risk_level == "MODERATE":

        return [
            "People with respiratory sensitivity",
            "Outdoor workers",
        ]

    return []


def build_decision(
    risk_level: str,
    trend_direction: str,
    percentage_change: float,
) -> Dict:
    """
    Combine forecast risk and trend into a structured
    decision-support object.
    """

    priority = determine_priority(
        risk_level=risk_level,
        trend_direction=trend_direction,
        percentage_change=percentage_change,
    )

    actions = generate_actions(
        risk_level=risk_level,
        trend_direction=trend_direction,
        priority=priority,
    )

    vulnerable_groups = (
        identify_vulnerable_groups(
            risk_level
        )
    )

    return {
        "priority": priority,
        "actions": actions,
        "vulnerable_groups": vulnerable_groups,
    }