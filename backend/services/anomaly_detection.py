from functools import lru_cache
from pathlib import Path

import numpy as np
import pandas as pd


DATASET = Path(
    "data/processed/training_dataset_90d.csv"
)


# -------------------------------------------------------------------
# Historical data
# -------------------------------------------------------------------

@lru_cache(maxsize=1)
def _load_dataset() -> pd.DataFrame:
    df = pd.read_csv(DATASET)

    df["time"] = pd.to_datetime(df["time"])

    return df


@lru_cache(maxsize=3)
def _get_city_history(city: str) -> pd.DataFrame:
    df = _load_dataset()

    city_df = (
        df[df["city"] == city]
        .sort_values("time")
        .reset_index(drop=True)
    )

    if city_df.empty:
        raise ValueError(
            f"No historical data available for city: {city}"
        )

    return city_df


# -------------------------------------------------------------------
# Statistical profile
# -------------------------------------------------------------------

@lru_cache(maxsize=3)
def _get_city_profile(city: str) -> dict:
    df = _get_city_history(city)

    pm25 = df["pm2_5"].dropna()

    mean = float(pm25.mean())
    std = float(pm25.std())

    q1 = float(pm25.quantile(0.25))
    median = float(pm25.median())
    q3 = float(pm25.quantile(0.75))

    iqr = q3 - q1

    return {
        "mean": mean,
        "std": std,
        "q1": q1,
        "median": median,
        "q3": q3,
        "iqr": iqr,
        "min": float(pm25.min()),
        "max": float(pm25.max()),
    }


# -------------------------------------------------------------------
# Utility functions
# -------------------------------------------------------------------

def _clip(value: float, minimum: float = 0.0, maximum: float = 1.0) -> float:
    return max(minimum, min(maximum, value))


def _safe_z_score(
    value: float,
    mean: float,
    std: float,
) -> float:

    if std <= 0:
        return 0.0

    return (value - mean) / std


# -------------------------------------------------------------------
# PM2.5 statistical anomaly
# -------------------------------------------------------------------

def _pm25_anomaly(
    current_pm25: float,
    profile: dict,
) -> dict:

    z_score = _safe_z_score(
        current_pm25,
        profile["mean"],
        profile["std"],
    )

    absolute_z = abs(z_score)

    # Convert statistical deviation into a 0-1 score.
    score = _clip(absolute_z / 4.0)

    if absolute_z >= 3.0:
        severity = "SEVERE"
    elif absolute_z >= 2.0:
        severity = "HIGH"
    elif absolute_z >= 1.0:
        severity = "MODERATE"
    else:
        severity = "NORMAL"

    return {
        "z_score": round(z_score, 3),
        "score": round(score, 3),
        "severity": severity,
    }


# -------------------------------------------------------------------
# Recent temporal anomaly
# -------------------------------------------------------------------

def _temporal_anomaly(
    city: str,
    current_pm25: float,
    current_row: dict,
) -> dict:

    history = _get_city_history(city)

    current_hour = current_row.get("hour")

    current_day = current_row.get("day_of_week")

    # Prefer observations from the same hour and nearby
    # days so the baseline reflects normal time-of-day behavior.
    if current_hour is not None:
        hour_history = history[
            history["hour"] == int(current_hour)
        ]

        if current_day is not None and len(hour_history) >= 10:
            day_history = hour_history[
                hour_history["day_of_week"] == int(current_day)
            ]

            if len(day_history) >= 5:
                reference = day_history["pm2_5"].dropna()
            else:
                reference = hour_history["pm2_5"].dropna()
        else:
            reference = hour_history["pm2_5"].dropna()

    else:
        reference = history["pm2_5"].dropna()

    # Fall back to recent observations if there are not enough
    # time-matched historical observations.
    if len(reference) < 5:
        reference = history["pm2_5"].tail(48).dropna()

    if len(reference) == 0:
        return {
            "baseline": round(current_pm25, 2),
            "change_percent": 0.0,
            "score": 0.0,
            "severity": "NORMAL",
        }

    baseline = float(reference.mean())

    if baseline <= 0:
        change_percent = 0.0
    else:
        change_percent = (
            (current_pm25 - baseline)
            / baseline
        ) * 100.0

    score = _clip(
        abs(change_percent) / 100.0
    )

    absolute_change = abs(change_percent)

    if absolute_change >= 100:
        severity = "SEVERE"
    elif absolute_change >= 50:
        severity = "HIGH"
    elif absolute_change >= 25:
        severity = "MODERATE"
    else:
        severity = "NORMAL"

    return {
        "baseline": round(baseline, 2),
        "change_percent": round(change_percent, 2),
        "score": round(score, 3),
        "severity": severity,
        "baseline_type": "time_matched_historical",
        "reference_samples": int(len(reference)),
    }


# -------------------------------------------------------------------
# Multivariate environmental anomaly
# -------------------------------------------------------------------

def _multivariate_anomaly(
    city: str,
    current_row: dict,
) -> dict:

    history = _get_city_history(city)

    features = [
        "pm2_5",
        "pm10",
        "nitrogen_dioxide",
        "temperature_2m",
        "relative_humidity_2m",
        "wind_speed_10m",
        "surface_pressure",
        "precipitation",
    ]

    z_scores = []

    for feature in features:

        if feature not in current_row:
            continue

        value = current_row.get(feature)

        if value is None or pd.isna(value):
            continue

        series = history[feature].dropna()

        if len(series) < 2:
            continue

        mean = float(series.mean())
        std = float(series.std())

        z = _safe_z_score(
            float(value),
            mean,
            std,
        )

        z_scores.append(abs(z))

    if not z_scores:

        return {
            "score": 0.0,
            "max_absolute_z": 0.0,
            "severity": "NORMAL",
        }

    max_absolute_z = max(z_scores)

    # Use average of strongest deviations.
    strongest = sorted(
        z_scores,
        reverse=True
    )[:3]

    average_deviation = float(
        np.mean(strongest)
    )

    score = _clip(
        average_deviation / 3.0
    )

    if max_absolute_z >= 4.0:
        severity = "SEVERE"
    elif max_absolute_z >= 3.0:
        severity = "HIGH"
    elif max_absolute_z >= 2.0:
        severity = "MODERATE"
    else:
        severity = "NORMAL"

    return {
        "score": round(score, 3),
        "max_absolute_z": round(max_absolute_z, 3),
        "severity": severity,
    }


# -------------------------------------------------------------------
# Main anomaly engine
# -------------------------------------------------------------------

def detect_anomaly(
    city: str,
    current_row: dict,
) -> dict:

    if "pm2_5" not in current_row:
        raise ValueError(
            "current_row must contain pm2_5"
        )

    current_pm25 = float(
        current_row["pm2_5"]
    )

    profile = _get_city_profile(city)

    statistical = _pm25_anomaly(
        current_pm25,
        profile,
    )

    temporal = _temporal_anomaly(
        city,
        current_pm25,
        current_row,
    )

    multivariate = _multivariate_anomaly(
        city,
        current_row,
    )

    # Weighted fusion.
    #
    # PM2.5 statistical deviation:
    # 40%
    #
    # Recent temporal deviation:
    # 30%
    #
    # Multivariate environmental deviation:
    # 30%
    #
    anomaly_score = (
        0.40 * statistical["score"]
        + 0.30 * temporal["score"]
        + 0.30 * multivariate["score"]
    )

    anomaly_score = _clip(
        anomaly_score
    )

    # Final severity.
    if anomaly_score >= 0.75:
        severity = "SEVERE"
        status = "ANOMALOUS"

    elif anomaly_score >= 0.50:
        severity = "HIGH"
        status = "UNUSUAL"

    elif anomaly_score >= 0.25:
        severity = "MODERATE"
        status = "UNUSUAL"

    else:
        severity = "NORMAL"
        status = "NORMAL"

    signals = []

    if statistical["severity"] != "NORMAL":
        signals.append(
            "PM2.5 statistical deviation"
        )

    if temporal["severity"] != "NORMAL":
        signals.append(
            "Recent PM2.5 change"
        )

    if multivariate["severity"] != "NORMAL":
        signals.append(
            "Unusual environmental conditions"
        )

    if not signals:
        signals.append(
            "No strong anomaly signal detected"
        )

    return {
        "status": status,
        "severity": severity,
        "score": round(anomaly_score, 3),

        "signals": signals,

        "statistical": statistical,

        "temporal": temporal,

        "multivariate": multivariate,

        "historical_profile": {
            "mean_pm25": round(
                profile["mean"],
                2,
            ),
            "std_pm25": round(
                profile["std"],
                2,
            ),
            "median_pm25": round(
                profile["median"],
                2,
            ),
            "q1_pm25": round(
                profile["q1"],
                2,
            ),
            "q3_pm25": round(
                profile["q3"],
                2,
            ),
        },

        "method": (
            "Weighted statistical, temporal, and "
            "multivariate anomaly detection"
        ),

        "interpretation": (
            "Anomaly score measures deviation from "
            "historical environmental patterns. It does "
            "not by itself indicate a regulatory violation."
        ),
    }