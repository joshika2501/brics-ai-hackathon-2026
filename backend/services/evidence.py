def normalize_drivers(
    drivers,
    trend_direction,
):
    """
    Convert raw SHAP drivers into presentation-safe
    model evidence.

    SHAP sign indicates contribution relative to the
    model baseline. It should not be interpreted directly
    as 'risk increasing' or 'risk decreasing'.
    """

    normalized = []

    for driver in drivers:

        impact = float(
            driver["impact"]
        )

        if impact > 0:
            contribution = "above_baseline"
        elif impact < 0:
            contribution = "below_baseline"
        else:
            contribution = "neutral"

        normalized.append(
            {
                "feature": driver["feature"],
                "shap_impact": round(
                    impact,
                    4,
                ),
                "contribution": contribution,
                "forecast_direction": trend_direction,
            }
        )

    return normalized