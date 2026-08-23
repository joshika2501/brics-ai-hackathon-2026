def validate_environmental_data(observation) -> list[str]:
    warnings = []

    air_quality = observation.air_quality
    weather = observation.weather

    if air_quality.pm25 is None:
        warnings.append("PM2.5 data unavailable")

    if air_quality.no2 is None:
        warnings.append("NO2 data unavailable")

    if weather.temperature is None:
        warnings.append("Temperature data unavailable")

    if weather.wind_speed is None:
        warnings.append("Wind speed data unavailable")

    if weather.humidity is None:
        warnings.append("Humidity data unavailable")

    return warnings