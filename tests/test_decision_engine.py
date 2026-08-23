from backend.decision_engine import (
    build_decision,
    determine_priority,
)


def test_critical_rising_is_immediate():

    result = determine_priority(
        risk_level="CRITICAL",
        trend_direction="RISING",
        percentage_change=50,
    )

    assert result == "IMMEDIATE"


def test_high_rising_is_high():

    result = determine_priority(
        risk_level="HIGH",
        trend_direction="RISING",
        percentage_change=20,
    )

    assert result == "HIGH"


def test_moderate_rising_is_watch():

    result = determine_priority(
        risk_level="MODERATE",
        trend_direction="RISING",
        percentage_change=20,
    )

    assert result == "WATCH"


def test_complete_decision():

    result = build_decision(
        risk_level="CRITICAL",
        trend_direction="RISING",
        percentage_change=80,
    )

    assert result["priority"] == "IMMEDIATE"

    assert len(result["actions"]) > 0

    assert len(
        result["vulnerable_groups"]
    ) > 0