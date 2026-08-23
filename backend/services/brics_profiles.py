BRICS_PROFILES = {
    "India": {
        "country": "India",
        "regulatory_reference": "CPCB National Ambient Air Quality Standards",
        "pm25_24h_reference": 60.0,
        "reference_period": "24-hour",
        "reference_type": "national_standard",
        "source_note": "India PM2.5 national standard: 60 µg/m³ for 24-hour averaging.",
        "advisory_context": [
            "People with respiratory sensitivity",
            "Outdoor workers",
        ],
    },

    "Brazil": {
        "country": "Brazil",
        "regulatory_reference": "CONAMA Resolution 506/2024",
        "pm25_24h_reference": 50.0,
        "reference_period": "24-hour",
        "reference_type": "national_intermediate_standard",
        "source_note": "Brazil uses staged national PM2.5 standards under CONAMA Resolution 506/2024.",
        "advisory_context": [
            "People with respiratory sensitivity",
            "Children and older adults",
            "Outdoor workers",
        ],
    },

    "South Africa": {
        "country": "South Africa",
        "regulatory_reference": "South African National Ambient Air Quality Standards",
        "pm25_24h_reference": 40.0,
        "reference_period": "24-hour",
        "reference_type": "national_standard",
        "source_note": "South Africa PM2.5 national standard: 40 µg/m³ for the current 24-hour averaging period.",
        "advisory_context": [
            "People with respiratory sensitivity",
            "Children and older adults",
            "Outdoor workers",
        ],
    },
}


def get_brics_profile(country: str):
    if country not in BRICS_PROFILES:
        raise ValueError(
            f"Unsupported BRICS country: {country}"
        )

    return BRICS_PROFILES[country].copy()


def compare_forecast_to_reference(
    predicted_pm25: float,
    country: str,
):
    profile = get_brics_profile(country)

    reference = profile["pm25_24h_reference"]

    ratio = predicted_pm25 / reference

    if ratio >= 1.5:
        comparison = "WELL_ABOVE_REFERENCE"
    elif ratio >= 1.0:
        comparison = "ABOVE_REFERENCE"
    elif ratio >= 0.75:
        comparison = "NEAR_REFERENCE"
    else:
        comparison = "BELOW_REFERENCE"

    return {
        "reference_value": reference,
        "reference_period": profile["reference_period"],
        "comparison": comparison,
        "ratio_to_reference": round(ratio, 2),
        "note": (
            "This comparison is informational. "
            "The model forecast is not a regulatory "
            "24-hour average."
        ),
    }