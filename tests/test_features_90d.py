import pandas as pd

from backend.services.feature_engineering import create_features


def test_feature_engineering_90d():

    df = pd.read_csv(
        "data/raw_90d/delhi.csv"
    )

    result = create_features(df)

    assert len(result) > 2000

    required_columns = [
        "pm25_lag_1",
        "pm25_lag_3",
        "pm25_lag_6",
        "pm25_rolling_mean_6h",
        "pm25_rolling_std_6h",
        "no2_change",
        "hour",
        "day_of_week",
        "target_pm25_6h",
    ]

    for column in required_columns:
        assert column in result.columns

    assert result["target_pm25_6h"].notna().all()