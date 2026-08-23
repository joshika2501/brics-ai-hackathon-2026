from math import sqrt


CITY_ZONES = {
    "Delhi": [
        {
            "id": "delhi-industrial-north",
            "name": "North Delhi Industrial Corridor",
            "latitude": 28.7041,
            "longitude": 77.1025,
            "type": "industrial",
            "source_risk": 0.90,
        },
        {
            "id": "delhi-central",
            "name": "Central Delhi",
            "latitude": 28.6139,
            "longitude": 77.2090,
            "type": "urban",
            "source_risk": 0.55,
        },
        {
            "id": "delhi-east",
            "name": "East Delhi",
            "latitude": 28.6280,
            "longitude": 77.2780,
            "type": "urban",
            "source_risk": 0.60,
        },
        {
            "id": "delhi-south",
            "name": "South Delhi",
            "latitude": 28.5355,
            "longitude": 77.2410,
            "type": "urban",
            "source_risk": 0.40,
        },
    ],

    "Johannesburg": [
        {
            "id": "jhb-industrial-east",
            "name": "Eastern Industrial Corridor",
            "latitude": -26.1800,
            "longitude": 28.1000,
            "type": "industrial",
            "source_risk": 0.90,
        },
        {
            "id": "jhb-central",
            "name": "Central Johannesburg",
            "latitude": -26.2041,
            "longitude": 28.0473,
            "type": "urban",
            "source_risk": 0.55,
        },
        {
            "id": "jhb-south",
            "name": "Southern Johannesburg",
            "latitude": -26.2600,
            "longitude": 28.0500,
            "type": "urban",
            "source_risk": 0.65,
        },
    ],

    "Sao Paulo": [
        {
            "id": "sp-industrial-east",
            "name": "Eastern Industrial Zone",
            "latitude": -23.5500,
            "longitude": -46.5000,
            "type": "industrial",
            "source_risk": 0.85,
        },
        {
            "id": "sp-central",
            "name": "Central Sao Paulo",
            "latitude": -23.5505,
            "longitude": -46.6333,
            "type": "urban",
            "source_risk": 0.55,
        },
        {
            "id": "sp-south",
            "name": "Southern Sao Paulo",
            "latitude": -23.6500,
            "longitude": -46.6500,
            "type": "urban",
            "source_risk": 0.45,
        },
    ],
}


def _clamp(value, minimum=0.0, maximum=1.0):
    return max(minimum, min(maximum, value))


def generate_hotspots(
    city: str,
    current_pm25: float,
    predicted_pm25: float,
    risk_level: str,
    trend_direction: str,
    drivers: list,
):
    """
    Generate estimated hyperlocal hotspot risk.

    IMPORTANT:
    These are model-derived risk estimates, not direct
    measurements from neighborhood sensors.
    """

    zones = CITY_ZONES.get(city)

    if not zones:
        return []

    # Base pollution pressure from the existing prediction.
    if current_pm25 > 100:
        pollution_pressure = 1.0
    elif current_pm25 > 60:
        pollution_pressure = 0.85
    elif current_pm25 > 35:
        pollution_pressure = 0.65
    elif current_pm25 > 15:
        pollution_pressure = 0.40
    else:
        pollution_pressure = 0.20

    forecast_pressure = _clamp(
        predicted_pm25 / 150.0
    )

    trend_pressure = {
        "RISING": 0.90,
        "FALLING": 0.25,
        "STABLE": 0.50,
    }.get(
        str(trend_direction).upper(),
        0.50,
    )

    driver_pressure = 0.0

    for driver in drivers[:5]:
        impact = abs(
            float(
                driver.get(
                    "impact",
                    0,
                )
            )
        )

        driver_pressure += impact

    driver_pressure = _clamp(
        driver_pressure / 50.0
    )

    hotspots = []

    for zone in zones:

        score = (
            0.35 * pollution_pressure
            + 0.25 * forecast_pressure
            + 0.15 * trend_pressure
            + 0.15 * zone["source_risk"]
            + 0.10 * driver_pressure
        )

        score = round(
            _clamp(score) * 100,
            1,
        )

        if score >= 75:
            hotspot_level = "VERY HIGH"
        elif score >= 55:
            hotspot_level = "HIGH"
        elif score >= 35:
            hotspot_level = "MODERATE"
        else:
            hotspot_level = "LOW"

        hotspots.append(
            {
                "id": zone["id"],
                "name": zone["name"],
                "latitude": zone["latitude"],
                "longitude": zone["longitude"],
                "zone_type": zone["type"],
                "hotspot_score": score,
                "hotspot_level": hotspot_level,
                "estimated": True,
                "evidence_basis": [
                    "city-level PM2.5 forecast",
                    "forecast trend",
                    "meteorological/model evidence",
                    "source-risk profile",
                ],
            }
        )

    hotspots.sort(
        key=lambda item: item["hotspot_score"],
        reverse=True,
    )

    return hotspots