from backend.services.historical import get_historical_data


def test_historical_data():

    df = get_historical_data(
        latitude=28.6139,
        longitude=77.2090,
        start_date="2026-08-01",
        end_date="2026-08-07",
    )

    assert not df.empty

    assert "time" in df.columns
    assert "pm2_5" in df.columns
    assert "pm10" in df.columns
    assert "nitrogen_dioxide" in df.columns

    assert "temperature_2m" in df.columns
    assert "relative_humidity_2m" in df.columns
    assert "wind_speed_10m" in df.columns

    print("\nHistorical dataset shape:", df.shape)
    print(df.head())
